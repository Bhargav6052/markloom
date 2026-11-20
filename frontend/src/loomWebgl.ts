import * as THREE from 'three';
import {loomBlend} from './loomModel';
import type {MutableRefObject} from 'react';
const TAU=Math.PI*2;
const SAMPLES=96;
const PARTS=46;
const v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);

function curve(stage:number){
 const points:THREE.Vector3[]=[];
 if(stage===3){
  // Closed, softened silhouette of a check mark with a thick sculptural edge.
  return new THREE.CatmullRomCurve3([
   v(-1.48,.12,0),v(-1.15,.40,.02),v(-.45,-.25,.06),v(.95,1.05,0),
   v(1.35,.79,-.02),v(-.41,-.99,-.03),v(-.70,-.97,0),
  ],true,'centripetal');
 }
 for(let i=0;i<SAMPLES;i++){
  const t=i/SAMPLES*TAU;
  if(stage===0){
   const r=1.03+.39*Math.cos(3*t);
   points.push(v(r*Math.cos(2*t),r*Math.sin(2*t),.48*Math.sin(3*t)));
  }else if(stage===1){
   const r=1.03+.20*Math.cos(t);
   points.push(v(r*Math.cos(3*t),.90*Math.sin(t),r*Math.sin(3*t)));
  }else{
   const r=1.12+.21*Math.cos(5*t);
   points.push(v(r*Math.cos(3*t),r*Math.sin(3*t),.78*Math.sin(5*t)));
  }
 }
 return new THREE.CatmullRomCurve3(points,true,'centripetal');
}
function fragment(stage:number,i:number){
 const t=i/PARTS*TAU;
 const phi=Math.acos(1-2*(i+.5)/PARTS),theta=i*2.39996323;
 if(stage===0)return v(1.78*Math.cos(t),1.74*Math.sin(t),.45*Math.sin(3*t));
 if(stage===1)return v((i%5-2)*.55,(Math.floor(i/5)%5-2)*.43,(Math.floor(i/25)-.5)*.72);
 if(stage===2)return v(1.63*Math.sin(phi)*Math.cos(theta),1.63*Math.cos(phi),1.63*Math.sin(phi)*Math.sin(theta));
 return v(1.77*Math.cos(t),1.77*Math.sin(t),.12*Math.sin(4*t));
}
function environment(){
 const width=256,height=128,bytes=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width,b=y/height;
  const soft=(cx:number,cy:number,sx:number,sy:number)=>Math.exp(-(((u-cx)/sx)**2+((b-cy)/sy)**2));
  const a=soft(.18,.30,.09,.24),c=soft(.73,.40,.07,.32),d=soft(.49,.72,.22,.06);
  const offset=(y*width+x)*4;
  bytes[offset]=Math.min(255,24+220*a+88*c+90*d);
  bytes[offset+1]=Math.min(255,27+230*a+110*c+50*d);
  bytes[offset+2]=Math.min(255,40+240*a+200*c+125*d);bytes[offset+3]=255;
 }
 const map=new THREE.DataTexture(bytes,width,height,THREE.RGBAFormat);
 map.mapping=THREE.EquirectangularReflectionMapping;map.colorSpace=THREE.SRGBColorSpace;map.needsUpdate=true;return map;
}
/** Owns one renderer; caller disposes when hidden/unmounted or motion preference changes. */
export function mountLoom(host:HTMLElement,progress:MutableRefObject<number>,full:boolean,onReady:(ready:boolean)=>void){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
 renderer.setClearColor(0x080d19,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
 renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(39,1,.1,50);camera.position.set(0,.12,6.8);
 const world=environment(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromEquirectangular(world);
 scene.environment=env.texture;scene.environmentIntensity=1.65;
 scene.add(new THREE.HemisphereLight(0xe0eeff,0x29334e,2.4));
 const key=new THREE.DirectionalLight(0xddeaff,3.3);key.position.set(-3,4,5);scene.add(key);
 const rim=new THREE.DirectionalLight(0xb7a2ff,3.7);rim.position.set(3,-1,-3);scene.add(rim);
 const group=new THREE.Group();scene.add(group);
 const tubes=[0,1,2,3].map(stage=>new THREE.TubeGeometry(curve(stage),144,stage===3?.13:.105,12,true));
 const geometry=tubes[0];
 geometry.morphAttributes.position=tubes.slice(1).map(g=>g.attributes.position.clone());
 geometry.morphAttributes.normal=tubes.slice(1).map(g=>g.attributes.normal.clone());
 // The base geometry bounds do not cover every morph: do not frustum-cull the sculpture.
 const material=new THREE.MeshPhysicalMaterial({
  color:0xb4c4f5,metalness:.26,roughness:.18,clearcoat:1,clearcoatRoughness:.09,
  transmission:.27,thickness:.30,ior:1.43,iridescence:.35,iridescenceIOR:1.3,envMapIntensity:1.5
 });
 const sculpture=new THREE.Mesh(geometry,material);sculpture.frustumCulled=false;group.add(sculpture);
 const fragmentGeo=new THREE.OctahedronGeometry(1,0);
 const fragmentMat=new THREE.MeshPhysicalMaterial({color:0xb7c8ff,metalness:.38,roughness:.22,clearcoat:1,envMapIntensity:1.5});
 const fragments=new THREE.InstancedMesh(fragmentGeo,fragmentMat,PARTS);fragments.frustumCulled=false;group.add(fragments);
 const targets=Array.from({length:4},(_,stage)=>Array.from({length:PARTS},(_,i)=>fragment(stage,i)));
 const dummy=new THREE.Object3D(),position=new THREE.Vector3(),pointer=new THREE.Vector2(),look=new THREE.Vector2();
 let raf=0,visible=true,dead=false,contextLost=false,last=0,current=progress.current,didRender=false;
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=w/h<1?7.8:6.8;camera.updateProjectionMatrix()};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const mouse=(e:PointerEvent)=>{const rect=host.getBoundingClientRect();pointer.set(Math.max(-1,Math.min(1,(e.clientX-rect.left)/rect.width*2-1)),Math.max(-1,Math.min(1,(e.clientY-rect.top)/rect.height*2-1)))};
 const reset=()=>pointer.set(0,0);
 host.addEventListener('pointermove',mouse);host.addEventListener('pointerleave',reset);
 const lost=(e:Event)=>{e.preventDefault();contextLost=true;cancelAnimationFrame(raf);onReady(false)};
 renderer.domElement.addEventListener('webglcontextlost',lost);
 const frame=(time:number)=>{
  if(dead||contextLost||!visible||document.hidden)return;
  raf=requestAnimationFrame(frame);
  if(time-last<1000/30)return;
  const dt=Math.min(.1,Math.max(.001,(time-last)/1000));last=time;
  current+=(progress.current-current)*(1-Math.exp(-dt*7));
  const {from,to,mix}=loomBlend(current);
  const weights=[0,0,0,0];weights[from]=1-mix;weights[to]=mix;
  const morph=sculpture.morphTargetInfluences!;
  for(let i=0;i<3;i++)morph[i]=weights[i+1];
  const slow=full?Math.sin(time*.00045)*.20:0;
  look.lerp(pointer,1-Math.exp(-dt*3));
  group.rotation.set(.10-look.y*.10*(full?1:.55),slow+look.x*.18*(full?1:.55)+(1-weights[3])*.22,current*.035);
  for(let i=0;i<PARTS;i++){
   position.copy(targets[from][i]).lerp(targets[to][i],mix);
   dummy.position.copy(position);
   const size=(.043+(i%5)*.012)*(1+.25*weights[2]);
   dummy.scale.set(size,size*(1+(i%3)*.45),size);
   dummy.rotation.set(i*.61,current*.32+i*.27,i*.37);
   dummy.updateMatrix();fragments.setMatrixAt(i,dummy.matrix);
  }
  fragments.instanceMatrix.needsUpdate=true;
  try{renderer.render(scene,camera);if(!didRender){didRender=true;onReady(true)}}catch{contextLost=true;cancelAnimationFrame(raf);onReady(false)}
 };
 const sync=()=>{cancelAnimationFrame(raf);if(visible&&!document.hidden&&!dead&&!contextLost){last=performance.now();raf=requestAnimationFrame(frame)}};
 const view=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;sync()},{rootMargin:'80px'});view.observe(host);
 document.addEventListener('visibilitychange',sync);sync();
 return()=>{dead=true;cancelAnimationFrame(raf);view.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',sync);host.removeEventListener('pointermove',mouse);host.removeEventListener('pointerleave',reset);renderer.domElement.removeEventListener('webglcontextlost',lost);tubes.forEach(g=>g.dispose());fragmentGeo.dispose();fragmentMat.dispose();material.dispose();world.dispose();env.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove()};
}
