import {describe,expect,it} from 'vitest';
import {captchaPolicy} from './authPolicy';
import type {PublicConfig} from './runtime';
const development:PublicConfig={deployment_environment:'development',analytics_available:false,bot_protection_required:false,turnstile_site_key:null,operator_name:null,support_email:null,privacy_email:null,legal_notices_approved:false};
describe('authentication CAPTCHA policy',()=>{
 it('allows the built localhost preview to use a confirmed local development API',()=>{
  expect(captchaPolicy(development,true,'http://127.0.0.1:4174','http://127.0.0.1:8001')).toEqual({localDevelopment:true,required:false});
  expect(captchaPolicy(development,true,'http://localhost:4174','')).toEqual({localDevelopment:true,required:false});
 });
 it('keeps public production builds protected even when the API is misconfigured as development',()=>{
  expect(captchaPolicy(development,true,'https://app.example.test','https://api.example.test').required).toBe(true);
 });
 it('does not exempt localhost connected to a production or remote API',()=>{
  expect(captchaPolicy({...development,deployment_environment:'production'},true,'http://127.0.0.1:4174','http://127.0.0.1:8001').required).toBe(true);
  expect(captchaPolicy(development,true,'http://127.0.0.1:4174','https://api.example.test').required).toBe(true);
 });
 it('always honors an explicit CAPTCHA requirement or configured site key',()=>{
  for(const config of [{...development,bot_protection_required:true},{...development,turnstile_site_key:'public-test-site-key'}])expect(captchaPolicy(config,true,'http://localhost:4174','http://localhost:8001').required).toBe(true);
 });
 it('fails closed for unknown configuration in a production bundle',()=>{
  expect(captchaPolicy(null,true,'http://localhost:4174','http://localhost:8001').required).toBe(true);
  expect(captchaPolicy({...development,deployment_environment:undefined},true,'http://localhost:4174','http://localhost:8001').required).toBe(true);
 });
});
