import {useRef,useEffect,type PointerEvent} from 'react';
import {flowImages} from './FlowNavigation';
import {useMotionSettings} from './MotionSettings';
type Stage='source'|'draft'|'decision';
/** Reuse the original approved visual concept; no generated replacement imagery. */
export default function HeritageArtwork({stage}:{stage?:Stage}){
 const root=useRef<HTMLDivElement>(null);const {effective}=useMotionSettings();
 function move(event:PointerEvent<HTMLDivElement>){if(effective==='reduced'||event.pointerType==='touch')return;const bounds=event.currentTarget.getBoundingClientRect(),limit=4;const x=Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1)),y=Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1));root.current?.style.setProperty('--art-x',`${-y*limit}deg`);root.current?.style.setProperty('--art-y',`${x*limit}deg`)}
 function reset(){root.current?.style.setProperty('--art-x','0deg');root.current?.style.setProperty('--art-y','0deg')}
 useEffect(()=>{const node=root.current;if(!node)return;const observer=new IntersectionObserver(([entry])=>node.dataset.active=String(entry.isIntersecting));observer.observe(node);const visibility=()=>node.dataset.foreground=String(!document.hidden);visibility();document.addEventListener('visibilitychange',visibility);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',visibility)}},[]);
 const selected=stage?flowImages.filter(image=>image.id===stage):flowImages;
 return <div ref={root} className={'heritage-art '+(stage?'heritage-single':'heritage-pile')} onPointerMove={move} onPointerLeave={reset}>
  <div className="heritage-art-halo" aria-hidden="true"/>
  <div className="heritage-art-depth">{selected.map((image,index)=>stage?<div key={image.id} className="heritage-image-frame"><img src={image.image} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" draggable={false}/><div className="heritage-image-label"><span>0{flowImages.indexOf(image)+1} / THE WORKFLOW</span><strong>{image.name}</strong></div></div>:<a key={image.id} className={'heritage-card heritage-card-'+index} href={'#'+image.id} aria-label={'Explore '+image.name+' information'}><img src={image.image} alt={image.alt} width={image.width} height={image.height} fetchPriority={index===0?'high':'auto'} decoding="async" draggable={false}/><span className="heritage-card-caption"><strong>{image.name}</strong></span></a>)}</div>
 </div>
}
