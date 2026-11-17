import type {Row} from './components';

// Read only the attachment bound to the selected saved version, never the editable draft.
export function VersionAttachment({version,documents,busy,onDownload}:{version:Row;documents:Row[];busy:boolean;onDownload:(doc:Row)=>void}){
 const doc=version.document_id?documents.find(d=>d.id===version.document_id):undefined;
 return <div>
  <h3>Saved original attachment</h3>
  {!version.document_id?<p className="muted">No original attachment for this version.</p>:doc?<><p>{doc.name}</p><button type="button" className="secondary" disabled={busy} onClick={()=>onDownload(doc)}>Download original</button></>:<p className="muted">Original attachment unavailable.</p>}
 </div>;
}
