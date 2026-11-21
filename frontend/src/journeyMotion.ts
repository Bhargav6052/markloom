export type JourneyBox={x:number;y:number;width:number;height:number};
export type JourneyStop={origin:JourneyBox;destination:JourneyBox;start:number;end:number;direction:number};
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
/** Document coordinates make the path reversible and independent of input velocity. */
export function journeyPose(stop:JourneyStop,scroll:number,viewportScroll:number,full=false){
 const progress=clamp((scroll-stop.start)/Math.max(1,stop.end-stop.start));
 const eased=progress*progress*(3-2*progress),arc=Math.sin(progress*Math.PI),strength=full?1:.65;
 const mix=(a:number,b:number)=>a+(b-a)*eased;
 return {progress,x:mix(stop.origin.x,stop.destination.x)+arc*stop.direction*36*strength,y:mix(stop.origin.y,stop.destination.y)-viewportScroll-arc*20*strength,width:mix(stop.origin.width,stop.destination.width),height:mix(stop.origin.height,stop.destination.height),rotation:Math.sin(progress*Math.PI*2)*stop.direction*4*strength,tilt:arc*stop.direction*4*strength,opacity:progress===0||progress===1?0:Math.min(1,progress/.08,(1-progress)/.08),originOpacity:1-clamp(progress/.08),destinationOpacity:progress===1?1:clamp((progress-.92)/.08)};
}
export function journeyRange(top:number,viewportHeight:number,previousEnd=0,departureMinimum=0){const start=Math.max(previousEnd+24,top-viewportHeight*.85,departureMinimum),end=Math.max(start+120,top-viewportHeight*.24);return {start,end}}
