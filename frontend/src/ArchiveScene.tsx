import {useEffect,useRef,useState,type RefObject} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {RoundedBox,useTexture} from '@react-three/drei';
import {MathUtils,PMREMGenerator,SRGBColorSpace,type Group} from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import type {CursorMotion} from './cursorMotion';

function Studio(){const {gl,scene}=useThree();useEffect(()=>{const generator=new PMREMGenerator(gl),room=new RoomEnvironment(),environment=generator.fromScene(room,.04,.1,30,{size:128});const previous=scene.environment;scene.environment=environment.texture;scene.environmentIntensity=1.2;room.dispose();generator.dispose();return()=>{scene.environment=previous;environment.dispose()}},[gl,scene]);return <><ambientLight intensity={.65}/><directionalLight position={[-3,4,5]} intensity={4} color="#f0e7ff"/><pointLight position={[3,1,2]} intensity={18} color="#a777ff"/></>}
function Archive({image,cursor}:{image:string;cursor:RefObject<CursorMotion>}){
 const group=useRef<Group>(null),reveal=useRef(0);const texture=useTexture(image);const artwork=texture.image as HTMLImageElement;const aspect=artwork.width/artwork.height;
 // useTexture owns the shared texture; keep cached assets alive between selections.
 useEffect(()=>{texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true},[texture]);
 useEffect(()=>{reveal.current=0},[image]);
 useFrame((state,delta)=>{if(!group.current)return;const c=cursor.current,dt=Math.min(delta,.05),t=state.clock.elapsedTime,rate=5+Math.min(c.speed,8)*1.2;reveal.current=MathUtils.damp(reveal.current,1,5,dt);group.current.scale.setScalar(.95+reveal.current*.05);group.current.rotation.y=MathUtils.damp(group.current.rotation.y,-.24+c.x*.18+(1-reveal.current)*.2,rate,dt);group.current.rotation.x=MathUtils.damp(group.current.rotation.x,.07-c.y*.12,rate,dt);group.current.rotation.z=MathUtils.damp(group.current.rotation.z,-.025+Math.sin(t*.24)*.016,rate,dt);group.current.position.y=MathUtils.damp(group.current.position.y,Math.sin(t*.65)*.045+c.y*.035,rate,dt)});
 const chrome=<meshStandardMaterial color="#d7cce8" metalness={.94} roughness={.2}/>;
 return <group ref={group} rotation={[.07,-.24,-.025]}>
  <RoundedBox args={[2.04,2.68,.16]} radius={.19} smoothness={4} position={[0,0,-.22]}>{chrome}</RoundedBox>
  <RoundedBox args={[1.84,2.46,.09]} radius={.14} smoothness={4} position={[0,0,-.11]}><meshPhysicalMaterial color="#21132d" metalness={.55} roughness={.22} clearcoat={1}/></RoundedBox>
  {[2,1,0].map(i=><RoundedBox key={i} args={[1.42,1.94,.09]} radius={.11} smoothness={3} position={[i*.095-.08,i*.11-.08,.02-i*.12]}><meshPhysicalMaterial color={['#5b3b7a','#8862aa','#b38bd1'][i]} metalness={.4} roughness={.24} clearcoat={1}/></RoundedBox>)}
  <mesh position={[-.08,.14,.072]}><planeGeometry args={[1.30,1.30/aspect]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>
  {[0,1].map(i=><mesh key={i} position={[-.08,-.62-i*.11,.075]}><boxGeometry args={[i===0?.90:.62,.012,.009]}/><meshStandardMaterial color="#d5b9ef" emissive="#a581d1" emissiveIntensity={.15}/></mesh>)}
 </group>
}
export default function ArchiveScene({image,cursor}:{image:string;cursor:RefObject<CursorMotion>}){
 const host=useRef<HTMLDivElement>(null);const [active,setActive]=useState(!document.hidden);
 useEffect(()=>{let inView=true;const update=()=>setActive(inView&&!document.hidden);const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;update()},{rootMargin:'80px'});if(host.current)observer.observe(host.current);document.addEventListener('visibilitychange',update);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',update)}},[]);
 return <div ref={host} className="archive-canvas" data-rendering={active?'active':'paused'}><Canvas aria-hidden="true" dpr={[1,1.35]} camera={{position:[0,0,5.1],fov:38}} frameloop={active?'always':'never'} gl={{alpha:true,antialias:true,powerPreference:'low-power'}}><Studio/><Archive image={image} cursor={cursor}/></Canvas></div>
}
