import * as THREE from 'three';
import {createMarkloomRibbon} from './saturnRibbonGeometry';

const TAU=Math.PI*2;
function studio(){
 const w=128,h=64,d=new Uint16Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/h,g=(cx:number,cy:number,a:number,b:number)=>Math.exp(-(((u-cx)/a)**2+((v-cy)/b)**2));
  const p=g(.66,.40,.095,.33),gold=g(.28,.57,.12,.05),white=g(.09,.32,.035,.24);
  const k=(y*w+x)*4;
  d[k]=THREE.DataUtils.toHalfFloat(.04+2.6*p+5.5*gold+5*white);
  d[k+1]=THREE.DataUtils.toHalfFloat(.03+1.5*p+3.4*gold+4.8*white);
  d[k+2]=THREE.DataUtils.toHalfFloat(.07+4.3*p+1.1*gold+5.0*white);
  d[k+3]=THREE.DataUtils.toHalfFloat(1);
 }
 const map=new THREE.DataTexture(d,w,h,THREE.RGBAFormat,THREE.HalfFloatType);
 map.mapping=THREE.EquirectangularReflectionMapping;
 map.colorSpace=THREE.LinearSRGBColorSpace;map.needsUpdate=true;
 return map;
}
export function mountSaturnScene(host:HTMLElement,interaction:HTMLElement,full:boolean,onReady:(ready:boolean)=>void){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
 renderer.setClearColor(0x130d20,0);
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.08;
 renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(40,1,.1,50);camera.position.set(0,.05,7.5);
 const map=studio(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromEquirectangular(map);
 scene.environment=env.texture;scene.environmentIntensity=1.75;
 scene.add(new THREE.HemisphereLight(0xc9a9ff,0x45255d,1.1));
 const purple=new THREE.DirectionalLight(0xc899ff,2.4);purple.position.set(4,3,4);scene.add(purple);
 const gold=new THREE.DirectionalLight(0xf5cb89,2.1);gold.position.set(-3,-1,5);scene.add(gold);
 const main=new THREE.Group();scene.add(main);
 const mGeometry=createMarkloomRibbon();
 const mMaterial=new THREE.MeshPhysicalMaterial({color:0xcba2e9,metalness:.04,roughness:.085,transmission:.82,thickness:.55,ior:1.45,clearcoat:1,clearcoatRoughness:.07,iridescence:.55,iridescenceIOR:1.42,envMapIntensity:1.8,side:THREE.DoubleSide});
 const m=new THREE.Mesh(mGeometry,mMaterial);main.add(m);
 // A true three-dimensional ring (not a flat CSS ellipse): its depth test naturally
 // determines which arc is in front of the M and which arc passes behind it.
 const orbit=new THREE.Group();main.add(orbit);
 const curvePoints=Array.from({length:129},(_,i)=>{
  const t=i/128*TAU;return new THREE.Vector3(2.02*Math.cos(t),.97*Math.sin(t),.79*Math.sin(t));
 });
 const path=new THREE.CatmullRomCurve3(curvePoints,true,'centripetal');
 const ringGeo=new THREE.TubeGeometry(path,256,.057,10,true);
 const ringMat=new THREE.MeshPhysicalMaterial({color:0xf0c68b,metalness:.32,roughness:.16,clearcoat:1,transmission:.22,thickness:.25,emissive:0x6e3d10,emissiveIntensity:.19,envMapIntensity:1.6});
 const ring=new THREE.Mesh(ringGeo,ringMat);orbit.add(ring);
 const haloGeo=new THREE.TubeGeometry(path,256,.019,6,true);
 const haloMat=new THREE.MeshBasicMaterial({color:0xc08cff,transparent:true,opacity:.68,depthWrite:false});
 const halo=new THREE.Mesh(haloGeo,haloMat);orbit.add(halo);halo.rotation.x=.065;
 const dotsGeo=new THREE.SphereGeometry(.026,8,8);
 const dotsMat=new THREE.MeshBasicMaterial({color:0xe9b979});
 const dots=new THREE.InstancedMesh(dotsGeo,dotsMat,54),dummy=new THREE.Object3D();
 for(let i=0;i<54;i++){const t=i/54*TAU;dummy.position.set(2.13*Math.cos(t),1.03*Math.sin(t),.84*Math.sin(t));dummy.scale.setScalar(i%6===0?1.9:.9);dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix)}
 dots.instanceMatrix.needsUpdate=true;orbit.add(dots);
 const pointer=new THREE.Vector2(),smoothPointer=new THREE.Vector2();
 let lastPointer=-Infinity,yaw=-.22,pitch=.1,rendered=false,dead=false,contextLost=false,visible=false,last=0,raf=0;
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=w/h<1?8.1:7.5;camera.updateProjectionMatrix()};
 const resizer=new ResizeObserver(resize);resizer.observe(host);resize();
 const move=(e:PointerEvent)=>{if(e.pointerType==='touch')return;const b=interaction.getBoundingClientRect();if(!b.width||!b.height)return;pointer.set(THREE.MathUtils.clamp((e.clientX-b.left)/b.width*2-1,-1,1),THREE.MathUtils.clamp((e.clientY-b.top)/b.height*2-1,-1,1));lastPointer=performance.now()};
 const leave=()=>{pointer.set(0,0);lastPointer=-Infinity};
 interaction.addEventListener('pointermove',move,{passive:true});interaction.addEventListener('pointerleave',leave);
 const lost=(e:Event)=>{e.preventDefault();contextLost=true;cancelAnimationFrame(raf);onReady(false)};
 renderer.domElement.addEventListener('webglcontextlost',lost);
 const tick=(time:number)=>{
  if(dead||contextLost||!visible||document.hidden)return;
  raf=requestAnimationFrame(tick);if(time-last<1000/30)return;
  const dt=Math.min(.09,Math.max(.001,(time-last)/1000));last=time;
  const blend=1-Math.exp(-dt*4.7),active=time-lastPointer<700;
  if(active){
   const target=-.22+pointer.x*(full?1:.68);
   const delta=THREE.MathUtils.euclideanModulo(target-yaw+Math.PI,TAU)-Math.PI;
   yaw+=delta*blend;pitch+=((.1-pointer.y*.4)-pitch)*blend;
  }else{yaw+=(full?.31:.19)*dt;pitch+=(.1-pitch)*blend}
  smoothPointer.lerp(active?pointer:new THREE.Vector2(0,0),blend);
  main.rotation.set(pitch,yaw,-.05+smoothPointer.x*.055);
  main.position.set(smoothPointer.x*.16,-smoothPointer.y*.10+Math.sin(time*.00085)*.045,0);
  orbit.rotation.z=.2+time*.00007;
  orbit.rotation.y=.04+Math.sin(time*.0002)*.04;
  host.dataset.logoMotion=active?'cursor':'idle';host.dataset.logoYaw=yaw.toFixed(3);
  try{renderer.render(scene,camera);if(!rendered){rendered=true;onReady(true)}}catch{contextLost=true;onReady(false);cancelAnimationFrame(raf)}
 };
 const sync=()=>{cancelAnimationFrame(raf);if(!dead&&!contextLost&&visible&&!document.hidden){last=performance.now();raf=requestAnimationFrame(tick)}};
 const observer=new IntersectionObserver(items=>{visible=items[0]?.isIntersecting??false;sync()},{rootMargin:'60px'});observer.observe(host);
 document.addEventListener('visibilitychange',sync);
 return()=>{dead=true;cancelAnimationFrame(raf);observer.disconnect();resizer.disconnect();document.removeEventListener('visibilitychange',sync);interaction.removeEventListener('pointermove',move);interaction.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('webglcontextlost',lost);mGeometry.dispose();mMaterial.dispose();ringGeo.dispose();ringMat.dispose();haloGeo.dispose();haloMat.dispose();dotsGeo.dispose();dotsMat.dispose();map.dispose();env.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove()};
}
