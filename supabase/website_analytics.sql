-- Public website metrics are separate from private tenant activity; no IP/account identifiers.
create table public.inkloom_website_events (
 id uuid primary key default gen_random_uuid(),
 event text not null check(event in ('page_view','cta_click')),
 path text not null check(path in ('/','/privacy','/terms','/contact')),
 consent_version int not null check(consent_version=1),
 created_at timestamptz not null default now()
);
alter table public.inkloom_website_events enable row level security;
revoke all on public.inkloom_website_events from public,anon,authenticated;
grant select,insert,delete on public.inkloom_website_events to service_role;
create policy website_events_no_client_access on public.inkloom_website_events for all to anon,authenticated using(false) with check(false);
create index inkloom_website_events_time on public.inkloom_website_events(created_at);
