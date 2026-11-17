import type {Row} from './components';

export function governanceMetrics(data:Record<string,Row[]>,days:number,now:number){
 const content=data.content||[],runs=data.analysis_runs||[],issues=data.issues||[],requests=data.review_requests||[],decisions=data.decisions||[];
 const cutoff=days?now-days*86400000:-Infinity;
 const inPeriod=(r:Row)=>{const t=Date.parse(r.created_at);return Number.isFinite(t)&&t>=cutoff&&t<=now};
 const currentVersions=new Set(content.map(c=>c.current_version_id).filter(Boolean));
 const latest=new Map<string,Row>();
 for(const run of runs){
  if(run.status!=='complete'||!currentVersions.has(run.content_version_id))continue;
  const previous=latest.get(run.content_version_id);
  if(!previous||Date.parse(run.created_at)>Date.parse(previous.created_at)||(run.created_at===previous.created_at&&String(run.id)>String(previous.id)))latest.set(run.content_version_id,run);
 }
 const currentRunIds=new Set([...latest.values()].map(r=>r.id));
 const currentIssues=issues.filter(i=>currentRunIds.has(i.run_id));
 const categories=new Map<string,{name:string,count:number,content:Set<string>}>();
 const runToVersion=new Map([...latest.values()].map(r=>[r.id,r.content_version_id]));
 for(const issue of currentIssues){
  if(issue.severity==='info')continue;
  const entry=categories.get(issue.category)||{name:issue.category,count:0,content:new Set<string>()};
  entry.count++;
  entry.content.add(runToVersion.get(issue.run_id));
  categories.set(issue.category,entry);
 }
 const periodDecisions=decisions.filter(inPeriod);
 const requestById=new Map(requests.map(r=>[r.id,r]));
 const turnaround=periodDecisions.flatMap(d=>{const request=requestById.get(d.request_id);if(!request)return [];const hours=(Date.parse(d.created_at)-Date.parse(request.created_at))/3600000;return Number.isFinite(hours)&&hours>=0?[hours]:[]});
 const approved=periodDecisions.filter(d=>d.decision==='approved').length;
 const rejected=periodDecisions.filter(d=>d.decision==='rejected').length;
 const trend=new Map<string,{day:string,completed:number,approved:number,rejected:number}>();
 function add(row:Row,key:'completed'|'approved'|'rejected'){if(!inPeriod(row))return;const day=new Date(row.created_at).toISOString().slice(0,10);const entry=trend.get(day)||{day,completed:0,approved:0,rejected:0};entry[key]++;trend.set(day,entry)}
 for(const run of runs)if(run.status==='complete')add(run,'completed');
 for(const d of periodDecisions)if(d.decision==='approved'||d.decision==='rejected')add(d,d.decision);
 return {currentAnalyzed:latest.size,currentWarnings:currentIssues.filter(i=>i.severity!=='info').length,
 currentInfo:currentIssues.filter(i=>i.severity==='info').length,
 categories:[...categories.values()].map(c=>({name:c.name,count:c.count,affected:c.content.size})).sort((a,b)=>b.affected-a.affected||b.count-a.count||a.name.localeCompare(b.name)),
 submissions:requests.filter(inPeriod).length,approved,rejected,approvalRate:approved+rejected?approved/(approved+rejected):null,
 meanHours:turnaround.length?turnaround.reduce((a,b)=>a+b,0)/turnaround.length:null,turnaroundCount:turnaround.length,
 trend:[...trend.values()].sort((a,b)=>a.day.localeCompare(b.day)),
 capped:Object.entries(data).filter(([,rows])=>rows.length>=1000).map(([name])=>name)};
}
