import {describe,it,expect} from 'vitest';
import {sourceHealth} from './sourceHealth';
const fact=(id:string,value:string,extra={})=>({id,source_id:id,status:'approved',rule_type:'fact',config:{subject:'Product price',value},...extra});
describe('source health',()=>{
 it('surfaces incompatible active numeric facts for an administrator',()=>expect(sourceHealth([fact('a','₹1,999'),fact('b','₹2,499')]).conflicts).toHaveLength(2));
 it('does not treat formatting differences as conflicts',()=>expect(sourceHealth([fact('a','₹1,999'),fact('b','₹ 1999')]).conflicts).toHaveLength(0));
 it('excludes expired, future and unapproved sources from conflicts',()=>{const now=Date.parse('2026-11-15T00:00:00Z');const result=sourceHealth([fact('a','₹1,999'),fact('b','₹2,499',{expires_at:'2026-11-14T00:00:00Z'}),fact('c','₹3,499',{valid_from:'2026-11-16T00:00:00Z'}),fact('d','₹4,499',{status:'draft'})],now);expect(result.expired.map(v=>v.id)).toEqual(['b']);expect(result.conflicts).toHaveLength(0)});
 it('ignores classification and palette ordering when the actual rule is unchanged',()=>{const palette=(id:string,colors:string[],classification:string)=>({source_id:id,status:'approved',rule_type:'palette',config:{colors,classification}});expect(sourceHealth([palette('a',['#FFFFFF','#000000'],'PUBLIC'),palette('b',['#000000','#ffffff'],'INTERNAL')]).conflicts).toHaveLength(0)});
});
