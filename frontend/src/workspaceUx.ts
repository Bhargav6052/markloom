import type {Row} from './components';
export function filterContent(rows:Row[],query:string,status:string,channel:string){
 const q=query.trim().toLowerCase();
 return rows.filter(r=>(!q||String(r.title??'').toLowerCase().includes(q))&&
  (!status||r.status===status)&&(!channel||r.channel===channel));
}
export function filterFindings(rows:Row[],severity:string){
 return rows.filter(r=>!severity||r.severity===severity);
}
export function reviewStage(status:string,hasRun:boolean,runStatus?:string){
 if(status==='approved')return 'Approved by a human';
 if(status==='submitted')return 'Awaiting human review';
 if(runStatus==='running')return 'Analysis running';
 if(runStatus==='complete')return 'Analysis complete · review findings';
 if(runStatus==='error')return 'Analysis failed · retry saved version';
 return hasRun?'Check analysis status':'Saved version · ready to analyze';
}
