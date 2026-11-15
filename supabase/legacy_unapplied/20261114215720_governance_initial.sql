-- Reviewed source for the initial migration. Generated migration is the install artifact.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 120),
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.memberships (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id),
 user_id uuid not null references auth.users(id), role text not null check(role in ('admin','creator','manager','reviewer')),
 created_at timestamptz not null default now(), unique(org_id,user_id)
);
create table public.profiles (
 id uuid primary key references auth.users(id), display_name text not null default '', created_at timestamptz not null default now()
);
create table public.invites (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id),
 email text not null, role text not null check(role in ('admin','creator','manager','reviewer')),
 created_by uuid not null references auth.users(id), accepted_by uuid references auth.users(id),
 expires_at timestamptz not null default now()+interval '7 days', created_at timestamptz not null default now(), unique(id,org_id)
);
create table public.documents (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id),
 name text not null, object_path text not null, mime text not null, sha256 text not null check(length(sha256)=64),
 extracted_text text not null, provenance jsonb not null default '[]', metadata jsonb not null default '{}',
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(id,org_id)
);
create table public.assets (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id),
 document_id uuid not null, approved boolean not null default false,
 created_at timestamptz not null default now(), unique(id,org_id),
 foreign key(document_id,org_id) references public.documents(id,org_id)
);
create table public.sources (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id),
 name text not null, kind text not null check(kind in ('fact','rule')), current_version_id uuid,
 created_at timestamptz not null default now(), unique(id,org_id)
);
create table public.source_versions (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id),
 source_id uuid not null, version int not null check(version>0), body text not null check(length(body) between 1 and 20000),
 rule_type text not null default 'fact' check(rule_type in ('fact','tone','forbidden_term','required_disclaimer','palette','dimensions','contrast')),
 config jsonb not null default '{}', document_id uuid, provenance jsonb not null default '{}',
 status text not null default 'draft' check(status in ('draft','approved','retired')),
 valid_from timestamptz not null default now(), expires_at timestamptz,
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 check(expires_at is null or expires_at>valid_from), unique(id,org_id), unique(source_id,version),
 foreign key(source_id,org_id) references public.sources(id,org_id),
 foreign key(document_id,org_id) references public.documents(id,org_id)
);
alter table public.sources add foreign key(current_version_id,org_id) references public.source_versions(id,org_id);
create table public.content (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id),
 title text not null check(length(title) between 1 and 200), channel text not null check(length(channel)<=100),
 owner_id uuid not null references auth.users(id), current_version_id uuid,
 status text not null default 'draft' check(status in ('draft','analyzed','submitted','approved','changes_requested','rejected','needs_review')),
 created_at timestamptz not null default now(), unique(id,org_id)
);
create table public.content_versions (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id),
 content_id uuid not null, version int not null check(version>0), body text not null check(length(body)<=100000),
 sha256 text not null check(length(sha256)=64), document_id uuid, creator_intent text not null default '',
 metadata jsonb not null default '{}', created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 unique(id,org_id), unique(content_id,version), foreign key(content_id,org_id) references public.content(id,org_id),
 foreign key(document_id,org_id) references public.documents(id,org_id)
);
alter table public.content add foreign key(current_version_id,org_id) references public.content_versions(id,org_id);
create table public.analysis_runs (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id),
 content_version_id uuid not null, requested_by uuid not null references auth.users(id),
 status text not null check(status in ('running','complete','error','blocked')), source_snapshot jsonb not null default '[]',
 provider text not null, model text not null, error text, created_at timestamptz not null default now(), completed_at timestamptz,
 unique(id,org_id), foreign key(content_version_id,org_id) references public.content_versions(id,org_id)
);
create unique index one_running_analysis on public.analysis_runs(content_version_id) where status='running';
create table public.issues (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id), run_id uuid not null,
 category text not null, severity text not null check(severity in ('info','warning','critical')), quote text not null, explanation text not null,
 source_id uuid, evidence_quote text not null default '', evidence_status text not null check(evidence_status in ('SUPPORTED','CONTRADICTED','INSUFFICIENT_EVIDENCE','NOT_APPLICABLE')),
 correction text not null default '', created_at timestamptz not null default now(), unique(id,org_id),
 foreign key(run_id,org_id) references public.analysis_runs(id,org_id), foreign key(source_id,org_id) references public.source_versions(id,org_id)
);
create table public.dependencies (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id), run_id uuid not null,
 content_version_id uuid not null, fact_version_id uuid not null, quote text not null, evidence_quote text not null,
 created_at timestamptz not null default now(), unique(run_id,fact_version_id,quote),
 foreign key(run_id,org_id) references public.analysis_runs(id,org_id),
 foreign key(content_version_id,org_id) references public.content_versions(id,org_id),
 foreign key(fact_version_id,org_id) references public.source_versions(id,org_id)
);
create table public.correction_decisions (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id), issue_id uuid not null,
 actor uuid not null references auth.users(id), choice text not null check(choice in ('accepted','edited','dismissed')), reason text not null,
 created_at timestamptz not null default now(), unique(issue_id,actor), foreign key(issue_id,org_id) references public.issues(id,org_id)
);
create table public.review_requests (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id), content_version_id uuid not null,
 run_id uuid not null, assigned_to uuid, submitted_by uuid not null references auth.users(id), status text not null default 'pending' check(status in ('pending','decided','superseded')),
 created_at timestamptz not null default now(), unique(id,org_id),
 foreign key(content_version_id,org_id) references public.content_versions(id,org_id), foreign key(run_id,org_id) references public.analysis_runs(id,org_id),
 foreign key(org_id,assigned_to) references public.memberships(org_id,user_id)
);
create unique index one_pending_request on public.review_requests(content_version_id) where status='pending';
create table public.comments (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id), content_version_id uuid not null,
 author_id uuid not null references auth.users(id), body text not null check(length(body) between 1 and 4000),
 created_at timestamptz not null default now(), foreign key(content_version_id,org_id) references public.content_versions(id,org_id)
);
create table public.decisions (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id), request_id uuid not null,
 actor uuid not null references auth.users(id), decision text not null check(decision in ('approved','changes_requested','rejected')),
 reason text not null check(length(reason) between 1 and 4000), created_at timestamptz not null default now(), unique(request_id), unique(id,org_id),
 foreign key(request_id,org_id) references public.review_requests(id,org_id)
);
create table public.passports (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id), decision_id uuid not null,
 content_version_id uuid not null, sha256 text not null, approver uuid not null references auth.users(id), source_snapshot jsonb not null,
 created_at timestamptz not null default now(), foreign key(decision_id,org_id) references public.decisions(id,org_id),
 foreign key(content_version_id,org_id) references public.content_versions(id,org_id)
);
create table public.fact_changes (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id), source_id uuid not null,
 old_version_id uuid, new_version_id uuid not null, actor uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(id,org_id),
 foreign key(source_id,org_id) references public.sources(id,org_id), foreign key(old_version_id,org_id) references public.source_versions(id,org_id),
 foreign key(new_version_id,org_id) references public.source_versions(id,org_id)
);
create table public.impacts (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id), change_id uuid not null,
 content_id uuid not null, content_version_id uuid not null, status text not null default 'open' check(status in ('open','resolved')),
 created_at timestamptz not null default now(), unique(change_id,content_version_id), foreign key(change_id,org_id) references public.fact_changes(id,org_id),
 foreign key(content_id,org_id) references public.content(id,org_id), foreign key(content_version_id,org_id) references public.content_versions(id,org_id)
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id), user_id uuid not null references auth.users(id),
 message text not null, content_id uuid, read_at timestamptz, created_at timestamptz not null default now(), foreign key(content_id,org_id) references public.content(id,org_id)
);
create table public.audit_log (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id), actor uuid not null references auth.users(id),
 action text not null, target_id uuid, detail jsonb not null default '{}', created_at timestamptz not null default now()
);

