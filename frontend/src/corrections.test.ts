import {describe,it,expect} from 'vitest';
import {previewCorrection} from './corrections';
describe('draft correction safety',()=>{
 it('blocks old editing instructions',()=>{expect(previewCorrection('Our AI never makes mistakes.','Our AI never makes mistakes.','Remove the absolute guarantee.')).toBeNull();expect(previewCorrection('Draft','','Add the required disclaimer.')).toBeNull()});
 it('replaces one literal passage only',()=>expect(previewCorrection('The best product.','best','helpful')).toBe('The helpful product.'));
 it('deletes an exact passage',()=>expect(previewCorrection('Keep. Delete.',' Delete.','[[DELETE]]')).toBe('Keep.'));
 it('appends missing text once',()=>{expect(previewCorrection('Draft','','Human review is required.')).toBe('Draft\n\nHuman review is required.');expect(previewCorrection('Human review is required.','','Human review is required.')).toBeNull()});
 it('blocks ambiguous or stale quotes',()=>{expect(previewCorrection('best best','best','helpful')).toBeNull();expect(previewCorrection('changed','best','helpful')).toBeNull()});
 it('treats dollar signs as literal text',()=>expect(previewCorrection('Price: $50','$50','$&')).toBe('Price: $&'));
});
