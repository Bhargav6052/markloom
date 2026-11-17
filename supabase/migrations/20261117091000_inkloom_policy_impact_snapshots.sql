-- Exact fact dependencies remain precise. For policy changes, use the
-- current approval passport or the latest completed analysis snapshot.
-- Snapshot inclusion means potentially affected, not a proven violation.
create function inkloom_private.policy_impact_candidates(p_org uuid, p_source uuid, p_version uuid, p_retire boolean)
returns table(id uuid, title text, status text, current_version_id uuid, owner_id uuid, quote text, old_fact text)
language sql stable security invoker set search_path='' as $$
 select distinct c.id,c.title,c.status,c.current_version_id,c.owner_id,
   d.quote,v.body
 from public.inkloom_content c
 join public.inkloom_dependencies d on d.content_version_id=c.current_version_id and d.org_id=c.org_id
 join public.inkloom_source_versions v on v.id=d.fact_version_id and v.org_id=c.org_id
 where c.org_id=p_org and v.source_id=p_source and (v.id<>p_version or p_retire)
 union
 select distinct c.id,c.title,c.status,c.current_version_id,c.owner_id,
   'Policy included in review evidence'::text,v.body
 from public.inkloom_content c
 join public.inkloom_source_versions v on v.org_id=c.org_id and v.source_id=p_source
 join public.inkloom_sources src on src.id=v.source_id and src.org_id=c.org_id and src.kind<>'fact'
 left join lateral (
   select p.source_snapshot from public.inkloom_passports p
   where p.org_id=c.org_id and p.content_version_id=c.current_version_id
   order by p.created_at desc,p.id desc limit 1
 ) p on c.status='approved'
 left join lateral (
   select a.source_snapshot from public.inkloom_analysis_runs a
   where a.org_id=c.org_id and a.content_version_id=c.current_version_id and a.status='complete'
   order by a.created_at desc,a.id desc limit 1
 ) a on true
 where c.org_id=p_org and (v.id<>p_version or p_retire)
   and coalesce(p.source_snapshot,a.source_snapshot,'[]'::jsonb)
       @> jsonb_build_array(jsonb_build_object('id',v.id))
$$;
revoke all on function inkloom_private.policy_impact_candidates(uuid,uuid,uuid,boolean) from public,anon,authenticated;

create or replace function inkloom_private.mutate(p_org uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); r text; result jsonb:='{}'; rid uuid; sid uuid; vid uuid; oldid uuid; cid uuid; did uuid; n int;
 src public.inkloom_sources; sv public.inkloom_source_versions; cv public.inkloom_content_versions; ct public.inkloom_content; ar public.inkloom_analysis_runs; rr public.inkloom_review_requests;
 inv public.inkloom_invites; target_role text; item record; cfg jsonb; prov jsonb; rt text; extracted text;