create function private.member_role(o uuid) returns text language sql stable security definer set search_path='' as $$
 select role from public.memberships where org_id=o and user_id=auth.uid()
$$;
revoke all on function private.member_role(uuid) from public;
grant execute on function private.member_role(uuid) to authenticated;

-- Exposed application tables are read-only. All writes enforce business invariants through RPC.
do $$ declare t text; begin
 foreach t in array array['memberships','documents','assets','sources','source_versions','content','content_versions','analysis_runs','issues','dependencies','correction_decisions','review_requests','comments','decisions','passports','fact_changes','impacts','audit_log'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy tenant_read on public.%I for select to authenticated using (private.member_role(org_id) is not null)',t);
 execute format('create index on public.%I (org_id)',t);
 end loop;
end $$;
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.notifications enable row level security;
revoke all on public.organizations, public.profiles, public.invites, public.notifications from anon,authenticated;
grant select on public.organizations, public.profiles, public.invites, public.notifications to authenticated;
create policy org_read on public.organizations for select to authenticated using(private.member_role(id) is not null);
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid());
create policy invite_read on public.invites for select to authenticated using(private.member_role(org_id)='admin' or lower(email)=lower(auth.jwt()->>'email'));
create policy notification_read on public.notifications for select to authenticated using(private.member_role(org_id) is not null and user_id=auth.uid());
create index on public.memberships(user_id);
create index on public.dependencies(fact_version_id);
create index on public.dependencies(content_version_id);
create index on public.notifications(org_id,user_id);
create index on public.invites(org_id,email);

