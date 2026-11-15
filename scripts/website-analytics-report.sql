-- Operator-only reporting; never expose these queries as an unauthenticated API.
-- Events have no visitor/account/IP identifier, so these are events, not unique people.
select date_trunc('day',created_at) as day,path,event,count(*) as events
from public.inkloom_website_events
where created_at>=now()-interval '30 days'
group by 1,2,3 order by 1 desc,2,3;
