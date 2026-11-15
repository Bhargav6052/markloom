/** Cursor response is 25% calibrated strength; units are normalized viewport units. */
export const CURSOR_STRENGTH=.25;
const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
const follow=(value:number,target:number,rate:number,dt:number)=>value+(target-value)*(1-Math.exp(-rate*dt));
export type CursorMotion={targetX:number;targetY:number;x:number;y:number;vx:number;vy:number;speed:number;sampleX:number;sampleY:number;sampleTime:number|null;active:boolean};
export function createCursorMotion():CursorMotion{return {targetX:0,targetY:0,x:0,y:0,vx:0,vy:0,speed:0,sampleX:0,sampleY:0,sampleTime:null,active:false}}
export function sampleCursor(state:CursorMotion,x:number,y:number,time:number){
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(time))return;
 x=clamp(x,-1,1);y=clamp(y,-1,1);const elapsed=state.sampleTime===null?0:(time-state.sampleTime)/1000;
 // The first event after a pause/re-entry establishes a position, not a velocity spike.
 if(elapsed>0&&elapsed<=.15){const dt=Math.max(elapsed,1/240),dx=x-state.sampleX,dy=y-state.sampleY,rawSpeed=Math.hypot(dx,dy)/dt,scale=rawSpeed>8?8/rawSpeed:1;state.vx=follow(state.vx,dx/dt*scale,20,dt);state.vy=follow(state.vy,dy/dt*scale,20,dt)}else{state.vx=0;state.vy=0}
 state.sampleX=x;state.sampleY=y;state.sampleTime=time;state.targetX=x*CURSOR_STRENGTH;state.targetY=y*CURSOR_STRENGTH;state.active=true;
}
export function releaseCursor(state:CursorMotion){state.targetX=0;state.targetY=0;state.sampleTime=null;state.active=false;state.vx=0;state.vy=0}
export function stepCursor(state:CursorMotion,delta:number,now:number){
 const dt=clamp(Number.isFinite(delta)?delta:0,0,.05);
 if(state.sampleTime===null||now-state.sampleTime>32){state.vx=follow(state.vx,0,7,dt);state.vy=follow(state.vy,0,7,dt)}
 const measured=Math.min(8,Math.hypot(state.vx,state.vy));state.speed=follow(state.speed,measured,10,dt);
 // Fast gestures respond sooner; slower gestures keep a longer, cinematic ease.
 const response=3.5+Math.min(state.speed,2)*CURSOR_STRENGTH;
 state.x=follow(state.x,state.targetX,response,dt);state.y=follow(state.y,state.targetY,response,dt);
 return {x:state.x,y:state.y,vx:state.vx*CURSOR_STRENGTH,vy:state.vy*CURSOR_STRENGTH,speed:state.speed*CURSOR_STRENGTH,response};
}

/** Independent visual bounds prevent fast gestures from amplifying motion. */
export function cursorVisual(c:{x:number;y:number;vx:number;vy:number}){return {x:clamp(c.x*10+c.vx*.08,-7,7),y:clamp(-c.y*8-c.vy*.06,-7,7),rx:clamp(-c.y*9-c.vy*.08,-4,4),ry:clamp(c.x*10+c.vx*.08,-4,4)}}