begin
 if u is null then raise exception 'denied: authentication required'; end if;
 if p_action='create_org' then
  if length(trim(p_data->>'name')) not between 1 and 120 then raise exception 'invalid: workspace name'; end if;
  insert into public.inkloom_organizations(name,created_by) values(trim(p_data->>'name'),u) returning id into rid;
  insert into public.inkloom_memberships(org_id,user_id,role) values(rid,u,'admin');
  insert into public.inkloom_profiles(id) values(u) on conflict do nothing;
  perform inkloom_private.audit(rid,u,p_action,rid); return jsonb_build_object('id',rid);
 elsif p_action='accept_invite' then
  select * into inv from public.inkloom_invites where id=(p_data->>'id')::uuid for update;
  if inv.id is null or inv.accepted_by is not null or inv.expires_at<=now() or lower(inv.email)<>lower(auth.jwt()->>'email') then raise exception 'denied: invalid invitation'; end if;
  insert into public.inkloom_memberships(org_id,user_id,role) values(inv.org_id,u,inv.role);
  update public.inkloom_invites set accepted_by=u where id=inv.id;
  perform inkloom_private.audit(inv.org_id,u,p_action,inv.id); return jsonb_build_object('id',inv.org_id);
 end if;
 r:=inkloom_private.member_role(p_org);
 if r is null then raise exception 'denied: workspace membership required'; end if;
 -- Serialize source changes, analysis finalization, content edits and approval decisions.
 perform 1 from public.inkloom_organizations where id=p_org for update;
 if p_action in ('invite','set_role','register_document','approve_asset','save_source','activate_source','retire_source') and r<>'admin' then raise exception 'denied: admin role required'; end if;
 if p_action='invite' then
  if coalesce(p_data->>'email','') !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' then raise exception 'invalid: email'; end if;
  insert into public.inkloom_invites(org_id,email,role,created_by) values(p_org,lower(p_data->>'email'),p_data->>'role',u) returning id into rid;
  result:=jsonb_build_object('id',rid);
 elsif p_action='set_role' then
  if (p_data->>'user_id')::uuid=u then raise exception 'denied: cannot change your own role'; end if;
  update public.inkloom_memberships set role=p_data->>'role' where org_id=p_org and user_id=(p_data->>'user_id')::uuid returning id into rid;
  if rid is null then raise exception 'invalid: member not found'; end if;
 elsif p_action='register_document' then
  -- Actual registration is restricted to trusted backend finalize_upload; public clients cannot forge extraction/hash.
  raise exception 'denied: upload through the backend';
 elsif p_action='approve_asset' then
  update public.inkloom_assets set approved=true where id=(p_data->>'id')::uuid and org_id=p_org returning id into rid;
  if rid is null then raise exception 'invalid: asset not found'; end if;
 elsif p_action='save_source' then
  sid:=nullif(p_data->>'source_id','')::uuid;
  if sid is null then
   insert into public.inkloom_sources(org_id,name,kind) values(p_org,p_data->>'name',p_data->>'kind') returning id into sid;
  end if;
  select * into src from public.inkloom_sources where id=sid and org_id=p_org for update;
  if src.id is null then raise exception 'invalid: source not found'; end if;
  rt:=coalesce(p_data->>'rule_type',src.kind);cfg:=coalesce(p_data->'config','{}');
  if (src.kind='fact')<>(rt='fact') then raise exception 'invalid: source kind cannot change'; end if;
  if rt='forbidden_term' and coalesce(length(cfg->>'term'),0) not between 1 and 200 then raise exception 'invalid: prohibited term is required'; end if;
  if rt='dimensions' and (coalesce((cfg->>'width')::int,0) not between 1 and 20000 or coalesce((cfg->>'height')::int,0) not between 1 and 20000) then raise exception 'invalid: dimensions must be between 1 and 20000'; end if;
  if rt='palette' then
   if jsonb_typeof(cfg->'colors') is distinct from 'array' or jsonb_array_length(cfg->'colors') not between 1 and 20 then raise exception 'invalid: palette requires 1 to 20 hex colors'; end if;
   if exists(select 1 from jsonb_array_elements_text(cfg->'colors') color where color !~ '^#[0-9a-fA-F]{6}$') or coalesce((cfg->>'tolerance')::numeric,45) not between 0 and 442 then raise exception 'invalid: palette configuration'; end if;
  end if;
  if rt='contrast' and coalesce((cfg->>'minimum')::numeric,4.5) not between 1 and 21 then raise exception 'invalid: contrast threshold'; end if;
  if rt='fact' and (cfg ? 'subject' or cfg ? 'value') and (coalesce(length(cfg->>'subject'),0)=0 or coalesce(length(cfg->>'value'),0)=0 or position(cfg->>'subject' in p_data->>'body')=0 or position(cfg->>'value' in p_data->>'body')=0) then raise exception 'invalid: exact fact subject and value must occur in approved text'; end if;
  select coalesce(max(version),0)+1 into n from public.inkloom_source_versions where source_id=sid;
  did:=nullif(p_data->>'document_id','')::uuid;
  if did is not null and not exists(select 1 from public.inkloom_documents where id=did and org_id=p_org and position(p_data->>'body' in extracted_text)>0) then raise exception 'invalid: source passage not found in document'; end if;
  prov:='{}';
  if did is not null then
   select (x-'text')||jsonb_build_object('start',(x->>'start')::int+position(p_data->>'body' in x->>'text')-1,'end',(x->>'start')::int+position(p_data->>'body' in x->>'text')-1+length(p_data->>'body')) into prov
   from public.inkloom_documents d,jsonb_array_elements(d.provenance) x where d.id=did and position(p_data->>'body' in x->>'text')>0 limit 1;
   prov:=coalesce(prov,jsonb_build_object('note','Passage spans extraction blocks; see original document'));
  end if;
  insert into public.inkloom_source_versions(org_id,source_id,version,body,rule_type,config,document_id,provenance,created_by,valid_from,expires_at)
  values(p_org,sid,n,p_data->>'body',coalesce(p_data->>'rule_type',src.kind),coalesce(p_data->'config','{}'),did,prov,u,coalesce(nullif(p_data->>'valid_from','')::timestamptz,now()),nullif(p_data->>'expires_at','')::timestamptz) returning id into rid;
  result:=jsonb_build_object('id',rid,'source_id',sid);
 elsif p_action='impact_preview' then
  select * into sv from public.inkloom_source_versions where id=(p_data->>'id')::uuid and org_id=p_org;
  if sv.id is null then raise exception 'invalid: version not found'; end if;
  select coalesce(jsonb_agg(x),'[]') into result from (
   select distinct c.id,c.title,c.status,c.current_version_id,c.quote,c.old_fact,sv.body as new_fact
   from inkloom_private.policy_impact_candidates(p_org,sv.source_id,sv.id,false) c
  ) x;
  return result;
 elsif p_action in ('activate_source','retire_source') then
  select * into sv from public.inkloom_source_versions where id=(p_data->>'id')::uuid and org_id=p_org for update;
  if sv.id is null then raise exception 'invalid: version not found'; end if;
  select * into src from public.inkloom_sources where id=sv.source_id and org_id=p_org for update;
  rid:=sv.id;oldid:=src.current_version_id;
  if p_action='activate_source' and src.current_version_id=sv.id and sv.status='approved' then return jsonb_build_object('id',sv.id,'idempotent',true); end if;
  if p_action='activate_source' then
   if sv.status<>'draft' or sv.valid_from>now() or (sv.expires_at is not null and sv.expires_at<=now()) then raise exception 'invalid: only effective draft versions can be activated'; end if;
   update public.inkloom_source_versions set status='retired' where id=oldid;
   update public.inkloom_source_versions set status='approved' where id=sv.id;
   update public.inkloom_sources set current_version_id=sv.id where id=src.id;
  else
   if src.current_version_id is distinct from sv.id then raise exception 'invalid: only current versions can be retired'; end if;
   update public.inkloom_source_versions set status='retired' where id=sv.id;
   update public.inkloom_sources set current_version_id=null where id=src.id;
  end if;
  insert into public.inkloom_fact_changes(org_id,source_id,old_version_id,new_version_id,actor) values(p_org,src.id,oldid,sv.id,u) returning id into did;
  for item in select distinct c.id,c.current_version_id,c.owner_id,c.title
   from inkloom_private.policy_impact_candidates(p_org,src.id,sv.id,p_action='retire_source') c
  loop
   insert into public.inkloom_impacts(org_id,change_id,content_id,content_version_id) values(p_org,did,item.id,item.current_version_id) on conflict do nothing;
   update public.inkloom_content set status='needs_review' where id=item.id;
   update public.inkloom_review_requests set status='superseded' where content_version_id=item.current_version_id and status='pending';
   insert into public.inkloom_notifications(org_id,user_id,message,content_id)
    select p_org,m.user_id,'Approved evidence changed: '||item.title||' requires re-review',item.id from public.inkloom_memberships m where m.org_id=p_org and (m.user_id=item.owner_id or m.role='manager');
  end loop;
 elsif p_action in ('create_content','revise_content') then
  if r not in ('creator','admin') then raise exception 'denied: creator role required'; end if;
  if p_action='create_content' then
   insert into public.inkloom_content(org_id,title,channel,owner_id) values(p_org,p_data->>'title',coalesce(p_data->>'channel','General'),u) returning id into cid;
  else cid:=(p_data->>'id')::uuid; end if;
  select * into ct from public.inkloom_content where id=cid and org_id=p_org for update;
  if ct.id is null or (ct.owner_id<>u and r<>'admin') then raise exception 'denied: content owner required'; end if;
  if p_action='revise_content' and ct.current_version_id is distinct from (p_data->>'expected_version_id')::uuid then raise exception 'conflict: content was revised; reload'; end if;
  did:=nullif(p_data->>'document_id','')::uuid;
  if did is not null and not exists(select 1 from public.inkloom_documents where id=did and org_id=p_org and created_by=u) then raise exception 'denied: uploaded document not owned by you'; end if;
  cfg:=coalesce(p_data->'metadata','{}');
  if jsonb_typeof(cfg)<>'object' or exists(select 1 from jsonb_object_keys(cfg) k where k not in ('alt_text','foreground','background','classification')) then raise exception 'invalid: unsupported content metadata'; end if;
  if coalesce(cfg->>'classification','CONFIDENTIAL') not in ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED') then raise exception 'invalid: classification'; end if;
  if (cfg ? 'foreground')<>(cfg ? 'background') or (cfg ? 'foreground' and ((cfg->>'foreground') !~ '^#[0-9a-fA-F]{6}$' or (cfg->>'background') !~ '^#[0-9a-fA-F]{6}$')) then raise exception 'invalid: declared colors require a valid hex pair'; end if;
  if did is not null then
   select extracted_text into extracted from public.inkloom_documents where id=did and mime not like 'image/%';
   if extracted is not null and extracted<>coalesce(p_data->>'body','') then raise exception 'invalid: edited document text differs from the original binary; upload a corrected file or remove the attachment'; end if;
  end if;
  select coalesce(max(version),0)+1 into n from public.inkloom_content_versions where content_id=cid;
  insert into public.inkloom_content_versions(org_id,content_id,version,body,sha256,document_id,creator_intent,metadata,created_by)
   values(p_org,cid,n,coalesce(p_data->>'body',''),encode(sha256(convert_to(coalesce(p_data->>'body','')||coalesce((select sha256 from public.inkloom_documents where id=did),''),'UTF8')),'hex'),did,coalesce(p_data->>'creator_intent',''),coalesce(p_data->'metadata','{}'),u) returning id into vid;
  update public.inkloom_content set current_version_id=vid,status='draft' where id=cid;
  update public.inkloom_review_requests set status='superseded' where content_version_id=ct.current_version_id and status='pending';
  rid:=cid; result:=jsonb_build_object('id',cid,'version_id',vid);
 elsif p_action='correction_decision' then
  select v.* into cv from public.inkloom_issues i join public.inkloom_analysis_runs a on a.id=i.run_id join public.inkloom_content_versions v on v.id=a.content_version_id where i.id=(p_data->>'issue_id')::uuid and i.org_id=p_org;
  select * into ct from public.inkloom_content where id=cv.content_id;
  if ct.id is null or (ct.owner_id<>u and r<>'admin') then raise exception 'denied: content owner required'; end if;
  insert into public.inkloom_correction_decisions(org_id,issue_id,actor,choice,reason) values(p_org,(p_data->>'issue_id')::uuid,u,p_data->>'choice',coalesce(p_data->>'reason',''))
   on conflict(issue_id,actor) do update set choice=excluded.choice,reason=excluded.reason;
  rid:=(p_data->>'issue_id')::uuid;
 elsif p_action='submit' then
  select * into cv from public.inkloom_content_versions where id=(p_data->>'version_id')::uuid and org_id=p_org;
  select * into ct from public.inkloom_content where id=cv.content_id for update;
  if ct.id is null or ct.current_version_id<>cv.id or (ct.owner_id<>u and r<>'admin') then raise exception 'denied: current content owner required'; end if;
  if ct.status not in ('analyzed','changes_requested','rejected') then raise exception 'invalid: run a fresh analysis before submission'; end if;
  select * into ar from public.inkloom_analysis_runs where content_version_id=cv.id and status='complete' order by created_at desc limit 1;
  if ar.id is null or ar.source_snapshot<>inkloom_private.effective_sources(p_org) then raise exception 'conflict: approved evidence changed; rerun analysis'; end if;
  if nullif(p_data->>'assigned_to','') is not null and not exists(select 1 from public.inkloom_memberships where org_id=p_org and user_id=(p_data->>'assigned_to')::uuid and role in ('manager','reviewer')) then raise exception 'invalid: assign a manager or reviewer'; end if;
  insert into public.inkloom_review_requests(org_id,content_version_id,run_id,submitted_by,assigned_to) values(p_org,cv.id,ar.id,u,nullif(p_data->>'assigned_to','')::uuid) returning id into rid;
  update public.inkloom_content set status='submitted' where id=ct.id;
  insert into public.inkloom_notifications(org_id,user_id,message,content_id) select p_org,user_id,'Review requested: '||ct.title,ct.id from public.inkloom_memberships where org_id=p_org and role in ('manager','reviewer') and (nullif(p_data->>'assigned_to','') is null or user_id=(p_data->>'assigned_to')::uuid);
 elsif p_action='comment' then
  if not exists(select 1 from public.inkloom_content_versions where id=(p_data->>'version_id')::uuid and org_id=p_org) then raise exception 'invalid: version not found'; end if;
  insert into public.inkloom_comments(org_id,content_version_id,author_id,body) values(p_org,(p_data->>'version_id')::uuid,u,p_data->>'body') returning id into rid;
 elsif p_action='decide' then
  select * into rr from public.inkloom_review_requests where id=(p_data->>'id')::uuid and org_id=p_org for update;
  if rr.id is null or rr.status<>'pending' then raise exception 'conflict: request is not pending'; end if;
  select * into cv from public.inkloom_content_versions where id=rr.content_version_id;
  select * into ct from public.inkloom_content where id=cv.content_id for update;
  if r not in ('manager','reviewer') or (r='reviewer' and rr.assigned_to is distinct from u) or ct.owner_id=u then raise exception 'denied: independent authorized human reviewer required'; end if;
  if ct.current_version_id<>cv.id or ct.status<>'submitted' then raise exception 'conflict: stale content version'; end if;
  select * into ar from public.inkloom_analysis_runs where id=rr.run_id;
  if ar.status<>'complete' or ar.source_snapshot<>inkloom_private.effective_sources(p_org) then raise exception 'conflict: evidence changed; rerun analysis'; end if;
  insert into public.inkloom_decisions(org_id,request_id,actor,decision,reason) values(p_org,rr.id,u,p_data->>'decision',p_data->>'reason') returning id into rid;
  if p_data->>'decision'='approved' then
   insert into public.inkloom_passports(org_id,decision_id,content_version_id,sha256,approver,source_snapshot) values(p_org,rid,cv.id,cv.sha256,u,ar.source_snapshot);
   update public.inkloom_impacts set status='resolved' where content_id=ct.id and org_id=p_org and status='open';
  end if;
  update public.inkloom_review_requests set status='decided' where id=rr.id;
  update public.inkloom_content set status=p_data->>'decision' where id=ct.id;
  insert into public.inkloom_notifications(org_id,user_id,message,content_id) values(p_org,ct.owner_id,'Human decision: '||(p_data->>'decision')||' — '||ct.title,ct.id);
 elsif p_action='read_notification' then
  update public.inkloom_notifications set read_at=now() where id=(p_data->>'id')::uuid and org_id=p_org and user_id=u returning id into rid;
  if rid is null then raise exception 'denied: notification not found'; end if;
 else raise exception 'invalid: unknown action';
 end if;
 perform inkloom_private.audit(p_org,u,p_action,rid);
 return result||jsonb_build_object('id',coalesce(rid,cid));
end $$;
