import {describe,it,expect,vi} from 'vitest';
import {autoPilotUploadAndReview,type AutoPilotInput,type AutoPilotDependencies} from './autoPilot';
const file=new File(['test'],'brand.png',{type:'image/png'});
const input:AutoPilotInput={
  file,classification:'CONFIDENTIAL',contentId:'content-1',expectedVersionId:'version-1',
  body:'Creator original body',intent:'Check image',alt:'Image',fg:'',bg:'',externalConsent:false,
};
function dependencies(){
 const deps:AutoPilotDependencies={
  upload:vi.fn().mockResolvedValue({id:'private-doc'}),
  revise:vi.fn().mockResolvedValue({version_id:'new-version'}),
  preflight:vi.fn().mockResolvedValue({allowed:true}),
  enqueue:vi.fn().mockResolvedValue({status:'queued'}),
  newKey:()=> 'test-key',
 };
 return deps;
}
describe('AutoPilot Stage 1 — original upload and fail-closed analysis',()=>{
 it('uploads and saves an immutable version before queuing LOCAL checks without external consent',async()=>{
  const deps=dependencies();
  const result=await autoPilotUploadAndReview(input,deps);
  expect((deps.upload as ReturnType<typeof vi.fn>).mock.calls[0][0].get('purpose')).toBe('content');
  expect(deps.revise).toHaveBeenCalledWith(expect.objectContaining({
    expected_version_id:'version-1',document_id:'private-doc',body:input.body,
    metadata:expect.objectContaining({classification:'CONFIDENTIAL'})
  }));
  expect(deps.preflight).not.toHaveBeenCalled();
  expect(deps.enqueue).toHaveBeenCalledWith({version_id:'new-version',idempotency_key:'test-key',external_consent:false});
  expect(result.external).toBe(false);
 });
 it('uses exact extracted text from a text attachment instead of a mismatched editor body',async()=>{
  const deps=dependencies();
  (deps.upload as ReturnType<typeof vi.fn>).mockResolvedValue({id:'pdf',text:'Extracted PDF body'});
  const result=await autoPilotUploadAndReview({...input,externalConsent:false},deps);
  expect(result.body).toBe('Extracted PDF body');
  expect(deps.revise).toHaveBeenCalledWith(expect.objectContaining({body:'Extracted PDF body'}));
 });
 it('enqueues external AI only after explicit consent and an allowed preflight on the NEW saved version',async()=>{
  const deps=dependencies();
  const result=await autoPilotUploadAndReview({...input,classification:'PUBLIC',externalConsent:true},deps);
  expect(deps.preflight).toHaveBeenCalledWith('new-version');
  expect(deps.enqueue).toHaveBeenCalledWith(expect.objectContaining({external_consent:true}));
  expect(result.external).toBe(true);
 });
 it('falls back to LOCAL review when policy denies external transfer',async()=>{
  const deps=dependencies();
  (deps.preflight as ReturnType<typeof vi.fn>).mockResolvedValue({allowed:false,reasons:['CONFIDENTIAL data cannot leave']});
  const result=await autoPilotUploadAndReview({...input,externalConsent:true},deps);
  expect(deps.enqueue).toHaveBeenCalledWith(expect.objectContaining({external_consent:false}));
  expect(result.notice).toContain('blocked external AI');
 });
 it('fails closed to local checks on unavailable privacy preflight',async()=>{
  const deps=dependencies();
  (deps.preflight as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));
  const result=await autoPilotUploadAndReview({...input,externalConsent:true},deps);
  expect(result.external).toBe(false);
  expect(deps.enqueue).toHaveBeenCalledWith(expect.objectContaining({external_consent:false}));
 });
 it('does not create or queue a revision when upload fails',async()=>{
  const deps=dependencies();
  (deps.upload as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('storage unavailable'));
  await expect(autoPilotUploadAndReview(input,deps)).rejects.toThrow('storage unavailable');
  expect(deps.revise).not.toHaveBeenCalled();
  expect(deps.enqueue).not.toHaveBeenCalled();
 });
 it('does not queue if immutable revision save fails',async()=>{
  const deps=dependencies();
  (deps.revise as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('stale revision'));
  await expect(autoPilotUploadAndReview(input,deps)).rejects.toThrow('revision could not be saved');
  expect(deps.enqueue).not.toHaveBeenCalled();
 });
 it('preserves the revision and gives recovery instructions if the queue fails',async()=>{
  const deps=dependencies();
  (deps.enqueue as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('queue unavailable'));
  await expect(autoPilotUploadAndReview(input,deps)).rejects.toThrow('do not upload again');
  expect(deps.revise).toHaveBeenCalledTimes(1);
 });
 it('does not create approvals or change source policies',async()=>{
  const deps=dependencies();
  await autoPilotUploadAndReview(input,deps);
  expect(deps.revise).toHaveBeenCalledTimes(1);
  expect(deps.enqueue).toHaveBeenCalledTimes(1);
 });
});
