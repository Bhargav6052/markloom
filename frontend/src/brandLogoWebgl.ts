import * as THREE from 'three';
import {createMarkloomRibbon} from './brandRibbonGeometry';

const TAU=2*Math.PI;
export function mountBrandLogo(host:HTMLElement,interaction:HTMLElement,full:boolean,onReady:(value:boolean)=>void){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0x15131a,0);
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.1,35);camera.position.set(0,0,6.6);
 const group=new THREE.Group();scene.add(group);
 const geometry=createMarkloomRibbon();
 const material=new THREE.ShaderMaterial({
  transparent:true,depthWrite:true,side:THREE.FrontSide,
  vertexShader:`
   attribute vec3 ribbonProfile;
   varying vec3 vProfile;
   varying vec3 vNormal;
   varying vec3 vView;
   varying vec3 vLocal;
   void main(){
    vProfile=ribbonProfile;
    vLocal=position;
    vec4 mv=modelViewMatrix*vec4(position,1.0);
    vNormal=normalize(normalMatrix*normal);
    vView=-mv.xyz;
    gl_Position=projectionMatrix*mv;
   }`,
  fragmentShader:`
   varying vec3 vProfile;
   varying vec3 vNormal;
   varying vec3 vView;
   varying vec3 vLocal;
   float band(float x,float center,float width){float d=(x-center)/width;return exp(-d*d);}
   void main(){
    vec3 n=normalize(vNormal),eye=normalize(vView),reflected=reflect(-eye,n);
    float t=vProfile.x,u=abs(vProfile.y);
    float fresnel=pow(1.0-abs(dot(n,eye)),3.1);
    float edge=smoothstep(.83,.995,u);
    float strip=band(reflected.x,-.58,.16)*band(reflected.y,.35,.8);
    float sweep=band(reflected.y,.67,.17);
    float gold=clamp(.92*band(t,.02,.10)+.85*band(t,.29,.065)+.85*band(t,.51,.09)+.92*band(t,.98,.095),0.0,1.0);
    float violet=band(t,.72,.18)+.35*band(t,.38,.2);
    float stripe=band(sin(t*18.0+vProfile.y*1.6),.88,.28);
    vec3 body=mix(vec3(.15,.09,.23),vec3(.48,.24,.72),clamp(.24+sweep*.4+violet*.30+stripe*.12,0.0,1.0));
    body=mix(body,vec3(.81,.47,.18),gold*.58*(.4+strip*.6));
    vec3 rim=mix(vec3(.76,.48,1.0),vec3(1.0,.78,.42),gold);
    float shine=clamp(edge*.70+fresnel*.50+strip*.43,0.0,1.0);
    vec3 col=mix(body,rim,shine);
    col+=vec3(1.0,.87,.73)*pow(max(0.0,strip*edge+sweep*fresnel),2.0)*.55;
    float alpha=clamp(.52+edge*.38+fresnel*.27+strip*.15+gold*.08,.52,1.0);
    gl_FragColor=vec4(col,alpha);
   }`
 });
 const ribbon=new THREE.Mesh(geometry,material);group.add(ribbon);group.rotation.z=-.035;
 const pointer=new THREE.Vector2(),aim=new THREE.Vector2();
 let yaw=-.13,pitch=.08,raf=0,last=0,lastPointer=-Infinity,lastReport=0,visible=false,dead=false,lostContext=false,rendered=false;
 const speed=full?.35:.19;
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(w<1||h<1)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=w/h<1?7.4:6.6;camera.updateProjectionMatrix()};
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();
 const move=(event:PointerEvent)=>{if(event.pointerType==='touch')return;const r=interaction.getBoundingClientRect();if(!r.width||!r.height)return;pointer.set(THREE.MathUtils.clamp((event.clientX-r.left)/r.width*2-1,-1,1),THREE.MathUtils.clamp((event.clientY-r.top)/r.height*2-1,-1,1));lastPointer=performance.now()};
 const leave=()=>{lastPointer=-Infinity;pointer.set(0,0)};
 interaction.addEventListener('pointermove',move,{passive:true});interaction.addEventListener('pointerleave',leave);
 const lost=(event:Event)=>{event.preventDefault();lostContext=true;cancelAnimationFrame(raf);onReady(false)};
 renderer.domElement.addEventListener('webglcontextlost',lost);
 const tick=(time:number)=>{
  if(dead||lostContext||!visible||document.hidden)return;
  raf=requestAnimationFrame(tick);if(time-last<1000/30)return;
  const dt=Math.min(.1,Math.max(.001,(time-last)/1000));last=time;
  const active=time-lastPointer<700;
  const blend=1-Math.exp(-dt*5),amplitude=full?1:.66;
  if(active){
   const target=-.13+pointer.x*.94*amplitude;
   const delta=THREE.MathUtils.euclideanModulo(target-yaw+Math.PI,TAU)-Math.PI;
   yaw+=delta*blend;pitch+=(.12-pointer.y*.52*amplitude-pitch)*blend;aim.lerp(pointer,blend);
  }else{yaw+=speed*dt;pitch+=(.12-pitch)*blend;aim.multiplyScalar(1-blend)}
  group.rotation.set(pitch,yaw,-.035+aim.x*.09*amplitude);
  group.position.set(aim.x*.27*amplitude,-aim.y*.21*amplitude+Math.sin(time*.0012)*.055,0);
  if(time-lastReport>100){host.dataset.logoMotion=active?'cursor':'idle';host.dataset.logoYaw=yaw.toFixed(4);host.dataset.logoPitch=pitch.toFixed(4);lastReport=time}
  try{renderer.render(scene,camera);if(!rendered){rendered=true;onReady(true)}}catch{lostContext=true;cancelAnimationFrame(raf);onReady(false)}
 };
 const sync=()=>{cancelAnimationFrame(raf);if(visible&&!document.hidden&&!dead&&!lostContext){last=performance.now();raf=requestAnimationFrame(tick)}};
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;sync()});observer.observe(host);
 document.addEventListener('visibilitychange',sync);
 return()=>{dead=true;cancelAnimationFrame(raf);observer.disconnect();resizeObserver.disconnect();document.removeEventListener('visibilitychange',sync);interaction.removeEventListener('pointermove',move);interaction.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('webglcontextlost',lost);geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();delete host.dataset.logoMotion;delete host.dataset.logoYaw;delete host.dataset.logoPitch};
}
