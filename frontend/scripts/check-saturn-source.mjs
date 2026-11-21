import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const manifest=JSON.parse(await readFile(new URL('../../docs/saturn-source-manifest.json',import.meta.url),'utf8'));
for(const [file,expected] of Object.entries(manifest.sha256)){
 const actual=createHash('sha256').update(await readFile(new URL('../../'+file,import.meta.url))).digest('hex');
 assert.equal(actual,expected,`Original Saturn source differs: ${file}`);
}
console.log(`PASS ${Object.keys(manifest.sha256).length} original Saturn source/assets match their SHA-256 provenance manifest`);
