// Real PostgreSQL WASM; Supabase auth and storage schemas below are test-only stand-ins.
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();
const assetDedupeMigration='20261117200004_inkloom_prevent_duplicate_assets.sql';
const bootstrap=`create role anon; create role authenticated; create role service_role bypassrls;
alter default privileges in schema public grant execute on functions to anon,authenticated;
create schema auth; create schema storage; create schema extensions;
create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
grant usage on schema auth,storage to authenticated,service_role;
grant execute on all functions in schema auth to authenticated,service_role;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;grant select on storage.objects to authenticated;`;
await db.exec(bootstrap);
for(const name of (await readdir(new URL('../supabase/migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')&&n!==assetDedupeMigration).sort())await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
await db.exec('set role anon');await assert.rejects(()=>db.query("select public.inkloom_governance(null,'create_org','{}'::jsonb)"),/permission denied/);await db.exec('reset role');
console.log('PASS schema applies to PostgreSQL and anonymous RPC denied');
const ids=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000004'];
const [admin,creator,manager,outsider]=ids;
const emails=['admin@demo.test','creator@demo.test','manager@demo.test','other@demo.test'];
for(let i=0;i<4;i++)await db.query('insert into auth.users values($1,$2)',[ids[i],emails[i]]);
async function asUser(id){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[id,JSON.stringify({sub:id,email:emails[ids.indexOf(id)]})]);await db.exec('set role authenticated')}
async function cmd(org,action,data){return (await db.query('select public.inkloom_governance($1,$2,$3::jsonb) result',[org,action,JSON.stringify(data)])).rows[0].result}
async function table(name){return (await db.query(`select * from public.inkloom_${name}`)).rows}
await asUser(admin);const org=(await cmd(null,'create_org',{name:'DEMO ONLY — Governance tests'})).id;
for(const [id,role]of [[creator,'creator'],[manager,'manager']]){const invite=(await cmd(org,'invite',{email:emails[ids.indexOf(id)],role})).id;await asUser(id);await cmd(null,'accept_invite',{id:invite});await asUser(admin)}
console.log('PASS onboarding and role invitations');
await assert.rejects(()=>cmd(org,'set_role',{user_id:admin,role:'creator'}),/cannot change your own role/);
await asUser(creator);await assert.rejects(()=>cmd(org,'save_source',{name:'forged',kind:'fact',body:'lie'}),/admin role/);
await assert.rejects(()=>db.query('insert into public.inkloom_organizations(name,created_by) values($1,$2)',['forged',creator]),/permission denied/);
await asUser(outsider);assert.equal((await table('organizations')).length,0);await assert.rejects(()=>cmd(org,'create_content',{title:'cross tenant',body:'no'}),/workspace membership/);
console.log('PASS role escalation, direct write and cross-tenant denial');
await asUser(admin);const fact=await cmd(org,'save_source',{name:'DEMO price',kind:'fact',rule_type:'fact',body:'Demo product price is ₹1,999'});await cmd(org,'activate_source',{id:fact.id});
await asUser(creator);const ad=await cmd(org,'create_content',{title:'DEMO linked ad',body:'Demo product price is ₹1,999',channel:'Social'});const unrelated=await cmd(org,'create_content',{title:'DEMO unrelated ad',body:'Welcome to our store',channel:'Social'});
async function analyze(version,actor,factVersion,price){await db.exec('reset role');await db.exec('set role service_role');const run=(await db.query('select public.inkloom_begin_analysis($1,$2,$3,$4,$5) r',[org,actor,version,'test-fixture','not-live-ai'])).rows[0].r;await db.query('select public.inkloom_finish_analysis($1,$2,$3,$4,$5::jsonb)',[org,actor,run.id,'complete',JSON.stringify({issues:[],dependencies:[{quote:price,fact_version_id:factVersion,evidence_quote:price}]})]);return run}
await analyze(ad.version_id,creator,fact.id,'Demo product price is ₹1,999');await asUser(creator);const request=(await cmd(org,'submit',{version_id:ad.version_id})).id;
await assert.rejects(()=>cmd(org,'decide',{id:request,decision:'approved',reason:'forged'}),/independent authorized/);
await asUser(manager);await cmd(org,'comment',{version_id:ad.version_id,body:'DEMO human review'});await cmd(org,'decide',{id:request,decision:'approved',reason:'DEMO independent human judgment'});const passport=(await table('passports'))[0];assert.equal(passport.content_version_id,ad.version_id);
console.log('PASS analysis, independent human decision and revision-bound passport');
await asUser(admin);const next=await cmd(org,'save_source',{source_id:fact.source_id,body:'Demo product price is ₹2,499',rule_type:'fact'});const preview=await cmd(org,'impact_preview',{id:next.id});assert.equal(preview.length,1);assert.equal(preview[0].id,ad.id);await cmd(org,'activate_source',{id:next.id});await cmd(org,'activate_source',{id:next.id});assert.equal((await table('impacts')).length,1);const items=await table('content');assert.equal(items.find(c=>c.id===ad.id).status,'needs_review');assert.equal(items.find(c=>c.id===unrelated.id).status,'draft');assert.equal((await table('passports'))[0].sha256,passport.sha256);await asUser(manager);assert.ok((await table('notifications')).length);
console.log('PASS exact price-change targeting, impact preview, idempotency and history');
await asUser(creator);const revised=await cmd(org,'revise_content',{id:ad.id,expected_version_id:ad.version_id,body:'Demo product price is ₹2,499',creator_intent:'DEMO update'});await assert.rejects(()=>cmd(org,'revise_content',{id:ad.id,expected_version_id:ad.version_id,body:'stale'}),/content was revised/);await analyze(revised.version_id,creator,next.id,'Demo product price is ₹2,499');await asUser(creator);const second=(await cmd(org,'submit',{version_id:revised.version_id})).id;await asUser(manager);await cmd(org,'decide',{id:second,decision:'approved',reason:'DEMO new price checked'});assert.equal((await table('passports')).length,2);assert.equal((await table('impacts'))[0].status,'resolved');
console.log('PASS optimistic revision conflict, re-review and impact resolution');
await asUser(admin);
const tone=await cmd(org,'save_source',{name:'DEMO tone',kind:'rule',rule_type:'tone',body:'Use clear professional language'});
await cmd(org,'activate_source',{id:tone.id});
await analyze(revised.version_id,creator,next.id,'Demo product price is ₹2,499');
await asUser(creator);const policyRequest=(await cmd(org,'submit',{version_id:revised.version_id})).id;
await asUser(manager);await cmd(org,'decide',{id:policyRequest,decision:'approved',reason:'DEMO policy verified'});
await asUser(admin);
const tone2=await cmd(org,'save_source',{source_id:tone.source_id,rule_type:'tone',body:'Use clear professional language and include a disclaimer'});
const tonePreview=await cmd(org,'impact_preview',{id:tone2.id});
assert.equal(tonePreview.length,1);assert.equal(tonePreview[0].id,ad.id);
await cmd(org,'activate_source',{id:tone2.id});await cmd(org,'activate_source',{id:tone2.id});
assert.equal((await table('content')).find(c=>c.id===ad.id).status,'needs_review');
assert.equal((await table('content')).find(c=>c.id===unrelated.id).status,'draft');
assert.equal((await table('impacts')).filter(i=>i.status==='open').length,1);
assert.equal((await table('passports')).length,3);
console.log('PASS tone policy snapshot impact, unrelated draft exclusion, idempotency and approval history');
await asUser(outsider);for(const t of ['dependencies','passports','audit_log','content'])assert.equal((await table(t)).length,0);
await assert.rejects(()=>db.query('select public.inkloom_begin_analysis($1,$2,$3,$4,$5)',[org,creator,revised.version_id,'forged','forged']),/permission denied/);
console.log('PASS historical isolation and browser analysis forgery denial');
await asUser(creator);await assert.rejects(()=>db.query('select public.inkloom_set_ai_policy($1,$2,true,true)',[org,creator]),/permission denied/);
await db.exec('reset role');await db.exec('set role service_role');
await assert.rejects(()=>db.query('select public.inkloom_set_ai_policy($1,$2,true,true)',[org,creator]),/admin role/);
await db.query('select public.inkloom_set_ai_policy($1,$2,true,false)',[org,admin]);
await assert.rejects(()=>db.query('select public.inkloom_authorize_ai_transfer($1,$2,$3,$4,$5,$6::jsonb)',[org,creator,revised.version_id,'test-fixture','never-live',JSON.stringify(['CONFIDENTIAL'])]),/classification blocked/);
await assert.rejects(()=>db.query('select public.inkloom_authorize_ai_transfer($1,$2,$3,$4,$5,$6::jsonb)',[org,creator,revised.version_id,'test-fixture','never-live',JSON.stringify(['RESTRICTED'])]),/classification blocked/);
await assert.rejects(()=>db.query('select public.inkloom_authorize_ai_transfer($1,$2,$3,$4,$5,$6::jsonb)',[org,creator,revised.version_id,'test-fixture','never-live',JSON.stringify(['INTERNAL'])]),/classification blocked/);
await db.query('select public.inkloom_authorize_ai_transfer($1,$2,$3,$4,$5,$6::jsonb)',[org,creator,revised.version_id,'test-fixture','never-live',JSON.stringify(['PUBLIC'])]);
assert.equal((await table('processing_events')).length,1);
console.log('PASS privacy admin policy, fail-closed data classes and real attempt record');
const key='10000000-0000-4000-8000-000000000001';
const enqueue=async(k)=> (await db.query('select public.inkloom_enqueue_analysis($1,$2,$3,$4,false) result',[org,creator,revised.version_id,k])).rows[0].result;
const job=await enqueue(key);assert.equal((await enqueue(key)).id,job.id);
const claim=(await db.query('select public.inkloom_claim_analysis_job() result')).rows[0].result;assert.equal(claim.id,job.id);assert.equal(claim.attempts,1);
assert.equal((await db.query('select public.inkloom_claim_analysis_job() result')).rows[0].result,null);
assert.equal((await db.query('select public.inkloom_finish_analysis_job($1,$2,$3::jsonb) result',[job.id,key,'{}'])).rows[0].result,false);
await db.query("update public.inkloom_analysis_jobs set lease_until=now()-interval '1 second' where id=$1",[job.id]);
const retry=(await db.query('select public.inkloom_claim_analysis_job() result')).rows[0].result;assert.equal(retry.attempts,2);assert.notEqual(retry.lease_token,claim.lease_token);
assert.equal((await db.query('select public.inkloom_finish_analysis_job($1,$2,$3::jsonb) result',[job.id,claim.lease_token,'{}'])).rows[0].result,false);
assert.equal((await db.query('select public.inkloom_finish_analysis_job($1,$2,$3::jsonb) result',[job.id,retry.lease_token,'{}'])).rows[0].result,true);
await asUser(outsider);for(const t of ['ai_policies','processing_events','privacy_requests','analysis_jobs'])assert.equal((await table(t)).length,0);
await assert.rejects(()=>table('website_events'),/permission denied/);
console.log('PASS durable job idempotency, exclusive claim, lease recovery, stale-worker denial and isolation');
console.log('PASS website analytics table denies browser access');
await db.exec('reset role');
const storagePath=org+'/'+creator+'/test.pdf';
await db.query("insert into public.inkloom_documents(org_id,name,object_path,mime,sha256,extracted_text,created_by) values($1,'test.pdf',$2,'application/pdf',$3,'test',$4)",[org,storagePath,'a'.repeat(64),creator]);
await db.query("insert into storage.objects(bucket_id,name) values('inkloom-private',$1),('inkloom-private','unregistered.pdf'),('other-bucket',$1)",[storagePath]);
for(const member of [admin,creator,manager]){
 await asUser(member);
 const visible=(await db.query("select bucket_id,name from storage.objects")).rows;
 assert.deepEqual(visible,[{bucket_id:'inkloom-private',name:storagePath}]);
}
await asUser(outsider);assert.equal((await db.query('select name from storage.objects')).rows.length,0);
console.log('PASS private storage member access, unregistered object denial and tenant isolation');
{
// Dependency regressions: synthetic fixtures live only in this in-memory DB.
await asUser(admin);
const dependencyFact=await cmd(org,'save_source',{name:'TEST ONLY — stage count',kind:'fact',rule_type:'fact',body:'The platform has four stages.'});
await cmd(org,'activate_source',{id:dependencyFact.id});
await assert.rejects(()=>cmd(org,'save_source',{name:'TEST ONLY — rewritten numeric config',kind:'fact',rule_type:'fact',body:'The platform has four stages.',config:{subject:'The platform has',value:'4'}}),/exact fact subject and value must occur/);
await cmd(org,'save_source',{name:'TEST ONLY — literal numeric config',kind:'fact',rule_type:'fact',body:'The platform has four stages.',config:{subject:'The platform has',value:'four'}});
console.log('PASS numeric configuration must preserve the exact approved body spelling');
const tone=await cmd(org,'save_source',{name:'TEST ONLY — tone',kind:'rule',rule_type:'tone',body:'Use a calm voice.'});
await cmd(org,'activate_source',{id:tone.id});
const unselected=await cmd(org,'save_source',{name:'TEST ONLY — unapproved',kind:'fact',rule_type:'fact',body:'The platform has four stages.'});
await asUser(outsider);
const foreignOrg=(await cmd(null,'create_org',{name:'TEST ONLY — isolated foreign tenant'})).id;
const foreignFact=await cmd(foreignOrg,'save_source',{name:'TEST ONLY — foreign fact',kind:'fact',rule_type:'fact',body:'The platform has four stages.'});
await cmd(foreignOrg,'activate_source',{id:foreignFact.id});
await asUser(creator);
const dependencyContent=await cmd(org,'create_content',{title:'TEST ONLY — dependency validation',body:'The platform has 4 stages.',channel:'Test'});
await db.exec('reset role');await db.exec('set role service_role');
const parentFact=(await db.query('select source_id from public.inkloom_source_versions where id=$1',[dependencyFact.id])).rows[0].source_id;
const dependency={quote:'The platform has 4 stages.',fact_version_id:dependencyFact.id,evidence_quote:'The platform has four stages.'};
const validIssue={category:'fact',severity:'info',quote:dependency.quote,explanation:'TEST ONLY',source_id:dependencyFact.id,evidence_quote:dependency.evidence_quote,evidence_status:'SUPPORTED',correction:''};
async function dependencyRun(version=dependencyContent.version_id){return (await db.query('select public.inkloom_begin_analysis($1,$2,$3,$4,$5) r',[org,creator,version,'test-fixture','not-live-ai'])).rows[0].r}
async function finishDependency(run,output,status='complete'){return db.query('select public.inkloom_finish_analysis($1,$2,$3,$4,$5::jsonb)',[org,creator,run.id,status,JSON.stringify(output)])}
const invalidDependencies=[
 ['parent source ID',{fact_version_id:parentFact}],
 ['unknown version',{fact_version_id:'ffffffff-ffff-4fff-8fff-ffffffffffff'}],
 ['cross-organization version',{fact_version_id:foreignFact.id}],
 ['unapproved version absent from snapshot',{fact_version_id:unselected.id}],
 ['non-fact version',{fact_version_id:tone.id,evidence_quote:'Use a calm voice.'}],
 ['normalized content quotation',{quote:'The platform has four stages.'}],
 ['normalized evidence quotation',{evidence_quote:'The platform has 4 stages.'}],
 ['fabricated quotation',{evidence_quote:'Invented evidence'}],
 ['paraphrased quotation',{quote:'The platform offers 4 stages.'}],
 ['case-changed quotation',{quote:'the platform has 4 stages.'}],
 ['whitespace-changed quotation',{quote:'The platform has  4 stages.'}],
 ['empty content quotation',{quote:''}],
 ['empty evidence quotation',{evidence_quote:''}],
];
for(const [label,changes]of invalidDependencies){
 const run=await dependencyRun();
 await assert.rejects(()=>finishDependency(run,{issues:[validIssue],dependencies:[{...dependency,...changes}]}),/invalid: dependency citation/,label);
 assert.equal((await db.query('select status from public.inkloom_analysis_runs where id=$1',[run.id])).rows[0].status,'running');
 assert.equal((await db.query('select count(*)::int n from public.inkloom_dependencies where run_id=$1',[run.id])).rows[0].n,0,label);
 assert.equal((await db.query('select count(*)::int n from public.inkloom_issues where run_id=$1',[run.id])).rows[0].n,0,label);
 assert.equal((await db.query('select status from public.inkloom_content where id=$1',[dependencyContent.id])).rows[0].status,'draft');
 await finishDependency(run,{},'error');
}
console.log(`PASS ${invalidDependencies.length} SQL dependency rejection cases; atomic rollback preserves draft and inserts no findings or dependencies`);
const validRun=await dependencyRun();
await finishDependency(validRun,{issues:[],dependencies:[dependency]});
const stored=(await db.query('select quote,evidence_quote from public.inkloom_dependencies where run_id=$1',[validRun.id])).rows;
assert.deepEqual(stored,[{quote:dependency.quote,evidence_quote:dependency.evidence_quote}]);
assert.equal((await db.query('select status from public.inkloom_content where id=$1',[dependencyContent.id])).rows[0].status,'analyzed');
assert.equal((await db.query('select count(*)::int n from public.inkloom_decisions d join public.inkloom_review_requests r on r.id=d.request_id where r.content_version_id=$1',[dependencyContent.version_id])).rows[0].n,0);
assert.equal((await db.query('select count(*)::int n from public.inkloom_passports where content_version_id=$1',[dependencyContent.version_id])).rows[0].n,0);
console.log('PASS literal 4/four quotes persist unchanged; analysis does not approve or publish content');
const evidenceRace=await dependencyRun();
await asUser(admin);
const changedFact=await cmd(org,'save_source',{source_id:parentFact,rule_type:'fact',body:'The platform has five stages.'});
await cmd(org,'activate_source',{id:changedFact.id});
await db.exec('reset role');await db.exec('set role service_role');
await assert.rejects(()=>finishDependency(evidenceRace,{issues:[],dependencies:[dependency]}),/content or evidence changed/);
await finishDependency(evidenceRace,{},'error');
const retiredFactRun=await dependencyRun();
await assert.rejects(()=>finishDependency(retiredFactRun,{issues:[],dependencies:[dependency]}),/invalid: dependency citation/);
await finishDependency(retiredFactRun,{},'error');
console.log('PASS retired fact versions outside the new snapshot cannot be cited');
const contentRace=await dependencyRun();
await asUser(creator);
await cmd(org,'revise_content',{id:dependencyContent.id,expected_version_id:dependencyContent.version_id,body:'A revised test draft.',creator_intent:'TEST ONLY'});
await db.exec('reset role');await db.exec('set role service_role');
await assert.rejects(()=>finishDependency(contentRace,{issues:[],dependencies:[]}),/content or evidence changed/);
await finishDependency(contentRace,{},'error');
console.log('PASS evidence and content changes during analysis still block completion');
}
{
// Upgrade regression: create historical duplicates through the old RPC, then
// apply the pending migration only to this disposable in-memory PostgreSQL DB.
await db.exec('reset role');await db.exec('set role service_role');
let uploadNumber=0;
const digest='b'.repeat(64);
async function registerAsset(workspace=org,actor=admin,hash=digest,purpose='asset',extra={}){
 const data={purpose,name:'TEST ONLY — asset.jpeg',object_path:workspace+'/'+actor+'/test-'+(++uploadNumber)+'.jpeg',mime:'image/jpeg',sha256:hash,text:'',provenance:[],metadata:{width:120,height:80,dominant_colors:['#fe0000'],classification:'CONFIDENTIAL'},...extra};
 return (await db.query('select public.inkloom_finalize_upload($1,$2,$3::jsonb) result',[workspace,actor,JSON.stringify(data)])).rows[0].result;
}
const legacyOne=await registerAsset();
const legacyTwo=await registerAsset();
assert.notEqual(legacyOne.id,legacyTwo.id);
const legacyAsset=(await db.query('select id from public.inkloom_assets where document_id=$1',[legacyOne.id])).rows[0];
await asUser(admin);await cmd(org,'approve_asset',{id:legacyAsset.id});
await cmd(org,'set_role',{user_id:manager,role:'admin'});
await db.exec('reset role');
const beforeSecurity=(await db.query("select proacl::text,prosecdef,proconfig from pg_proc where oid='public.inkloom_finalize_upload(uuid,uuid,jsonb)'::regprocedure")).rows;
const beforePolicies=(await db.query('select * from pg_policies order by schemaname,tablename,policyname')).rows;
await db.exec(await readFile(new URL('../supabase/migrations/'+assetDedupeMigration,import.meta.url),'utf8'));
assert.deepEqual((await db.query("select proacl::text,prosecdef,proconfig from pg_proc where oid='public.inkloom_finalize_upload(uuid,uuid,jsonb)'::regprocedure")).rows,beforeSecurity);
assert.deepEqual((await db.query('select * from pg_policies order by schemaname,tablename,policyname')).rows,beforePolicies);
await db.exec('set role service_role');
const priorAssets=(await db.query('select * from public.inkloom_assets where org_id=$1 order by id',[org])).rows;
const priorDocs=(await db.query('select * from public.inkloom_documents where org_id=$1 order by id',[org])).rows;
const priorAudit=(await db.query('select * from public.inkloom_audit_log where org_id=$1 order by id',[org])).rows;
await assert.rejects(()=>registerAsset(org,manager,digest,'asset',{name:'renamed.jpg',metadata:{classification:'PUBLIC'}}),/conflict: an identical asset is already registered in this workspace/);
assert.deepEqual((await db.query('select * from public.inkloom_assets where org_id=$1 order by id',[org])).rows,priorAssets);
assert.deepEqual((await db.query('select * from public.inkloom_documents where org_id=$1 order by id',[org])).rows,priorDocs);
assert.deepEqual((await db.query('select * from public.inkloom_audit_log where org_id=$1 order by id',[org])).rows,priorAudit);
assert.equal((await db.query('select count(*)::int n from public.inkloom_assets a join public.inkloom_documents d on d.id=a.document_id where a.org_id=$1 and d.sha256=$2',[org,digest])).rows[0].n,2);
assert.equal((await db.query('select approved from public.inkloom_assets where id=$1',[legacyAsset.id])).rows[0].approved,true);
console.log('PASS migration tolerates historical duplicates and preserves all documents, approvals and audit records');
const newDigest='c'.repeat(64);
const first=await registerAsset(org,admin,newDigest);
await assert.rejects(()=>registerAsset(org,admin,newDigest),/identical asset/);
assert.equal((await db.query('select approved from public.inkloom_assets where document_id=$1',[first.id])).rows[0].approved,false);
await assert.rejects(()=>registerAsset(org,creator,digest),/denied: upload role/);
await assert.rejects(()=>registerAsset(org,creator,'d'.repeat(64)),/denied: upload role/);
await assert.rejects(()=>registerAsset(org,outsider,digest),/denied: upload role/);
await assert.rejects(()=>registerAsset(org,admin,digest,'asset',{object_path:'wrong/path/file.jpg'}),/denied: object path/);
console.log('PASS approved and unapproved duplicates blocked, renamed files blocked, permission/path checks precede hash lookup');
await asUser(outsider);
const otherWorkspace=(await cmd(null,'create_org',{name:'TEST ONLY — same binary independent workspace'})).id;
await db.exec('reset role');await db.exec('set role service_role');
const independent=await registerAsset(otherWorkspace,outsider,digest);
assert.notEqual(independent.id,legacyOne.id);
assert.equal((await db.query('select approved from public.inkloom_assets where document_id=$1',[independent.id])).rows[0].approved,false);
await assert.rejects(()=>registerAsset(otherWorkspace,outsider,digest),/identical asset/);
const contentCopy=await registerAsset(org,creator,digest,'content');
const knowledgeCopy=await registerAsset(org,admin,digest,'knowledge');
assert.notEqual(contentCopy.id,legacyOne.id);assert.notEqual(knowledgeCopy.id,legacyOne.id);
const nonassetHash='e'.repeat(64);
await registerAsset(org,creator,nonassetHash,'content');
const newAsset=await registerAsset(org,admin,nonassetHash,'asset');assert.ok(newAsset.id);
console.log('PASS same bytes allowed independently across workspaces, no inherited approval, content/knowledge behavior preserved');
await db.exec('begin isolation level repeatable read');
await assert.rejects(()=>registerAsset(org,admin,'9'.repeat(64)),/requires read committed isolation/);
await db.exec('rollback');
const simultaneousHash='f'.repeat(64);
const attempts=await Promise.allSettled([registerAsset(org,admin,simultaneousHash),registerAsset(org,manager,simultaneousHash)]);
assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);
assert.equal(attempts.filter(r=>r.status==='rejected').length,1);
assert.equal((await db.query('select count(*)::int n from public.inkloom_assets a join public.inkloom_documents d on d.id=a.document_id where a.org_id=$1 and d.sha256=$2',[org,simultaneousHash])).rows[0].n,1);
const definition=(await db.query("select pg_get_functiondef('public.inkloom_finalize_upload(uuid,uuid,jsonb)'::regprocedure) definition")).rows[0].definition;
assert.match(definition,/inkloom_organizations where id=p_org for update/);
assert.equal((await db.query("select prosecdef from pg_proc where oid='public.inkloom_finalize_upload(uuid,uuid,jsonb)'::regprocedure")).rows[0].prosecdef,false);
await asUser(admin);
await assert.rejects(()=>db.query('select public.inkloom_finalize_upload($1,$2,$3::jsonb)',[org,admin,'{}']),/permission denied/);
await asUser(outsider);
const visibleAssets=await table('assets');
assert.ok(visibleAssets.some(a=>a.document_id===independent.id));
assert.ok(!visibleAssets.some(a=>a.document_id===legacyOne.id));
await db.exec('reset role');await db.exec('set role anon');
await assert.rejects(()=>db.query('select public.inkloom_finalize_upload($1,$2,$3::jsonb)',[org,admin,'{}']),/permission denied/);
console.log('PASS paired registrations create one asset, organization lock present, invoker/grants/RLS isolation preserved');
}
await db.close();
// Fresh install: apply every migration in order to a second empty database.
{
const fresh=new PGlite();
try{
 await fresh.exec(bootstrap);
 for(const name of (await readdir(new URL('../supabase/migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort())await fresh.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
 await fresh.query('insert into auth.users values($1,$2)',[admin,'fresh@example.test']);
 const freshOrg=(await fresh.query('insert into public.inkloom_organizations(name,created_by) values($1,$2) returning id',['TEST ONLY — fresh install',admin])).rows[0].id;
 await fresh.query('insert into public.inkloom_memberships(org_id,user_id,role) values($1,$2,$3)',[freshOrg,admin,'admin']);
 await fresh.exec('set role service_role');
 const payload={purpose:'asset',name:'fresh.jpeg',object_path:freshOrg+'/'+admin+'/fresh.jpeg',mime:'image/jpeg',sha256:'a'.repeat(64),text:'',provenance:[],metadata:{classification:'CONFIDENTIAL'}};
 const finalize=()=>fresh.query('select public.inkloom_finalize_upload($1,$2,$3::jsonb) result',[freshOrg,admin,JSON.stringify(payload)]);
 const first=(await finalize()).rows[0].result;
 assert.deepEqual(Object.keys(first),['id']);
 await assert.rejects(finalize,/identical asset/);
 assert.equal((await fresh.query('select count(*)::int n from public.inkloom_assets')).rows[0].n,1);
 assert.equal((await fresh.query('select approved from public.inkloom_assets')).rows[0].approved,false);
 console.log('PASS complete fresh installation and duplicate guard on an empty database');
}finally{await fresh.close()}
}
