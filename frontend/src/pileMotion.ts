const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{v=clamp(v);return v*v*(3-2*v)};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export type CardPose={x:number;y:number;z:number;rx:number;ry:number;rz:number;scale:number;opacity:number;phase:string};
export type CardLayout={homeX:number;homeY:number;dockX:number;dockY:number;rx:number;ry:number;angle:number;intensity?:number};
/** A short partial arc followed by a tangent-matched, gentle dock. */
export function flightPose(progress:number,layout:CardLayout){
 const p=clamp(progress),strength=layout.intensity??.55,{dockX:x,dockY:y}=layout,rx=layout.rx*strength,ry=layout.ry*strength;
 const angle=(t:number)=>-Math.PI*.8+Math.PI*.6*t;
 const point=(a:number)=>({x:x+Math.cos(a)*rx,y:y+Math.sin(a)*ry,z:Math.sin(a)*5*strength,rx:Math.cos(a)*1.5*strength,ry:Math.sin(a)*2*strength,rz:Math.cos(a)*strength});
 if(p<.65)return {...point(angle(ease(p/.65))),phase:'orbit'};
 const end=point(angle(1)),t=ease((p-.65)/.35);return {x:mix(end.x,x,t),y:mix(end.y,y,t),z:mix(end.z,0,t),rx:mix(end.rx,0,t),ry:mix(end.ry,0,t),rz:mix(end.rz,0,t),phase:p>=.9999?'settled':'docking'};
}
export function journeyPose(scroll:number,index:number,stops:number[],viewport:number,layout:CardLayout):CardPose{
 const start=stops[index],entry=viewport*.48,orbit=viewport*.4,next=stops[index+1]??Infinity,begin=start-entry,base={x:0,y:0,z:0,rx:0,ry:0,rz:0,scale:1,opacity:1,phase:'pile'};
 if(scroll<stops[0]-entry)return base;
 if(scroll<begin)return {...base,opacity:index>0&&scroll<stops[0]?1-ease((scroll-(stops[0]-entry))/entry):0,phase:'inactive'};
 const entryT=ease((scroll-begin)/entry);
 if(scroll<start){
  const target=flightPose(0,layout),strength=layout.intensity??.55;
  return {...base,x:mix(layout.homeX,target.x,entryT)-layout.homeX,y:mix(layout.homeY,target.y,entryT)-layout.homeY-Math.sin(entryT*Math.PI)*8*strength,z:Math.sin(entryT*Math.PI)*8*strength,ry:Math.sin(entryT*Math.PI)*-2*strength,rz:-layout.angle*entryT,scale:mix(1,1.025,entryT),opacity:index===0?1:entryT,phase:'approach'};
 }
 const flight=flightPose((scroll-start)/orbit,layout),exit=ease((scroll-(next-entry))/entry);
 const pose={...base,...flight,x:flight.x-layout.homeX-exit*8,y:flight.y-layout.homeY-exit*4,z:flight.z-exit*8,rz:flight.rz-layout.angle,scale:1.025-exit*.01,opacity:1-exit};
 return {...pose,phase:exit>0?'exit':flight.phase};
}
