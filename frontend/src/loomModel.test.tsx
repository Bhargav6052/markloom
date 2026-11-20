import {describe,it,expect} from 'vitest';
import {loomBlend,loomProgress} from './loomModel';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import Landing from './Landing';
describe('living loom',()=>{
 it('clamps and smoothly interpolates four stages',()=>{
 expect(loomBlend(-1)).toEqual({from:0,to:1,mix:0});expect(loomBlend(1.5)).toEqual({from:1,to:2,mix:.5});expect(loomBlend(9)).toEqual({from:2,to:3,mix:1});
 expect(loomProgress(150,[0,100,200,300])).toBe(1.5);expect(loomProgress(400,[0,100,200,300])).toBe(3);expect(loomProgress(4,[0,0,1,2])).toBe(0);
 });
 it('renders real navigation and all stages without WebGL',()=>{
 const html=renderToStaticMarkup(<MemoryRouter><Landing/></MemoryRouter>);
 expect(html).toContain('id="source"');expect(html).toContain('id="draft"');expect(html).toContain('id="decision"');expect(html).toContain('href="/signup"');expect(html).toContain('href="/login"');expect(html).toContain('Illustrative example');expect(html).not.toContain('pile-card');
 });
});
