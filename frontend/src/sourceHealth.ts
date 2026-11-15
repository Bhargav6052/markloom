import type {Row} from './components';
const text=(v:unknown)=>String(v??'').trim().toLocaleLowerCase();
function signature(v:Row){const c=v.config||{};switch(v.rule_type){case 'fact':return c.subject&&c.value?['fact:'+text(c.subject),text(c.value).replace(/[\s,]/g,'')]:null;case 'forbidden_term':return c.term?['term:'+text(c.term),text(c.replacement)]:null;case 'dimensions':return ['dimensions',`${c.width}x${c.height}`];case 'contrast':return ['contrast',String(c.minimum)];case 'palette':return ['palette',JSON.stringify([...(c.colors||[])].map(text).sort())+':'+(c.tolerance??45)];default:return null}}
export function sourceHealth(versions:Row[],now=Date.now()){
 const approved=versions.filter(v=>v.status==='approved');
 const expired=approved.filter(v=>v.expires_at&&Date.parse(v.expires_at)<=now);
 const effective=approved.filter(v=>(!v.valid_from||Date.parse(v.valid_from)<=now)&&(!v.expires_at||Date.parse(v.expires_at)>now));
 const conflicts=effective.filter((v,i)=>{const a=signature(v);return a&&effective.some((w,j)=>{if(i===j||v.source_id===w.source_id)return false;const b=signature(w);return b&&a[0]===b[0]&&a[1]!==b[1]})});
 return {expired,conflicts};
}
