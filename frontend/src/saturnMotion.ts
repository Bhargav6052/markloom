export type SaturnPose={spin:number;orbit:number;x:number;y:number;z:number;shiftX:number;shiftY:number;idleWeight:number};
export type SaturnPointer={x:number;y:number;last:number;dragging:boolean};
export const saturnRest:SaturnPose={spin:0,orbit:0,x:0,y:0,z:0,shiftX:0,shiftY:0,idleWeight:1};
const clamp=(v:number)=>Math.max(-1,Math.min(1,v));
/** Speed stays constant at idle; pointer offsets are independent of accumulated yaw. */
export function stepSaturn(state:SaturnPose,delta:number,pointer:{x:number;y:number;idleMs:number},reduced=false):SaturnPose{
 if(reduced)return {...saturnRest};const dt=Math.max(0,Math.min(.05,delta)),alpha=1-Math.exp(-4*dt),idle=pointer.idleMs>=700;
 const approach=(a:number,b:number)=>a+(b-a)*alpha;
 const idleWeight=approach(state.idleWeight,idle?1:0),x=clamp(pointer.x),y=clamp(pointer.y);
 return {spin:state.spin+dt*(Math.PI*2/30)*idleWeight,orbit:state.orbit+dt*(Math.PI*2/50),x:approach(state.x,idle?0:-y*.065),y:approach(state.y,idle?0:x*.065),z:approach(state.z,idle?0:-x*.018),shiftX:approach(state.shiftX,idle?0:x*.055),shiftY:approach(state.shiftY,idle?0:-y*.035),idleWeight};
}

/** Fit the 2.3-unit orbit radius inside the horizontal camera frustum. */
export function saturnCameraDistance(width:number,height:number){const aspect=Math.max(.35,Math.max(1,width)/Math.max(1,height));return 6.1*Math.max(1,1.1/aspect)}
