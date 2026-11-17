-- Pending production migration. Existing records and approval/audit history stay intact.
-- Non-unique indexes intentionally tolerate historical duplicate rows.
create index inkloom_documents_org_sha256_idx on public.inkloom_documents(org_id,sha256);
create index inkloom_assets_org_document_idx on public.inkloom_assets(org_id,document_id);

create or replace function public.inkloom_finalize_upload(p_org uuid,p_actor uuid,p_data jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare rid uuid; r text;
begin
 select role into r from public.inkloom_memberships where org_id=p_org and user_id=p_actor;
 if r is null or (p_data->>'purpose' in ('knowledge','asset') and r<>'admin') or (p_data->>'purpose'='content' and r not in ('admin','creator')) then raise exception 'denied: upload role'; end if;
 if split_part(p_data->>'object_path','/',1)<>p_org::text or split_part(p_data->>'object_path','/',2)<>p_actor::text then raise exception 'denied: object path'; end if;
 if p_data->>'purpose'='asset' then
  -- A repeatable-read snapshot could miss a registration committed while waiting.
  if pg_catalog.current_setting('transaction_isolation')<>'read committed' then
   raise exception 'invalid: asset registration requires read committed isolation';
  end if;
  -- Lock only inside this short RPC transaction, never during storage transfer.
  -- Concurrent registrations in this workspace must observe the first insert.
  perform 1 from public.inkloom_organizations where id=p_org for update;
  if exists(
   select 1 from public.inkloom_documents d
   join public.inkloom_assets a on a.document_id=d.id and a.org_id=d.org_id
   where d.org_id=p_org and a.org_id=p_org and d.sha256=p_data->>'sha256'
  ) then
   raise exception 'conflict: an identical asset is already registered in this workspace';
  end if;
 end if;
 insert into public.inkloom_documents(org_id,name,object_path,mime,sha256,extracted_text,provenance,metadata,created_by)
 values(p_org,p_data->>'name',p_data->>'object_path',p_data->>'mime',p_data->>'sha256',coalesce(p_data->>'text',''),p_data->'provenance',p_data->'metadata',p_actor) returning id into rid;
 if p_data->>'purpose'='asset' then insert into public.inkloom_assets(org_id,document_id) values(p_org,rid); end if;
 perform inkloom_private.audit(p_org,p_actor,'upload',rid);
 return jsonb_build_object('id',rid);
end $$;

-- CREATE OR REPLACE preserves the existing service_role-only EXECUTE grants.
