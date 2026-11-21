import {useEffect,type RefObject} from 'react';
/** Pointer reflections are decorative; native click, keyboard and touch actions stay immediate. */
export function useGlassButtons(root:RefObject<HTMLDivElement|null>){useEffect(()=>{
 const node=root.current;if(!node)return;let pressed:HTMLElement|null=null;
 const targetFor=(event:PointerEvent)=>{const target=event.target instanceof Element?event.target.closest<HTMLElement>('.liquid-button'):null;return target&&!target.hasAttribute('disabled')&&target.getAttribute('aria-disabled')!=='true'?target:null};
 const move=(event:PointerEvent)=>{const target=targetFor(event);if(!target)return;const bounds=target.getBoundingClientRect();if(!bounds.width||!bounds.height)return;target.style.setProperty('--glass-x',`${Math.max(0,Math.min(100,(event.clientX-bounds.left)/bounds.width*100))}%`);target.style.setProperty('--glass-y',`${Math.max(0,Math.min(100,(event.clientY-bounds.top)/bounds.height*100))}%`)};
 const release=()=>{pressed?.removeAttribute('data-glass-pressed');pressed=null};
 const down=(event:PointerEvent)=>{release();move(event);pressed=targetFor(event);pressed?.setAttribute('data-glass-pressed','true')};
 node.addEventListener('pointermove',move,{passive:true});node.addEventListener('pointerdown',down,{passive:true});window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',release);
 return()=>{release();node.removeEventListener('pointermove',move);node.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('blur',release)};
 },[root])}
