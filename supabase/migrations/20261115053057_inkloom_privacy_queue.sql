-- Additive extension, applied after schema.sql. Never resets existing tenant data.
create table public.inkloom_ai_policies (
 org_id uuid primary key references public.inkloom_organizations(id), allow_public boolean not null default false,
 allow_internal boolean not null default false, revision int not null default 1,
 updated_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.inkloom_processing_events (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.inkloom_organizations(id),
 actor uuid not null references auth.users(id), content_version_id uuid not null,
 provider text not null, model text not null, categories jsonb not null,
 policy_revision int not null, status text not null check(status in ('attempting','succeeded','failed','unknown')),
 created_at timestamptz not null default now(), completed_at timestamptz,
 foreign key(content_version_id,org_id) references public.inkloom_content_versions(id,org_id)
);
create table public.inkloom_privacy_requests (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.inkloom_organizations(id),
 requested_by uuid not null references auth.users(id), kind text not null check(kind in ('export','deletion')),
 status text not null default 'requested' check(status in ('requested','in_review','completed','declined')),
 created_at timestamptz not null default now()
);
create table public.inkloom_analysis_jobs (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.inkloom_organizations(id),
 actor uuid not null references auth.users(id), content_version_id uuid not null,
 idempotency_key uuid not null, external_consent boolean not null default false,
 status text not null default 'queued' check(status in ('queued','running','complete','error')),
 attempts int not null default 0, lease_token uuid, lease_until timestamptz, result jsonb, error text,
 created_at timestamptz not null default now(), completed_at timestamptz,
 unique(org_id,actor,idempotency_key), foreign key(content_version_id,org_id) references public.inkloom_content_versions(id,org_id)
);
create unique index inkloom_one_active_job on public.inkloom_analysis_jobs(content_version_id) where status in ('queued','running');
create index inkloom_job_claim_order on public.inkloom_analysis_jobs(status,created_at);
create table public.inkloom_worker_heartbeats (
 id uuid primary key, last_seen timestamptz not null default now()
);
alter table public.inkloom_worker_heartbeats enable row level security;
revoke all on public.inkloom_worker_heartbeats from public,anon,authenticated;
grant all on public.inkloom_worker_heartbeats to service_role;
do $$ declare t text; begin
 foreach t in array array['ai_policies','processing_events','privacy_requests','analysis_jobs'] loop
 execute format('alter table public.inkloom_%I enable row level security',t);
 execute format('revoke all on public.inkloom_%I from public,anon,authenticated',t);
 execute format('grant select on public.inkloom_%I to authenticated',t);
 execute format('grant all on public.inkloom_%I to service_role',t);
 end loop;
end $$;
create policy tenant_read on public.inkloom_ai_policies for select to authenticated using(inkloom_private.member_role(org_id) is not null);
create policy tenant_read on public.inkloom_processing_events for select to authenticated using(inkloom_private.member_role(org_id) is not null);
create policy request_read on public.inkloom_privacy_requests for select to authenticated using(inkloom_private.member_role(org_id)='admin' or (requested_by=auth.uid() and inkloom_private.member_role(org_id) is not null));
create policy tenant_read on public.inkloom_analysis_jobs for select to authenticated using(inkloom_private.member_role(org_id) is not null);

-- Trusted server supplies actor only after Auth verification. No browser execute grant.
create function public.inkloom_enqueue_analysis(p_org uuid,p_actor uuid,p_version uuid,p_key uuid,p_consent boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare j public.inkloom_analysis_jobs; ct public.inkloom_content; r text;
begin
 perform 1 from public.inkloom_organizations where id=p_org for update;
 select role into r from public.inkloom_memberships where org_id=p_org and user_id=p_actor;
 select c.* into ct from public.inkloom_content c join public.inkloom_content_versions v on v.content_id=c.id where v.id=p_version and v.org_id=p_org;
 if r is null or r not in ('admin','creator') or ct.id is null or ct.current_version_id<>p_version or (ct.owner_id<>p_actor and r<>'admin') then raise exception 'denied: current content owner required'; end if;
 select * into j from public.inkloom_analysis_jobs where org_id=p_org and actor=p_actor and idempotency_key=p_key;
 if j.id is not null then
  if j.content_version_id<>p_version or j.external_consent<>p_consent then raise exception 'conflict: idempotency key reused for different input'; end if;
  return to_jsonb(j);
 end if;
 select * into j from public.inkloom_analysis_jobs where content_version_id=p_version and status in ('queued','running');
 if j.id is not null then return to_jsonb(j); end if;
 insert into public.inkloom_analysis_jobs(org_id,actor,content_version_id,idempotency_key,external_consent) values(p_org,p_actor,p_version,p_key,p_consent) returning * into j;
 perform inkloom_private.audit(p_org,p_actor,'analysis_queued',j.id);
 return to_jsonb(j);
end $$;

create function public.inkloom_claim_analysis_job() returns jsonb language plpgsql security invoker set search_path='' as $$
declare j public.inkloom_analysis_jobs;
begin
 update public.inkloom_analysis_jobs set status='error',error='Worker lease expired after three attempts; retry manually',completed_at=now()
 where status='running' and lease_until<now() and attempts>=3;
 select * into j from public.inkloom_analysis_jobs where (status='queued' or (status='running' and lease_until<now())) and attempts<3 order by created_at for update skip locked limit 1;
 if j.id is null then return null; end if;
 update public.inkloom_analysis_jobs set status='running',attempts=attempts+1,lease_until=now()+interval '6 minutes',lease_token=gen_random_uuid() where id=j.id returning * into j;
 return to_jsonb(j);
end $$;

create function public.inkloom_finish_analysis_job(p_id uuid,p_lease uuid,p_result jsonb,p_error text default null)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 update public.inkloom_analysis_jobs set status=case when p_error is null then 'complete' else 'error' end,result=p_result,error=p_error,completed_at=now(),lease_until=null
 where id=p_id and lease_token=p_lease and status='running' and lease_until>now();
 return found;
end $$;

-- Serialize policy changes with the transfer decision, record intent before network I/O.
create function public.inkloom_authorize_ai_transfer(p_org uuid,p_actor uuid,p_version uuid,p_provider text,p_model text,p_categories jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare pol public.inkloom_ai_policies; c text; eid uuid;
begin
 perform 1 from public.inkloom_organizations where id=p_org for update;
 if not exists(select 1 from public.inkloom_memberships where org_id=p_org and user_id=p_actor and role in ('admin','creator')) then raise exception 'denied: workspace role'; end if;
 if not exists(select 1 from public.inkloom_content_versions v join public.inkloom_content ct on ct.current_version_id=v.id where v.id=p_version and v.org_id=p_org and (ct.owner_id=p_actor or exists(select 1 from public.inkloom_memberships where org_id=p_org and user_id=p_actor and role='admin'))) then raise exception 'denied: current content owner'; end if;
 select * into pol from public.inkloom_ai_policies where org_id=p_org;
 if pol.org_id is null or jsonb_typeof(p_categories)<>'array' or jsonb_array_length(p_categories)=0 then raise exception 'denied: external AI policy is not configured'; end if;
 for c in select jsonb_array_elements_text(p_categories) loop
  if c not in ('PUBLIC','INTERNAL') or (c='PUBLIC' and not pol.allow_public) or (c='INTERNAL' and not pol.allow_internal) then raise exception 'denied: classification blocked by external AI policy'; end if;
 end loop;
 insert into public.inkloom_processing_events(org_id,actor,content_version_id,provider,model,categories,policy_revision,status)
 values(p_org,p_actor,p_version,p_provider,p_model,p_categories,pol.revision,'attempting') returning id into eid;
 return eid;
end $$;

create function public.inkloom_set_ai_policy(p_org uuid,p_actor uuid,p_public boolean,p_internal boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare pol public.inkloom_ai_policies;
begin
 perform 1 from public.inkloom_organizations where id=p_org for update;
 if not exists(select 1 from public.inkloom_memberships where org_id=p_org and user_id=p_actor and role='admin') then raise exception 'denied: admin role required'; end if;
 insert into public.inkloom_ai_policies(org_id,allow_public,allow_internal,updated_by) values(p_org,p_public,p_internal,p_actor)
 on conflict(org_id) do update set allow_public=excluded.allow_public,allow_internal=excluded.allow_internal,updated_by=p_actor,revision=public.inkloom_ai_policies.revision+1,created_at=now() returning * into pol;
 perform inkloom_private.audit(p_org,p_actor,'ai_policy_changed',p_org);
 return to_jsonb(pol);
end $$;
revoke all on function public.inkloom_enqueue_analysis(uuid,uuid,uuid,uuid,boolean), public.inkloom_claim_analysis_job(), public.inkloom_finish_analysis_job(uuid,uuid,jsonb,text), public.inkloom_authorize_ai_transfer(uuid,uuid,uuid,text,text,jsonb), public.inkloom_set_ai_policy(uuid,uuid,boolean,boolean) from public,anon,authenticated;
grant execute on function public.inkloom_enqueue_analysis(uuid,uuid,uuid,uuid,boolean), public.inkloom_claim_analysis_job(), public.inkloom_finish_analysis_job(uuid,uuid,jsonb,text), public.inkloom_authorize_ai_transfer(uuid,uuid,uuid,text,text,jsonb), public.inkloom_set_ai_policy(uuid,uuid,boolean,boolean) to service_role;
