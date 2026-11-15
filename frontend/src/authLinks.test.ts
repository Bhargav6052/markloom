import {describe,it,expect} from 'vitest';
import {authDestination,emailReturn} from './authLinks';
describe('email return routing',()=>{
 it('uses the configured public origin for links sent during local testing',()=>expect(authDestination('http://127.0.0.1:4174','https://inkloom.example')).toBe('https://inkloom.example/auth/callback'));
 it('keeps local callbacks usable during development',()=>expect(authDestination('http://127.0.0.1:4174')).toBe('http://127.0.0.1:4174/auth/callback'));
 it('rejects unsafe destinations',()=>{for(const url of ['http://public.example','https://user:password@public.example','https://public.example/?next=evil','https://public.example/path','javascript:alert(1)'])expect(()=>authDestination('http://localhost',url)).toThrow()});
 it('recognizes existing dashboard and root implicit links and recovery links',()=>{expect(emailReturn('','#access_token=test&type=signup').present).toBe(true);expect(emailReturn('','#access_token=test&type=recovery').recovery).toBe(true);expect(emailReturn('?code=test','').present).toBe(true)});
 it('handles expired links without showing provider-controlled error descriptions',()=>{expect(emailReturn('','#error=access_denied&error_code=otp_expired&error_description=SECRET').error).toContain('expired');expect(emailReturn('?error=access_denied&error_description=SECRET','').error).not.toContain('SECRET')});
 it('ignores normal anchor navigation',()=>expect(emailReturn('','#workflow').present).toBe(false));
});
