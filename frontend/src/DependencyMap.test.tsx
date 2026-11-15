import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import DependencyMap from './DependencyMap';
describe('recorded dependency map',()=>{
 it('does not invent a graph in an empty workspace',()=>expect(renderToStaticMarkup(<DependencyMap dependencies={[]} versions={[]} facts={[]} content={[]} sources={[]}/>)).toBe(''));
 it('connects only the supplied evidence and the matching content version',()=>{const html=renderToStaticMarkup(<MemoryRouter><DependencyMap dependencies={[{id:'dep',fact_version_id:'f',content_version_id:'v',evidence_quote:'Approved price ₹1,999',quote:'Offer ₹1,999'}]} facts={[{id:'f',source_id:'s',version:3}]} versions={[{id:'v',content_id:'c',version:2}]} sources={[{id:'s',name:'Price specification'}]} content={[{id:'c',title:'Registered ad',current_version_id:'v',status:'needs_review'},{id:'unrelated',title:'Unrelated ad'}]}/></MemoryRouter>);expect(html).toContain('Price specification');expect(html).toContain('href="/app/content/c"');expect(html).toContain('needs_review');expect(html).not.toContain('Unrelated ad')});
});
