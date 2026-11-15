export type GraphRecord=Record<string,unknown>;
export type EvidenceNode={id:string;label:string;kind:'fact'|'content';recordId:string;version:unknown;affected:boolean};
export type EvidenceModel={nodes:EvidenceNode[];edges:{id:string;from:string;to:string}[];unresolved:number;omitted:number};
/** Only recorded fact-version → content-version edges. Missing references never become inferred links. */
export function evidenceModel(dependencies:GraphRecord[],facts:GraphRecord[],versions:GraphRecord[],content:GraphRecord[],sources:GraphRecord[],impacts:GraphRecord[],limit=60):EvidenceModel{
 const nodes=new Map<string,EvidenceNode>(),edges:EvidenceModel['edges']=[];let unresolved=0,omitted=0;
 for(const d of dependencies){const fact=facts.find(f=>f.id===d.fact_version_id),version=versions.find(v=>v.id===d.content_version_id);const item=content.find(c=>c.id===version?.content_id);if(!fact||!version||!item){unresolved++;continue}if(edges.length>=limit){omitted++;continue}const from='fact:'+String(fact.id),to='content:'+String(version.id);const source=sources.find(s=>s.id===fact.source_id);nodes.set(from,{id:from,label:String(source?.name||'Recorded fact')+' · v'+String(fact.version),kind:'fact',recordId:String(fact.id),version:fact.version,affected:false});nodes.set(to,{id:to,label:String(item.title||'Recorded content')+' · v'+String(version.version),kind:'content',recordId:String(item.id),version:version.version,affected:impacts.some(i=>i.content_id===item.id&&i.status==='open')});edges.push({id:String(d.id),from,to})}
 return {nodes:[...nodes.values()],edges,unresolved,omitted};
}
