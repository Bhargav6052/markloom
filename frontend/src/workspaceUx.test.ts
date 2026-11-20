import {describe,it,expect} from 'vitest';
import {filterContent,filterFindings,reviewStage} from './workspaceUx';
const rows=[{title:'Logo Check',status:'draft',channel:'Social'},{title:'Website Logo',status:'approved',channel:'Website'},{title:'Policy',status:'draft',channel:'Website'}];
describe('workspace navigation helpers',()=>{
 it('filters existing rows without inventing or modifying data',()=>{expect(filterContent(rows,' LOGO ','','')).toEqual(rows.slice(0,2));expect(filterContent(rows,'logo','approved','Website')).toEqual([rows[1]]);expect(filterContent(rows,'missing','','')).toEqual([]);expect(rows).toHaveLength(3)});
 it('filters findings without hiding any by default',()=>{const findings=[{severity:'info'},{severity:'critical'}];expect(filterFindings(findings,'')).toEqual(findings);expect(filterFindings(findings,'critical')).toEqual([findings[1]])});
 it('does not label AI checks as human approval',()=>{expect(reviewStage('draft',true,'complete')).toBe('Analysis complete · review findings');expect(reviewStage('approved',true,'complete')).toBe('Approved by a human');expect(reviewStage('submitted',true,'complete')).toBe('Awaiting human review')});
});
