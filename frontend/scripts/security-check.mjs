import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
const patterns=[/sb_secret_[A-Za-z0-9_-]{10,}/,/\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}/,/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/];
let files=0;
async function scan(path){for(const e of await readdir(path,{withFileTypes:true})){const p=join(path,e.name);if(e.isDirectory())await scan(p);else if(/\.(js|css|html|json|ts|tsx|mjs)$/.test(e.name)){const text=await readFile(p,'utf8');files++;if(patterns.some(r=>r.test(text)))throw new Error('Potential private credential in '+p);for(const match of text.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)){try{if(JSON.parse(Buffer.from(match[0].split('.')[1],'base64url').toString()).role==='service_role')throw new Error('SERVICE_ROLE')}catch(e){if(e.message==='SERVICE_ROLE')throw new Error('Service-role JWT in '+p)}}}}}
await scan('src');await scan('dist');console.log(`PASS scanned ${files} source/build files for private credentials; publishable Supabase keys remain public by design.`);
