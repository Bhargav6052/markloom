import {useEffect,type RefObject} from 'react';
import {useMotionSettings} from './MotionSettings';
/** Ghost headings are aria-hidden and positioned without moving readable content. */
export function useTypographyTrails(root:RefObject<HTMLDivElement|null>){const {effective}=useMotionSettings();
 useEffect(()=>{if(effective==='reduced'||!root.current)return;let disposed=false,cleanup=()=>{};
 void Promise.all([import('gsap'),import('gsap/ScrollTrigger')]).then(([{gsap},{ScrollTrigger}])=>{if(disposed||!root.current)return;gsap.registerPlugin(ScrollTrigger);const layers:HTMLElement[]=[],hosts=new Set<HTMLElement>();const observer=new ResizeObserver(()=>measure());const pairs:{heading:HTMLElement;ghost:HTMLElement}[]=[];
 const measure=()=>pairs.forEach(({heading,ghost})=>{ghost.textContent=heading.innerText||heading.getAttribute('aria-label')||'';const style=getComputedStyle(heading);Object.assign(ghost.style,{left:heading.offsetLeft+'px',top:heading.offsetTop+'px',width:heading.offsetWidth+'px',fontFamily:style.fontFamily,fontSize:style.fontSize,fontWeight:style.fontWeight,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing});});
 const context=gsap.context(()=>{root.current!.querySelectorAll<HTMLElement>('.liquid-hero h1,.liquid-chapter h2,.evidence-story h2,.trust-story h2,.liquid-finale h2').forEach(heading=>{const host=heading.parentElement!;host.classList.add('type-trail-host');hosts.add(host);for(let index=0;index<2;index++){const ghost=document.createElement('div');ghost.className='type-trail-layer';ghost.setAttribute('aria-hidden','true');ghost.textContent=heading.innerText||heading.getAttribute('aria-label')||'';host.append(ghost);layers.push(ghost);pairs.push({heading,ghost});gsap.fromTo(ghost,{x:0,y:0,opacity:0},{x:-(index+1)*9,y:-(index+1)*5,opacity:index?.025:.05,ease:'none',scrollTrigger:{trigger:heading,start:'top bottom',end:'bottom top',scrub:1.2}})}observer.observe(heading)});measure();},root);
 cleanup=()=>{observer.disconnect();context.revert();layers.forEach(layer=>layer.remove());hosts.forEach(host=>host.classList.remove('type-trail-host'))};
 }).catch(()=>{/* Readable headings are independent of the decorative trail. */});return()=>{disposed=true;cleanup()};
 },[root,effective]);
}
