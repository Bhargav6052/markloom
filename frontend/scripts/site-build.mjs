import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
export function validatePublicEnv(env){
 const allowed=new Set(['VITE_API_URL','VITE_SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY','VITE_SITE_URL']);
 for(const [name,value] of Object.entries(env)){
  if(!allowed.has(name))throw new Error(`Unapproved frontend variable ${name}. Private keys belong only on the backend.`);
  if(/sb_secret_|\bsk-(?:proj-)?[A-Za-z0-9]/.test(value))throw new Error(`Secret-like value detected in ${name}; build stopped.`);
  try{if(value.split('.').length===3&&JSON.parse(Buffer.from(value.split('.')[1],'base64url').toString()).role==='service_role')throw new Error('SERVICE_ROLE')}catch(error){if(error.message==='SERVICE_ROLE')throw new Error(`Service-role JWT detected in ${name}; build stopped.`)}
 }
 if(env.VITE_API_URL&&!env.VITE_API_URL.startsWith('https://')&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(env.VITE_API_URL))throw new Error('API origin must be HTTPS; loopback HTTP is development-only.');
 if(env.VITE_SUPABASE_URL&&!env.VITE_SUPABASE_URL.startsWith('https://')&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(env.VITE_SUPABASE_URL))throw new Error('Supabase origin must use HTTPS outside local development.');
 if(env.VITE_SITE_URL){const url=new URL(env.VITE_SITE_URL);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname))throw new Error('VITE_SITE_URL must be an HTTPS origin without a path or credentials.');}
}
const escape=(text)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function siteBuildPlugin(env){let directory;return {name:'inkloom-public-metadata',apply:'build',configResolved(config){directory=resolve(config.root,config.build.outDir)},closeBundle(){
 validatePublicEnv(env);
 const pages=JSON.parse(readFileSync(resolve('src/site-pages.json'),'utf8'));
 const origin=env.VITE_SITE_URL?.replace(/\/$/,'')||'';
 if(process.env.REQUIRE_PUBLIC_SITE==='true'&&!origin)throw new Error('VITE_SITE_URL is required for public deployment.');
 const html=readFileSync(resolve(directory,'index.html'),'utf8');
 function page(meta,path){const image=origin?origin+'/social-preview.png':'/social-preview.png';const tags=`<title>${escape(meta.title)}</title><meta name="description" content="${escape(meta.description)}"/><meta name="robots" content="${meta.index&&origin?'index,follow':'noindex,nofollow'}"/><meta property="og:type" content="website"/><meta property="og:site_name" content="Markloom"/><meta property="og:title" content="${escape(meta.title)}"/><meta property="og:description" content="${escape(meta.description)}"/><meta property="og:image" content="${image}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="Markloom — Ideas move. Truth stays connected. Evidence-led brand governance."/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:image" content="${image}"/><meta name="twitter:image:alt" content="Markloom evidence-led brand governance"/>${origin&&meta.index?`<link rel="canonical" href="${origin+path}"/><meta property="og:url" content="${origin+path}"/>`:''}`;const schema=origin&&meta.index?`<script type="application/ld+json" data-markloom-schema>${JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'WebSite',name:'Markloom',url:origin},{'@type':'SoftwareApplication',name:'Markloom',applicationCategory:'BusinessApplication',operatingSystem:'Web',url:origin},...(path==='/'?[]:[{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Markloom',item:origin},{'@type':'ListItem',position:2,name:meta.title.split(' | ')[0],item:origin+path}]}])]}).replace(/</g,'\\u003c')}</script>`:'';return html.replace(/<title>.*?<\/title>/s,'').replace(/<meta (?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*\/?\s*>/g,'').replace('</head>',tags+schema+'</head>')}
 for(const [path,meta]of Object.entries(pages)){const dest=path==='/'?directory:resolve(directory,path.slice(1));mkdirSync(dest,{recursive:true});writeFileSync(resolve(dest,'index.html'),page(meta,path));}
 writeFileSync(resolve(directory,'404.html'),page({title:'Page not found | Markloom',description:'This page could not be found. Return to Markloom to continue.',index:false},'/404'));
 writeFileSync(resolve(directory,'robots.txt'),origin?`User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /api\nDisallow: /login\nDisallow: /signup\nDisallow: /forgot-password\nDisallow: /reset-password\nDisallow: /auth\nDisallow: /resend-confirmation\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
 writeFileSync(resolve(directory,'llms.txt'),`# Markloom\n\nEvidence-led brand governance: approved knowledge, draft verification and human decisions.\n\n${Object.entries(pages).filter(([,meta])=>meta.index).map(([path,meta])=>`- [${meta.title}](${origin+path}): ${meta.description}`).join('\n')}\n\nPrivate workspace, authentication and API records are not public documentation.\n`);
 writeFileSync(resolve(directory,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${origin?Object.entries(pages).filter(([,meta])=>meta.index).map(([path])=>`<url><loc>${origin+path}</loc></url>`).join(''):''}</urlset>\n`);
 for(const asset of ['favicon.svg','favicon-32.png','apple-touch-icon.png','social-preview.png'])if(!existsSync(resolve(directory,asset)))throw new Error('Missing public asset '+asset);
 if(!origin)console.warn('Markloom development build: no production domain configured; indexing disabled and sitemap intentionally empty.');
 }};}
