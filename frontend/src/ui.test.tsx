import {describe,it,expect,vi,afterEach} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import Auth from './Auth';
import {MemoryRouter} from 'react-router-dom';
import {Badge,Empty,Status} from './components';
import {api} from './api';
describe('honest disconnected UI',()=>{
 it('disables sign-in until Supabase is configured',()=>{const html=renderToStaticMarkup(<MemoryRouter><Auth/></MemoryRouter>);expect(html).toContain('Supabase is not configured');expect(html).toContain('disabled');expect(html).toContain('Email');expect(html).not.toContain('demo login');});
 it('provides accessible error and empty states',()=>{expect(renderToStaticMarkup(<Status error="Provider is unavailable"/>)).toContain('role="alert"');expect(renderToStaticMarkup(<Empty/>)).toContain('No records yet.');expect(renderToStaticMarkup(<Badge>blocked</Badge>)).toContain('blocked')});
});
describe('API failure propagation (test-only network stubs)',()=>{
 afterEach(()=>vi.unstubAllGlobals());
 it('does not turn an API error into a successful result',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,json:async()=>({detail:'AI provider is not configured'})}));await expect(api('/api/test')).rejects.toThrow('AI provider is not configured')});
 it('redacts structured validation errors',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,json:async()=>({detail:[{input:'sensitive input'}]})}));await expect(api('/api/test')).rejects.toThrow('Validation failed. Check your inputs.')});
});
