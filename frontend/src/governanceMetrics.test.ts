import {describe,it,expect} from 'vitest';
import {governanceMetrics} from './governanceMetrics';
const now=Date.parse('2026-11-18T12:00:00Z');
const date='2026-11-17T12:00:00Z';
describe('governance metrics',()=>{
 it('counts only latest completed run per current revision and excludes informational findings',()=>{
  const data={content:[{id:'c',current_version_id:'v2'},{id:'d',current_version_id:'v3'}],
   analysis_runs:[{id:'old-version',content_version_id:'v1',status:'complete',created_at:date},{id:'old-run',content_version_id:'v2',status:'complete',created_at:date},{id:'new-run',content_version_id:'v2',status:'complete',created_at:'2026-11-18T01:00:00Z'},{id:'failed',content_version_id:'v2',status:'error',created_at:'2026-11-18T02:00:00Z'},{id:'other',content_version_id:'v3',status:'complete',created_at:date}],
   issues:[{run_id:'old-version',category:'claim',severity:'warning'},{run_id:'old-run',category:'claim',severity:'warning'},{run_id:'new-run',category:'visual',severity:'info'},{run_id:'new-run',category:'tone',severity:'warning'},{run_id:'new-run',category:'tone',severity:'warning'},{run_id:'other',category:'tone',severity:'warning'}]};
  const result=governanceMetrics(data,30,now);
  expect(result.currentAnalyzed).toBe(2);expect(result.currentWarnings).toBe(3);expect(result.currentInfo).toBe(1);
  expect(result.categories).toEqual([{name:'tone',count:3,affected:2}]);
 });
 it('applies period to activity, not current snapshot; calculates rate and turnaround',()=>{
  const data={review_requests:[{id:'r',created_at:date},{id:'old',created_at:'2026-09-01T00:00:00Z'}],decisions:[{request_id:'r',decision:'approved',created_at:'2026-11-17T14:00:00Z'},{request_id:'missing',decision:'rejected',created_at:date},{request_id:'old',decision:'approved',created_at:'2026-09-02T00:00:00Z'}]};
  const r=governanceMetrics(data,7,now);expect(r.submissions).toBe(1);expect(r.approved).toBe(1);expect(r.rejected).toBe(1);expect(r.approvalRate).toBe(.5);expect(r.meanHours).toBe(2);expect(r.turnaroundCount).toBe(1);
  expect(r.trend).toEqual([{day:'2026-11-17',completed:0,approved:1,rejected:1}]);
 });
 it('reports uncertain coverage and empty rates honestly',()=>{const r=governanceMetrics({issues:Array.from({length:1000},()=>({}))},0,now);expect(r.capped).toEqual(['issues']);expect(r.approvalRate).toBeNull();expect(r.meanHours).toBeNull()});
});
