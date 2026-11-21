import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import SaturnHero from './SaturnHero';
describe('Saturn UI design',()=>{
 it('renders fully functional primary navigation and an accessible static fallback without WebGL',()=>{
  const html=renderToStaticMarkup(<MemoryRouter><SaturnHero onCreate={()=>{}}/></MemoryRouter>);
  expect(html).toContain('Proof behind');expect(html).toContain('every idea.');
  expect(html).toContain('href="/signup"');expect(html).toContain('href="#source"');
  expect(html).toContain('href="/product-tour"');expect(html).toContain('saturn-m-svg');
  expect(html).toContain('aria-label="Explore Markloom workflow"');
 });
});
