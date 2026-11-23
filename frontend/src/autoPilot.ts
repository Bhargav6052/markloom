/** AutoPilot Stage 1: opt-in one-action upload -> immutable revision -> durable review job.
 * The API and worker remain the authorities for permission and external AI transfer.
 * Never auto-approve, auto-publish, or silently grant external processing consent.
 */
export type AutoPilotInput = {
  file: File;
  classification: 'PUBLIC'|'INTERNAL'|'CONFIDENTIAL'|'RESTRICTED';
  contentId: string;
  expectedVersionId: string;
  body: string;
  intent: string;
  alt: string;
  fg: string;
  bg: string;
  externalConsent: boolean;
};
export type AutoPilotUpload = {id:string;text?:string};
export type AutoPilotPrivacy = {allowed:boolean;reasons?:string[]};
export type AutoPilotDependencies = {
  upload: (form:FormData)=>Promise<AutoPilotUpload>;
  revise: (payload:Record<string,unknown>)=>Promise<{version_id:string}>;
  preflight: (versionId:string)=>Promise<AutoPilotPrivacy>;
  enqueue: (payload:{version_id:string;idempotency_key:string;external_consent:boolean})=>Promise<unknown>;
  newKey: ()=>string;
};
export type AutoPilotResult = {
  documentId:string;
  versionId:string;
  body:string;
  external:boolean;
  notice:string;
};
export async function autoPilotUploadAndReview(input:AutoPilotInput, deps:AutoPilotDependencies):Promise<AutoPilotResult>{
  if(!input.file || !input.contentId || !input.expectedVersionId)throw new Error('Select an original and a saved content revision first.');
  const form=new FormData();
  form.append('file',input.file);
  form.append('purpose','content');
  form.append('classification',input.classification);
  const uploaded=await deps.upload(form);
  if(!uploaded?.id)throw new Error('Upload did not return a document ID. No analysis was queued.');
  // The DB binds textual attachments to their exact extracted text.
  const nextBody=uploaded.text || input.body;
  let saved;
  try{
    saved=await deps.revise({
      id:input.contentId,
      expected_version_id:input.expectedVersionId,
      body:nextBody,
      document_id:uploaded.id,
      creator_intent:input.intent.trim()||'AutoPilot: original uploaded for brand review',
      metadata:{
        classification:input.classification,
        alt_text:input.alt,
        ...(input.fg&&input.bg?{foreground:input.fg,background:input.bg}:{})
      }
    });
  }catch(err){
    throw new Error('Original uploaded, but the revision could not be saved: '+String((err as Error).message)+'. Return to the content editor to attach the uploaded original; no analysis was queued.');
  }
  if(!saved?.version_id)throw new Error('Original uploaded and revision saved, but no version ID was returned. Reload content before queuing a review.');
  let external=false;
  let notice='AutoPilot queued local checks. External AI was not authorized for this upload.';
  if(input.externalConsent){
    try{
      const decision=await deps.preflight(saved.version_id);
      external=decision.allowed===true;
      notice=external
        ? 'AutoPilot queued permitted Gemini and local checks; a human still decides approval.'
        : 'Privacy preflight blocked external AI ('+(decision.reasons||[]).join('; ')+'). Local checks queued instead.';
    }catch{
      notice='Privacy preflight was unavailable. External AI was not authorized; local checks queued instead.';
    }
  }
  try{
    await deps.enqueue({
      version_id:saved.version_id,
      idempotency_key:deps.newKey(),
      external_consent:external,
    });
  }catch(err){
    throw new Error('New saved version '+saved.version_id+' is preserved, but analysis could not be queued: '+String((err as Error).message)+'. Reload the content and use Queue local checks; do not upload again.');
  }
  return {documentId:uploaded.id,versionId:saved.version_id,body:nextBody,external,notice};
}
