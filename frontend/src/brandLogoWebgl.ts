import * as THREE from 'three';

const TAU=2*Math.PI;
function rounded(path:THREE.Path,w:number,h:number,r:number){
 const x=-w/2,y=-h/2;
 path.moveTo(x+r,y);path.lineTo(x+w-r,y);path.quadraticCurveTo(x+w,y,x+w,y+r);
 path.lineTo(x+w,y+h-r);path.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 path.lineTo(x+r,y+h);path.quadraticCurveTo(x,y+h,x,y+h-r);
 path.lineTo(x,y+r);path.quadraticCurveTo(x,y,x+r,y);path.closePath();
}
function frameGeometry(){
 const shape=new THREE.Shape();rounded(shape,1.65,2.20,.28);
 const hole=new THREE.Path();rounded(hole,1.19,1.74,.14);shape.holes.push(hole);
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:true,bevelThickness:.075,bevelSize:.067,bevelSegments:5,curveSegments:20,steps:1});
 geometry.translate(0,0,-.075);geometry.computeVertexNormals();return geometry;
}
function studioMap(){
 const w=256,h=128,data=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/h,soft=(a:number,b:number,sx:number,sy:number)=>Math.exp(-(((u-a)/sx)**2+((v-b)/sy)**2));
  const silver=soft(.18,.30,.055,.24),violet=soft(.69,.41,.095,.35),gold=soft(.43,.66,.14,.045),strip=soft(.87,.21,.03,.22);
  const i=(y*w+x)*4;
  data[i]=Math.min(255,22+230*silver+118*violet+226*gold+160*strip);
  data[i+1]=Math.min(255,20+225*silver+87*violet+159*gold+146*strip);
  data[i+2]=Math.min(255,25+235*silver+170*violet+70*gold+200*strip);data[i+3]=255;
 }
 const texture=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;return texture;
}
export function mountBrandLogo(host:HTMLElement,interaction:HTMLElement,full:boolean,onReady:(value:boolean)=>void){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0x15131a,0);
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.4;
 renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.1,35);camera.position.set(0,0,6.6);
 const map=studioMap(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromEquirectangular(map);
 scene.environment=env.texture;scene.environmentIntensity=2.1;
 scene.add(new THREE.HemisphereLight(0xf3e6ff,0x34283e,2.3));
 const key=new THREE.DirectionalLight(0xfff0de,3.7);key.position.set(-4,4,4);scene.add(key);
 const violet=new THREE.DirectionalLight(0xc4a0ee,3.1);violet.position.set(3,1,-3);scene.add(violet);
 const warm=new THREE.DirectionalLight(0xeecb89,2.8);warm.position.set(-2,-3,1);scene.add(warm);
 const group=new THREE.Group();scene.add(group);
 const geometry=frameGeometry();
 const material=new THREE.MeshPhysicalMaterial({color:0xd6bce9,metalness:.15,roughness:.13,transmission:.59,thickness:.43,ior:1.46,clearcoat:1,clearcoatRoughness:.07,iridescence:.48,iridescenceIOR:1.36,envMapIntensity:2.4});
 const back=new THREE.Mesh(geometry,material),front=new THREE.Mesh(geometry,material);
 back.position.set(-.40,.26,-.24);front.position.set(.40,-.25,.24);group.add(back,front);group.rotation.z=.22;
 const pointer=new THREE.Vector2(),aim=new THREE.Vector2();
 let yaw=.36,pitch=.12,raf=0,last=0,lastPointer=-Infinity,lastReport=0,visible=false,dead=false,lostContext=false,rendered=false;
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
   const target=.36+pointer.x*.94*amplitude;
   const delta=THREE.MathUtils.euclideanModulo(target-yaw+Math.PI,TAU)-Math.PI;
   yaw+=delta*blend;pitch+=(.12-pointer.y*.52*amplitude-pitch)*blend;aim.lerp(pointer,blend);
  }else{yaw+=speed*dt;pitch+=(.12-pitch)*blend;aim.multiplyScalar(1-blend)}
  group.rotation.set(pitch,yaw,.22+aim.x*.09*amplitude);
  group.position.set(aim.x*.27*amplitude,-aim.y*.21*amplitude+Math.sin(time*.0012)*.055,0);
  if(time-lastReport>100){host.dataset.logoMotion=active?'cursor':'idle';host.dataset.logoYaw=yaw.toFixed(4);host.dataset.logoPitch=pitch.toFixed(4);lastReport=time}
  try{renderer.render(scene,camera);if(!rendered){rendered=true;onReady(true)}}catch{lostContext=true;cancelAnimationFrame(raf);onReady(false)}
 };
 const sync=()=>{cancelAnimationFrame(raf);if(visible&&!document.hidden&&!dead&&!lostContext){last=performance.now();raf=requestAnimationFrame(tick)}};
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;sync()});observer.observe(host);
 document.addEventListener('visibilitychange',sync);
 return()=>{dead=true;cancelAnimationFrame(raf);observer.disconnect();resizeObserver.disconnect();document.removeEventListener('visibilitychange',sync);interaction.removeEventListener('pointermove',move);interaction.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('webglcontextlost',lost);geometry.dispose();material.dispose();map.dispose();env.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();delete host.dataset.logoMotion;delete host.dataset.logoYaw;delete host.dataset.logoPitch};
}
