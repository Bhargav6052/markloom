import {describe,it,expect} from 'vitest';
import {flightPose,journeyPose} from './pileMotion';
const layout={homeX:0,homeY:0,dockX:180,dockY:10,rx:75,ry:50,angle:-9};const stops=[900,2475,4050];
describe('individual cinematic journeys',()=>{
 it('shows a complete hero pile and exactly one featured card at each stage',()=>{expect([0,1,2].map(i=>journeyPose(0,i,stops,900,layout).opacity)).toEqual([1,1,1]);for(let active=0;active<3;active++){const poses=[0,1,2].map(i=>journeyPose(stops[active]+300,i,stops,900,layout));expect(poses.map(p=>p.opacity)).toEqual([0,1,2].map(i=>i===active?1:0))}});
 it('uses a bounded partial arc and a continuous dock in both directions',()=>{const first=flightPose(0,layout),arc=flightPose(.65,layout),dock=flightPose(1,layout);expect(first.x).toBeLessThan(layout.dockX);expect(arc.x).toBeGreaterThan(layout.dockX);expect(flightPose(.65-.000001,layout).x).toBeCloseTo(arc.x,3);expect(dock.x).toBe(180);expect(dock.y).toBe(10);expect(dock.phase).toBe('settled');for(const p of [0,.2,.5,.8,1,.8,.5,.2,0]){const pose=flightPose(p,layout);expect(Math.abs(pose.x-layout.dockX)).toBeLessThanOrEqual(75);expect(Math.abs(pose.y-layout.dockY)).toBeLessThanOrEqual(50)}});
 it('restores the exact hero state after reversing and keeps hidden cards hidden between scenes',()=>{expect(journeyPose(1700,1,stops,900,layout).opacity).toBe(0);journeyPose(4500,2,stops,900,layout);expect(journeyPose(0,2,stops,900,layout)).toMatchObject({x:0,y:0,opacity:1,scale:1,phase:'pile'})});
});
