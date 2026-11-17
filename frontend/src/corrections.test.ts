import {describe,it,expect} from 'vitest';
import {previewCorrection,recoverAcceptedCorrections} from './corrections';
describe('draft correction safety',()=>{
 it('blocks old editing instructions',()=>{expect(previewCorrection('Our AI never makes mistakes.','Our AI never makes mistakes.','Remove the absolute guarantee.')).toBeNull();expect(previewCorrection('Draft','','Add the required disclaimer.')).toBeNull()});
 it('replaces one literal passage only',()=>expect(previewCorrection('The best product.','best','helpful')).toBe('The helpful product.'));
 it('deletes an exact passage',()=>expect(previewCorrection('Keep. Delete.',' Delete.','[[DELETE]]')).toBe('Keep.'));
 it('appends missing text once',()=>{expect(previewCorrection('Draft','','Human review is required.')).toBe('Draft\n\nHuman review is required.');expect(previewCorrection('Human review is required.','','Human review is required.')).toBeNull()});
 it('blocks ambiguous or stale quotes',()=>{expect(previewCorrection('best best','best','helpful')).toBeNull();expect(previewCorrection('changed','best','helpful')).toBeNull()});
 it('treats dollar signs as literal text',()=>expect(previewCorrection('Price: $50','$50','$&')).toBe('Price: $&'));
});

describe('accepted correction recovery',()=>{
 const original="Markloom is the world's best AI platform. We guarantee perfect results. Our AI never makes mistakes.";
 const disclaimer='AI-generated findings require human verification before publication.';
 const runs=[{id:'r1',content_version_id:'v2',status:'complete'},{id:'r2',content_version_id:'v2',status:'complete'},{id:'old',content_version_id:'v1',status:'complete'}];
 const issues=[{id:'a',run_id:'r1',quote:"the world's best",correction:'an'},{id:'b',run_id:'r1',quote:'',correction:disclaimer},{id:'c',run_id:'r2',quote:'We guarantee perfect results.',correction:'[[DELETE]]'},{id:'d',run_id:'r2',quote:'Our AI never makes mistakes.',correction:'[[DELETE]]'},{id:'e',run_id:'r2',quote:'',correction:disclaimer},{id:'old',run_id:'old',quote:'Markloom',correction:'Wrong'},{id:'other',run_id:'r1',quote:'Markloom',correction:'Wrong'}];
 const decisions=issues.map((i,n)=>({issue_id:i.id,actor:i.id==='other'?'other-user':'creator',choice:'accepted',created_at:String(n)}));
 it('recovers consecutive edits across runs without duplicating disclaimer',()=>{
  const result=recoverAcceptedCorrections(original,'v2','creator',runs,issues,decisions);
  expect(result.body).toContain('Markloom is an AI platform.');
  expect(result.body).not.toContain('guarantee');
  expect(result.body).not.toContain('never makes mistakes');
  expect(result.body.split(disclaimer)).toHaveLength(2);
  expect(result.applied).toBe(4);expect(result.skipped).toBe(1);
 });
 it('does not replay already-applied or stale corrections',()=>{
  const first=recoverAcceptedCorrections(original,'v2','creator',runs,issues,decisions);
  const second=recoverAcceptedCorrections(first.body,'v2','creator',runs,issues,decisions);
  expect(second.body).toBe(first.body);expect(second.applied).toBe(0);
 });
 it('ignores other actors, other versions and non-accepted decisions',()=>{
  const result=recoverAcceptedCorrections(original,'v2','creator',runs,issues,decisions.map(d=>({...d,choice:d.issue_id==='other'||d.issue_id==='old'?'accepted':'dismissed'})));
  expect(result.body).toBe(original);
 });
});
