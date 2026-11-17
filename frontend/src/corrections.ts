// Legacy suggestions may contain editing instructions rather than replacement text.
export function previewCorrection(body:string, quote:string, correction:string):string|null {
 const replacement=correction.trim();
 if(!replacement || /^(?:please\s+)?(?:remove|delete|replace|add|insert|include|rewrite|revise|avoid|change|update|ensure|use|clarify|rephrase|consider|omit)\b/i.test(replacement))return null;
 if(replacement==='[[DELETE]]'&&!quote)return null;
 if(quote){
  const index=body.indexOf(quote);
  if(index<0||body.indexOf(quote,index+quote.length)>=0)return null;
  const value=replacement==='[[DELETE]]'?'':replacement;
  if(value===quote)return null;
  return body.slice(0,index)+value+body.slice(index+quote.length);
 }
 if(body.includes(replacement))return null;
 return body+(body?'\n\n':'')+replacement;
}
