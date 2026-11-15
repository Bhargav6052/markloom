import {useEffect,useRef} from 'react';
import {useMotionSettings} from './MotionSettings';
import {useLocation} from 'react-router-dom';
/** Enhance decorative route introductions only; functional text and forms remain fully opaque and stable. */
export default function RouteMotion(){
 const {effective}=useMotionSettings();const {pathname}=useLocation();const previous=useRef(pathname);
 useEffect(()=>{const changed=previous.current!==pathname;previous.current=pathname;const paused=effective==='reduced';document.documentElement.dataset.interfaceMotion=paused?'static':'enabled';if(paused)return;
 let disposed=false;let stop:(()=>void)|undefined;let observer:MutationObserver|undefined;const animations:Animation[]=[];
 const enter=()=>{const target=document.querySelector<HTMLElement>('.shell main .purpose-visual,.auth-context .purpose-visual,.site-page .purpose-visual,.not-found .purpose-visual');if(!target)return false;if(changed)animations.push(target.animate([{opacity:.8},{opacity:1}],{duration:260,easing:'cubic-bezier(.16,1,.3,1)'}));return true};
 if(!enter()){observer=new MutationObserver(()=>{if(enter())observer?.disconnect()});observer.observe(document.getElementById('root')!,{childList:true,subtree:true})}
 // Native touch scrolling remains immediate; smooth wheel movement is desktop-only.
 if(pathname!=='/'&&matchMedia('(min-width: 761px)').matches)void import('lenis').then(({default:Lenis})=>{if(disposed)return;const lenis=new Lenis({autoRaf:true,smoothWheel:true,syncTouch:false,anchors:true,lerp:.1,prevent:node=>!!node.closest('dialog,.table-wrap,textarea,select,[data-lenis-prevent]')});stop=()=>lenis.destroy()});
 return()=>{disposed=true;observer?.disconnect();stop?.();animations.forEach(a=>a.cancel())};
 },[pathname,effective]);return null;
}
