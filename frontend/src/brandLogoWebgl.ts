import * as THREE from 'three';
import {createMarkloomRibbon} from './brandRibbonGeometry';

const TAU=2*Math.PI;
function studioMap(){
 const width=256,height=128,data=new Uint16Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width,v=y/height,soft=(a:number,b:number,sx:number,sy:number)=>Math.exp(-(((u-a)/sx)**2+((v-b)/sy)**2));
  const white=soft(.18,.30,.026,.23),purple=soft(.69,.41,.065,.31),gold=soft(.43,.66,.13,.024),strip=soft(.87,.21,.014,.20);
  const i=(y*width+x)*4;
  data[i]=THREE.DataUtils.toHalfFloat(.035+5.2*white+1.5*purple+5.8*gold+3.9*strip);
  data[i+1]=THREE.DataUtils.toHalfFloat(.024+4.8*white+.72*purple+3.6*gold+3.0*strip);
  data[i+2]=THREE.DataUtils.toHalfFloat(.052+5.5*white+3.9*purple+1.15*gold+5.4*strip);
  data[i+3]=THREE.DataUtils.toHalfFloat(1);
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.HalfFloatType);texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.LinearSRGBColorSpace;texture.needsUpdate=true;return texture;
}
export function mountBrandLogo(host:HTMLElement,interaction:HTMLElement,full:boolean,onReady:(value:boolean)=>void){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0x15131a,0);
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.1,35);camera.position.set(0,0,6.6);
 const map=studioMap(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromEquirectangular(map);
 scene.environment=env.texture;scene.environmentIntensity=1.35;
 scene.add(new THREE.HemisphereLight(0xf3e6ff,0x34283e,.32));
 const key=new THREE.DirectionalLight(0xfff0de,.9);key.position.set(-4,4,4);scene.add(key);
 const violet=new THREE.DirectionalLight(0xc4a0ee,1.45);violet.position.set(3,1,-3);scene.add(violet);
 const warm=new THREE.DirectionalLight(0xeecb89,1.05);warm.position.set(-2,-3,1);scene.add(warm);
 const group=new THREE.Group();scene.add(group);
 const geometry=createMarkloomRibbon();
 const material=new THREE.MeshPhysicalMaterial({color:0xdac5eb,metalness:.04,roughness:.095,transmission:.84,thickness:.44,ior:1.48,clearcoat:1,clearcoatRoughness:.045,iridescence:.55,iridescenceIOR:1.40,envMapIntensity:1.65,specularIntensity:1});
 const ribbon=new THREE.Mesh(geometry,material);group.add(ribbon);
 const highlight=new THREE.MeshPhysicalMaterial({color:0xcbb1e6,metalness:.56,roughness:.18,transparent:true,opacity:.14,depthWrite:false,clearcoat:1,envMapIntensity:1.5});
 const glint=new THREE.Mesh(geometry,highlight);glint.scale.setScalar(1.003);group.add(glint);group.rotation.z=-.035;
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
 return()=>{dead=true;cancelAnimationFrame(raf);observer.disconnect();resizeObserver.disconnect();document.removeEventListener('visibilitychange',sync);interaction.removeEventListener('pointermove',move);interaction.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('webglcontextlost',lost);geometry.dispose();material.dispose();highlight.dispose();map.dispose();env.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();delete host.dataset.logoMotion;delete host.dataset.logoYaw;delete host.dataset.logoPitch};
}
