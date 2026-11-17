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

// Rebuild only this editor's previously accepted suggestions on the exact saved version.
// No draft text is written to browser storage, and ambiguous/stale suggestions are skipped.
export function recoverAcceptedCorrections(
 body:string, versionId:string, actorId:string,
 runs:ReadonlyArray<Record<string,unknown>>,
 issues:ReadonlyArray<Record<string,unknown>>,
 decisions:ReadonlyArray<Record<string,unknown>>
):{body:string;applied:number;skipped:number}{
 const runIds=new Set(runs.filter(r=>r.content_version_id===versionId&&r.status==='complete').map(r=>r.id));
 const byId=new Map(issues.filter(i=>runIds.has(i.run_id)).map(i=>[i.id,i]));
 const accepted=decisions.filter(d=>d.actor===actorId&&d.choice==='accepted'&&byId.has(d.issue_id))
  .slice().sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||''))||String(a.issue_id).localeCompare(String(b.issue_id)));
 let applied=0,skipped=0;
 for(const decision of accepted){
  const issue=byId.get(decision.issue_id)!;
  const next=previewCorrection(body,typeof issue.quote==='string'?issue.quote:'',typeof issue.correction==='string'?issue.correction:'');
  if(next===null){skipped++;continue}
  body=next;applied++;
 }
 return {body,applied,skipped};
}