create function private.effective_sources(o uuid) returns jsonb language sql stable set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(v) order by v.id),'[]') from public.source_versions v join public.sources s on s.current_version_id=v.id
 where v.org_id=o and v.status='approved' and v.valid_from<=now() and (v.expires_at is null or v.expires_at>now())
$$;
revoke all on function private.effective_sources(uuid) from public;

create function private.audit(o uuid,a uuid,act text,target uuid) returns void language sql set search_path='' as $$
 insert into public.audit_log(org_id,actor,action,target_id) values(o,a,act,target)
$$;
revoke all on function private.audit(uuid,uuid,text,uuid) from public;

create function private.mutate(p_org uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); r text; result jsonb:='{}'; rid uuid; sid uuid; vid uuid; oldid uuid; cid uuid; did uuid; n int;
 src public.sources; sv public.source_versions; cv public.content_versions; ct public.content; ar public.analysis_runs; rr public.review_requests;
 inv public.invites; target_role text; item record; cfg jsonb; prov jsonb; rt text; extracted text;
begin
 if u is null then raise exception 'denied: authentication required'; end if;
 if p_action='create_org' then
  if length(trim(p_data->>'name')) not between 1 and 120 then raise exception 'invalid: workspace name'; end if;
  insert into public.organizations(name,created_by) values(trim(p_data->>'name'),u) returning id into rid;
  insert into public.memberships(org_id,user_id,role) values(rid,u,'admin');
  insert into public.profiles(id) values(u) on conflict do nothing;
  perform private.audit(rid,u,p_action,rid); return jsonb_build_object('id',rid);
 elsif p_action='accept_invite' then
  select * into inv from public.invites where id=(p_data->>'id')::uuid for update;
  if inv.id is null or inv.accepted_by is not null or inv.expires_at<=now() or lower(inv.email)<>lower(auth.jwt()->>'email') then raise exception 'denied: invalid invitation'; end if;
  insert into public.memberships(org_id,user_id,role) values(inv.org_id,u,inv.role);
  update public.invites set accepted_by=u where id=inv.id;
  perform private.audit(inv.org_id,u,p_action,inv.id); return jsonb_build_object('id',inv.org_id);
 end if;
 r:=private.member_role(p_org);
 if r is null then raise exception 'denied: workspace membership required'; end if;
 -- Serialize source changes, analysis finalization, content edits and approval decisions.
 perform 1 from public.organizations where id=p_org for update;
 if p_action in ('invite','set_role','register_document','approve_asset','save_source','activate_source','retire_source') and r<>'admin' then raise exception 'denied: admin role required'; end if;
 if p_action='invite' then
  if coalesce(p_data->>'email','') !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' then raise exception 'invalid: email'; end if;
  insert into public.invites(org_id,email,role,created_by) values(p_org,lower(p_data->>'email'),p_data->>'role',u) returning id into rid;
  result:=jsonb_build_object('id',rid);
 elsif p_action='set_role' then
  if (p_data->>'user_id')::uuid=u then raise exception 'denied: cannot change your own role'; end if;
  update public.memberships set role=p_data->>'role' where org_id=p_org and user_id=(p_data->>'user_id')::uuid returning id into rid;
  if rid is null then raise exception 'invalid: member not found'; end if;
 elsif p_action='register_document' then
  -- Actual registration is restricted to trusted backend finalize_upload; public clients cannot forge extraction/hash.
  raise exception 'denied: upload through the backend';
 elsif p_action='approve_asset' then
  update public.assets set approved=true where id=(p_data->>'id')::uuid and org_id=p_org returning id into rid;
  if rid is null then raise exception 'invalid: asset not found'; end if;
 elsif p_action='save_source' then
  sid:=nullif(p_data->>'source_id','')::uuid;
  if sid is null then
   insert into public.sources(org_id,name,kind) values(p_org,p_data->>'name',p_data->>'kind') returning id into sid;
  end if;
  select * into src from public.sources where id=sid and org_id=p_org for update;
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
  select coalesce(max(version),0)+1 into n from public.source_versions where source_id=sid;
  did:=nullif(p_data->>'document_id','')::uuid;
  if did is not null and not exists(select 1 from public.documents where id=did and org_id=p_org and position(p_data->>'body' in extracted_text)>0) then raise exception 'invalid: source passage not found in document'; end if;
  prov:='{}';
  if did is not null then
   select (x-'text')||jsonb_build_object('start',(x->>'start')::int+position(p_data->>'body' in x->>'text')-1,'end',(x->>'start')::int+position(p_data->>'body' in x->>'text')-1+length(p_data->>'body')) into prov
   from public.documents d,jsonb_array_elements(d.provenance) x where d.id=did and position(p_data->>'body' in x->>'text')>0 limit 1;
   prov:=coalesce(prov,jsonb_build_object('note','Passage spans extraction blocks; see original document'));
  end if;
  insert into public.source_versions(org_id,source_id,version,body,rule_type,config,document_id,provenance,created_by,valid_from,expires_at)
  values(p_org,sid,n,p_data->>'body',coalesce(p_data->>'rule_type',src.kind),coalesce(p_data->'config','{}'),did,prov,u,coalesce(nullif(p_data->>'valid_from','')::timestamptz,now()),nullif(p_data->>'expires_at','')::timestamptz) returning id into rid;
  result:=jsonb_build_object('id',rid,'source_id',sid);
 elsif p_action='impact_preview' then
  select * into sv from public.source_versions where id=(p_data->>'id')::uuid and org_id=p_org;
  if sv.id is null then raise exception 'invalid: version not found'; end if;
  select coalesce(jsonb_agg(x),'[]') into result from (
   select distinct c.id,c.title,c.status,c.current_version_id,d.quote,v.body as old_fact,sv.body as new_fact
   from public.dependencies d join public.source_versions v on v.id=d.fact_version_id
   join public.content c on c.current_version_id=d.content_version_id
   where d.org_id=p_org and v.source_id=sv.source_id and v.id<>sv.id
  ) x;
  return result;
 elsif p_action in ('activate_source','retire_source') then
  select * into sv from public.source_versions where id=(p_data->>'id')::uuid and org_id=p_org for update;
  if sv.id is null then raise exception 'invalid: version not found'; end if;
  select * into src from public.sources where id=sv.source_id and org_id=p_org for update;
  rid:=sv.id;oldid:=src.current_version_id;
  if p_action='activate_source' and src.current_version_id=sv.id and sv.status='approved' then return jsonb_build_object('id',sv.id,'idempotent',true); end if;
  if p_action='activate_source' then
   if sv.status<>'draft' or sv.valid_from>now() or (sv.expires_at is not null and sv.expires_at<=now()) then raise exception 'invalid: only effective draft versions can be activated'; end if;
   update public.source_versions set status='retired' where id=oldid;
   update public.source_versions set status='approved' where id=sv.id;
   update public.sources set current_version_id=sv.id where id=src.id;
  else
   if src.current_version_id is distinct from sv.id then raise exception 'invalid: only current versions can be retired'; end if;
   update public.source_versions set status='retired' where id=sv.id;
   update public.sources set current_version_id=null where id=src.id;
  end if;
  insert into public.fact_changes(org_id,source_id,old_version_id,new_version_id,actor) values(p_org,src.id,oldid,sv.id,u) returning id into did;
  for item in select distinct c.id,c.current_version_id,c.owner_id,c.title from public.content c
   join public.dependencies d on d.content_version_id=c.current_version_id
   join public.source_versions v on v.id=d.fact_version_id
   where c.org_id=p_org and v.source_id=src.id and (v.id<>sv.id or p_action='retire_source')
  loop
   insert into public.impacts(org_id,change_id,content_id,content_version_id) values(p_org,did,item.id,item.current_version_id) on conflict do nothing;
   update public.content set status='needs_review' where id=item.id;
   update public.review_requests set status='superseded' where content_version_id=item.current_version_id and status='pending';
   insert into public.notifications(org_id,user_id,message,content_id)
    select p_org,m.user_id,'Approved evidence changed: '||item.title||' requires re-review',item.id from public.memberships m where m.org_id=p_org and (m.user_id=item.owner_id or m.role='manager');
  end loop;
 elsif p_action in ('create_content','revise_content') then
  if r not in ('creator','admin') then raise exception 'denied: creator role required'; end if;
  if p_action='create_content' then
   insert into public.content(org_id,title,channel,owner_id) values(p_org,p_data->>'title',coalesce(p_data->>'channel','General'),u) returning id into cid;
  else cid:=(p_data->>'id')::uuid; end if;
  select * into ct from public.content where id=cid and org_id=p_org for update;
  if ct.id is null or (ct.owner_id<>u and r<>'admin') then raise exception 'denied: content owner required'; end if;
  if p_action='revise_content' and ct.current_version_id is distinct from (p_data->>'expected_version_id')::uuid then raise exception 'conflict: content was revised; reload'; end if;
  did:=nullif(p_data->>'document_id','')::uuid;
  if did is not null and not exists(select 1 from public.documents where id=did and org_id=p_org and created_by=u) then raise exception 'denied: uploaded document not owned by you'; end if;
  cfg:=coalesce(p_data->'metadata','{}');
  if jsonb_typeof(cfg)<>'object' or exists(select 1 from jsonb_object_keys(cfg) k where k not in ('alt_text','foreground','background')) then raise exception 'invalid: unsupported content metadata'; end if;
  if (cfg ? 'foreground')<>(cfg ? 'background') or (cfg ? 'foreground' and ((cfg->>'foreground') !~ '^#[0-9a-fA-F]{6}$' or (cfg->>'background') !~ '^#[0-9a-fA-F]{6}$')) then raise exception 'invalid: declared colors require a valid hex pair'; end if;
  if did is not null then
   select extracted_text into extracted from public.documents where id=did and mime not like 'image/%';
   if extracted is not null and extracted<>coalesce(p_data->>'body','') then raise exception 'invalid: edited document text differs from the original binary; upload a corrected file or remove the attachment'; end if;
  end if;
  select coalesce(max(version),0)+1 into n from public.content_versions where content_id=cid;
  insert into public.content_versions(org_id,content_id,version,body,sha256,document_id,creator_intent,metadata,created_by)
   values(p_org,cid,n,coalesce(p_data->>'body',''),encode(sha256(convert_to(coalesce(p_data->>'body','')||coalesce((select sha256 from public.documents where id=did),''),'UTF8')),'hex'),did,coalesce(p_data->>'creator_intent',''),coalesce(p_data->'metadata','{}'),u) returning id into vid;
  update public.content set current_version_id=vid,status='draft' where id=cid;
  update public.review_requests set status='superseded' where content_version_id=ct.current_version_id and status='pending';
  rid:=cid; result:=jsonb_build_object('id',cid,'version_id',vid);
 elsif p_action='correction_decision' then
  select v.* into cv from public.issues i join public.analysis_runs a on a.id=i.run_id join public.content_versions v on v.id=a.content_version_id where i.id=(p_data->>'issue_id')::uuid and i.org_id=p_org;
  select * into ct from public.content where id=cv.content_id;
  if ct.id is null or (ct.owner_id<>u and r<>'admin') then raise exception 'denied: content owner required'; end if;
  insert into public.correction_decisions(org_id,issue_id,actor,choice,reason) values(p_org,(p_data->>'issue_id')::uuid,u,p_data->>'choice',coalesce(p_data->>'reason',''))
   on conflict(issue_id,actor) do update set choice=excluded.choice,reason=excluded.reason;
  rid:=(p_data->>'issue_id')::uuid;
 elsif p_action='submit' then
  select * into cv from public.content_versions where id=(p_data->>'version_id')::uuid and org_id=p_org;
  select * into ct from public.content where id=cv.content_id for update;
  if ct.id is null or ct.current_version_id<>cv.id or (ct.owner_id<>u and r<>'admin') then raise exception 'denied: current content owner required'; end if;
  if ct.status not in ('analyzed','changes_requested','rejected') then raise exception 'invalid: run a fresh analysis before submission'; end if;
  select * into ar from public.analysis_runs where content_version_id=cv.id and status='complete' order by created_at desc limit 1;
  if ar.id is null or ar.source_snapshot<>private.effective_sources(p_org) then raise exception 'conflict: approved evidence changed; rerun analysis'; end if;
  if nullif(p_data->>'assigned_to','') is not null and not exists(select 1 from public.memberships where org_id=p_org and user_id=(p_data->>'assigned_to')::uuid and role in ('manager','reviewer')) then raise exception 'invalid: assign a manager or reviewer'; end if;
  insert into public.review_requests(org_id,content_version_id,run_id,submitted_by,assigned_to) values(p_org,cv.id,ar.id,u,nullif(p_data->>'assigned_to','')::uuid) returning id into rid;
  update public.content set status='submitted' where id=ct.id;
  insert into public.notifications(org_id,user_id,message,content_id) select p_org,user_id,'Review requested: '||ct.title,ct.id from public.memberships where org_id=p_org and role in ('manager','reviewer') and (nullif(p_data->>'assigned_to','') is null or user_id=(p_data->>'assigned_to')::uuid);
 elsif p_action='comment' then
  if not exists(select 1 from public.content_versions where id=(p_data->>'version_id')::uuid and org_id=p_org) then raise exception 'invalid: version not found'; end if;
  insert into public.comments(org_id,content_version_id,author_id,body) values(p_org,(p_data->>'version_id')::uuid,u,p_data->>'body') returning id into rid;
 elsif p_action='decide' then
  select * into rr from public.review_requests where id=(p_data->>'id')::uuid and org_id=p_org for update;
  if rr.id is null or rr.status<>'pending' then raise exception 'conflict: request is not pending'; end if;
  select * into cv from public.content_versions where id=rr.content_version_id;
  select * into ct from public.content where id=cv.content_id for update;
  if r not in ('manager','reviewer') or (r='reviewer' and rr.assigned_to is distinct from u) or ct.owner_id=u then raise exception 'denied: independent authorized human reviewer required'; end if;
  if ct.current_version_id<>cv.id or ct.status<>'submitted' then raise exception 'conflict: stale content version'; end if;
  select * into ar from public.analysis_runs where id=rr.run_id;
  if ar.status<>'complete' or ar.source_snapshot<>private.effective_sources(p_org) then raise exception 'conflict: evidence changed; rerun analysis'; end if;
  insert into public.decisions(org_id,request_id,actor,decision,reason) values(p_org,rr.id,u,p_data->>'decision',p_data->>'reason') returning id into rid;
  if p_data->>'decision'='approved' then
   insert into public.passports(org_id,decision_id,content_version_id,sha256,approver,source_snapshot) values(p_org,rid,cv.id,cv.sha256,u,ar.source_snapshot);
   update public.impacts set status='resolved' where content_id=ct.id and org_id=p_org and status='open';
  end if;
  update public.review_requests set status='decided' where id=rr.id;
  update public.content set status=p_data->>'decision' where id=ct.id;
  insert into public.notifications(org_id,user_id,message,content_id) values(p_org,ct.owner_id,'Human decision: '||(p_data->>'decision')||' — '||ct.title,ct.id);
 elsif p_action='read_notification' then
  update public.notifications set read_at=now() where id=(p_data->>'id')::uuid and org_id=p_org and user_id=u returning id into rid;
  if rid is null then raise exception 'denied: notification not found'; end if;
 else raise exception 'invalid: unknown action';
 end if;
 perform private.audit(p_org,u,p_action,rid);
 return result||jsonb_build_object('id',coalesce(rid,cid));
