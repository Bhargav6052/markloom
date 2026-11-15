import PurposeVisual,{purposeFor,type VisualKind} from './PurposeVisual';
import {useEffect,useState} from 'react';
import {api,supabase,apiBase} from './api';
import {useWorkspace} from './context';
export type Row=Record<string,any>;
export function useRecords(tables:string[],revision=0){
 const {org}=useWorkspace();const key=tables.join(',');const scope=org.id+':'+key;
 const [snapshot,setSnapshot]=useState<{scope:string;data:Record<string,Row[]>}>({scope:'',data:{}});const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [tick,setTick]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');Promise.all(key.split(',').map(async table=>[table,await api(`/api/orgs/${org.id}/${table}`)] as const)).then(entries=>{if(active)setSnapshot({scope,data:Object.fromEntries(entries)})}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[org.id,key,scope,revision,tick]);
 const data=snapshot.scope===scope?snapshot.data:{};
 const pending=(data.analysis_jobs||[]).some(j=>['queued','running'].includes(j.status));
 useEffect(()=>{if(!pending)return;const timer=setInterval(()=>setTick(n=>n+1),3000);return()=>clearInterval(timer)},[pending,org.id]);
 return {data,error,loading};
}
export function useAction(){const {org}=useWorkspace();const [error,setError]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [revision,setRevision]=useState(0);async function run<T=any>(work:()=>Promise<T>,success='Saved.'):Promise<T|undefined>{setError('');setMessage('');setBusy(true);try{const result=await work();setMessage(success);setRevision(n=>n+1);return result}catch(e){setError((e as Error).message);return undefined}finally{setBusy(false)}}return {run,error,message,busy,revision,command:(action:string,data:Row)=>api(`/api/orgs/${org.id}/command`,{action,data}),setError}}
export function Status({error,message,loading}:{error?:string;message?:string;loading?:boolean}){return <>{error&&<div className="error" role="alert">{error}</div>}{message&&<div className="notice" role="status">{message}</div>}{loading&&<p role="status" className="muted">Loading workspace records…</p>}</>}
export function Badge({children}:{children:React.ReactNode}){return <span className="badge">{children}</span>}
export function PageHeader({title,description,kind}:{title:string;description:string;kind?:VisualKind}){return <header className="workspace-heading"><div><p className="eyebrow">GOVERNANCE WORKSPACE</p><h1>{title}</h1><p className="muted">{description}</p></div><PurposeVisual kind={kind||purposeFor(title)}/><Badge>HUMAN CONTROLLED</Badge></header>}
export function Empty({children='No records yet.'}:{children?:React.ReactNode}){return <div className="empty"><svg className="empty-art" width="78" height="64" viewBox="0 0 78 64" fill="none" aria-hidden="true"><path d="M22 12h34v43H22z" stroke="currentColor"/><path d="M15 18H9v43h34v-6M29 6h34v43h-7M30 27h18M30 34h14M30 41h18" stroke="currentColor"/><circle cx="61" cy="12" r="10" fill="currentColor" fillOpacity=".12"/><path d="m57 12 3 3 5-6" stroke="currentColor"/></svg><p>{children}</p></div>}
export const date=(value:string)=>new Date(value).toLocaleString();
export async function download(org:string,doc:Row){const session=(await supabase!.auth.getSession()).data.session;const r=await fetch(`${apiBase}/api/orgs/${org}/documents/${doc.id}/download`,{headers:{Authorization:`Bearer ${session?.access_token}`}});if(!r.ok)throw new Error('Download failed');const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download=doc.name;a.click();URL.revokeObjectURL(url)}
