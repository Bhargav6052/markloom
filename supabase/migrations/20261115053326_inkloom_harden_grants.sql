-- Supabase can grant anon execute via project default privileges independently of PUBLIC.
revoke all on function public.inkloom_governance(uuid,text,jsonb) from public,anon;
create policy worker_no_client_access on public.inkloom_worker_heartbeats for all to anon,authenticated using(false) with check(false);
