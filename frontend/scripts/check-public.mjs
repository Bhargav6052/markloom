import {readFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const pages=JSON.parse(readFileSync('src/site-pages.json','utf8'));
for(const [path,meta]of Object.entries(pages)){
 const html=readFileSync(join('dist',path==='/'?'':path.slice(1),'index.html'),'utf8');
 assert.ok(html.includes(meta.title),'Missing route title '+path);
 for(const value of ['name="description"','property="og:image"','name="twitter:card"','og:image:alt','rel="icon"'])assert.ok(html.includes(value),'Missing '+value+' in '+path);
}
assert.ok(readFileSync('dist/404.html','utf8').includes('noindex'));
const robots=readFileSync('dist/robots.txt','utf8');const sitemap=readFileSync('dist/sitemap.xml','utf8');
assert.ok(robots.includes('Disallow: /')&&sitemap.includes('<urlset'));
assert.ok(!sitemap.includes('/app')&&!sitemap.includes('/signup'));
assert.ok(statSync('dist/social-preview.png').size<100000,'Social PNG exceeds 100KB budget');
assert.ok(statSync('dist/social-preview.webp').size<60000,'Social WebP exceeds 60KB budget');
console.log('PASS route metadata, social/icon assets, crawler controls, 404 and image byte budgets');