end $$;
revoke all on function private.mutate(uuid,text,jsonb) from public;
grant execute on function private.mutate(uuid,text,jsonb) to authenticated;
create function public.governance(p_org uuid,p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select private.mutate(p_org,p_action,p_data) $$;
revoke all on function public.governance(uuid,text,jsonb) from public;
grant execute on function public.governance(uuid,text,jsonb) to authenticated;

-- Only the trusted backend may register extracted uploads or persist validated AI output.
create function public.finalize_upload(p_org uuid,p_actor uuid,p_data jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare rid uuid; r text;
begin
 select role into r from public.memberships where org_id=p_org and user_id=p_actor;
 if r is null or (p_data->>'purpose' in ('knowledge','asset') and r<>'admin') or (p_data->>'purpose'='content' and r not in ('admin','creator')) then raise exception 'denied: upload role'; end if;
 if split_part(p_data->>'object_path','/',1)<>p_org::text or split_part(p_data->>'object_path','/',2)<>p_actor::text then raise exception 'denied: object path'; end if;
 insert into public.documents(org_id,name,object_path,mime,sha256,extracted_text,provenance,metadata,created_by)
 values(p_org,p_data->>'name',p_data->>'object_path',p_data->>'mime',p_data->>'sha256',coalesce(p_data->>'text',''),p_data->'provenance',p_data->'metadata',p_actor) returning id into rid;
 if p_data->>'purpose'='asset' then insert into public.assets(org_id,document_id) values(p_org,rid); end if;
 perform private.audit(p_org,p_actor,'upload',rid);
 return jsonb_build_object('id',rid);
end $$;
revoke all on function public.finalize_upload(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.finalize_upload(uuid,uuid,jsonb) to service_role;

create function public.begin_analysis(p_org uuid,p_actor uuid,p_version uuid,p_provider text,p_model text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare ct public.content; cv public.content_versions; rid uuid; r text;
begin
 perform 1 from public.organizations where id=p_org for update;
 select role into r from public.memberships where org_id=p_org and user_id=p_actor;
 select * into cv from public.content_versions where id=p_version and org_id=p_org;
 select * into ct from public.content where id=cv.content_id;
 if ct.id is null or ct.current_version_id<>p_version or (ct.owner_id<>p_actor and r<>'admin') or r not in ('admin','creator') then raise exception 'denied: current content owner required'; end if;
 if ct.status='submitted' then raise exception 'conflict: revise or await human decision before another analysis'; end if;
 -- A crashed process cannot leave a permanent lock. Expire abandoned attempts after 5 minutes.
 update public.analysis_runs set status='error',error='Analysis interrupted; retry required',completed_at=now() where content_version_id=p_version and status='running' and created_at<now()-interval '5 minutes';
 if exists(select 1 from public.analysis_runs where content_version_id=p_version and status='running') then raise exception 'conflict: analysis already running'; end if;
 insert into public.analysis_runs(org_id,content_version_id,requested_by,status,source_snapshot,provider,model)
 values(p_org,p_version,p_actor,'running',private.effective_sources(p_org),p_provider,p_model) returning id into rid;
 perform private.audit(p_org,p_actor,'analysis_started',rid);
 return (select to_jsonb(a) from public.analysis_runs a where a.id=rid);
end $$;
revoke all on function public.begin_analysis(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.begin_analysis(uuid,uuid,uuid,text,text) to service_role;

create function public.finish_analysis(p_org uuid,p_actor uuid,p_run uuid,p_status text,p_output jsonb,p_error text default null) returns jsonb language plpgsql security invoker set search_path='' as $$
declare ar public.analysis_runs; cv public.content_versions; i jsonb; s public.source_versions; sid uuid; ct public.content;
begin
 perform 1 from public.organizations where id=p_org for update;
 select * into ar from public.analysis_runs where id=p_run and org_id=p_org for update;
 if ar.id is null or ar.requested_by<>p_actor or ar.status<>'running' then raise exception 'conflict: invalid run'; end if;
 select * into cv from public.content_versions where id=ar.content_version_id;
 select * into ct from public.content where id=cv.content_id;
 if p_status not in ('complete','blocked','error') then raise exception 'invalid: analysis status'; end if;
 if p_status='complete' then
  if ct.current_version_id<>cv.id or ar.source_snapshot<>private.effective_sources(p_org) then raise exception 'conflict: content or evidence changed during analysis'; end if;
  for i in select * from jsonb_array_elements(p_output->'issues') loop
   sid:=nullif(i->>'source_id','')::uuid;
   if coalesce(i->>'quote','')<>'' and position(i->>'quote' in cv.body)=0 then raise exception 'invalid: issue passage'; end if;
   if sid is not null then
    select * into s from public.source_versions where id=sid and org_id=p_org;
    if s.id is null or not exists(select 1 from jsonb_array_elements(ar.source_snapshot) x where x->>'id'=sid::text) or length(coalesce(i->>'evidence_quote',''))=0 or position(i->>'evidence_quote' in s.body)=0 then raise exception 'invalid: issue citation'; end if;
   elsif i->>'evidence_status' in ('SUPPORTED','CONTRADICTED') then raise exception 'invalid: evidence required'; end if;
   insert into public.issues(org_id,run_id,category,severity,quote,explanation,source_id,evidence_quote,evidence_status,correction)
   values(p_org,p_run,i->>'category',i->>'severity',i->>'quote',i->>'explanation',sid,i->>'evidence_quote',i->>'evidence_status',i->>'correction');
  end loop;
  for i in select * from jsonb_array_elements(p_output->'dependencies') loop
   sid:=(i->>'fact_version_id')::uuid;
   select * into s from public.source_versions where id=sid and org_id=p_org;
   if s.id is null or s.rule_type<>'fact' or not exists(select 1 from jsonb_array_elements(ar.source_snapshot) x where x->>'id'=sid::text) or length(coalesce(i->>'quote',''))=0 or position(i->>'quote' in cv.body)=0 or length(coalesce(i->>'evidence_quote',''))=0 or position(i->>'evidence_quote' in s.body)=0 then raise exception 'invalid: dependency citation'; end if;
   insert into public.dependencies(org_id,run_id,content_version_id,fact_version_id,quote,evidence_quote) values(p_org,p_run,cv.id,sid,i->>'quote',i->>'evidence_quote') on conflict do nothing;
  end loop;
  update public.content set status='analyzed' where id=cv.content_id;
 end if;
 update public.analysis_runs set status=p_status,error=p_error,completed_at=now() where id=p_run;
 perform private.audit(p_org,p_actor,'analysis_'||p_status,p_run);
 return jsonb_build_object('id',p_run,'status',p_status);
end $$;
revoke all on function public.finish_analysis(uuid,uuid,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.finish_analysis(uuid,uuid,uuid,text,jsonb,text) to service_role;

-- Server service role explicitly granted access; never provided to browsers.
grant all on all tables in schema public to service_role;
grant execute on function private.audit(uuid,uuid,text,uuid), private.effective_sources(uuid) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('brand-private','brand-private',false,10485760,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg']) on conflict(id) do nothing;
create policy brand_download on storage.objects for select to authenticated
using(bucket_id='brand-private' and exists(select 1 from public.documents d where d.object_path=name and private.member_role(d.org_id) is not null));
-- Upload/delete only through validated server endpoints; no browser write policy.
