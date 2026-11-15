import {afterEach,describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {validatePublicEnv} from '../scripts/site-build.mjs';
import {CONSENT_KEY,readConsent,trackPublicEvent} from './Consent';
import Terms from './Terms';
import Contact from './Contact';
import NotFound from './NotFound';

afterEach(()=>vi.unstubAllGlobals());
describe('frontend credential boundary',()=>{
 it('rejects secret variables, secret keys and privileged JWTs before a build',()=>{
  expect(()=>validatePublicEnv({VITE_API_KEY:'private'})).toThrow('Unapproved');
  expect(()=>validatePublicEnv({VITE_SUPABASE_PUBLISHABLE_KEY:'sb_'+'secret_test_fixture_only'})).toThrow('Secret-like');
  const payload=Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url');
  expect(()=>validatePublicEnv({VITE_SUPABASE_PUBLISHABLE_KEY:'header.'+payload+'.signature'})).toThrow('Service-role');
  expect(()=>validatePublicEnv({VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test_fixture_only'})).not.toThrow();
 });
 it('rejects insecure or credential-bearing deployment origins',()=>{
  expect(()=>validatePublicEnv({VITE_SITE_URL:'http://example.test'})).toThrow();
  expect(()=>validatePublicEnv({VITE_SITE_URL:'https://user:password@example.test'})).toThrow();
  expect(()=>validatePublicEnv({VITE_API_URL:'http://api.example.test'})).toThrow();
 });
});
describe('optional analytics consent',()=>{
 it('defaults off for absent, invalid, expired and future preferences',()=>{
  for(const text of [null,'bad',JSON.stringify({version:1,analytics:true,updatedAt:0}),JSON.stringify({version:1,analytics:true,updatedAt:Date.now()+60000})])expect(readConsent({getItem:()=>text})).toBeNull();
 });
 it('never fetches for missing consent, private routes or browser privacy signals',async()=>{
  const fetch=vi.fn();vi.stubGlobal('fetch',fetch);vi.stubGlobal('localStorage',{getItem:()=>null});vi.stubGlobal('navigator',{doNotTrack:'0'});
  await trackPublicEvent('page_view','/');
  vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify({version:1,analytics:true,updatedAt:Date.now()})});
  await trackPublicEvent('page_view','/app/content/private-id');
  vi.stubGlobal('navigator',{globalPrivacyControl:true});await trackPublicEvent('page_view','/');
  expect(fetch).not.toHaveBeenCalled();
 });
 it('sends only allowlisted anonymous fields after explicit consent and service availability',async()=>{
  vi.stubGlobal('navigator',{doNotTrack:'0'});vi.stubGlobal('localStorage',{getItem:(key:string)=>key===CONSENT_KEY?JSON.stringify({version:1,analytics:true,updatedAt:Date.now()}):null});
  const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({analytics_available:true})});vi.stubGlobal('fetch',fetch);
  await trackPublicEvent('cta_click','/');expect(fetch).toHaveBeenCalledTimes(2);expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({event:'cta_click',path:'/',consent_version:1});expect(fetch.mock.calls[1][1].credentials).toBe('omit');
 });
});
describe('integrated public pages',()=>{
 it('renders terms, support and a useful custom 404 without invented operator details',()=>{
  for(const Page of [Terms,Contact,NotFound]){const html=renderToStaticMarkup(<MemoryRouter><Page/></MemoryRouter>);expect(html).toContain('<h1>');expect(html).toContain('href="/');expect(html).not.toContain('support@example');}
  expect(renderToStaticMarkup(<MemoryRouter><Terms/></MemoryRouter>)).toContain('Not published');
 });
});
