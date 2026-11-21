import {useEffect,type RefObject} from 'react';
import {useMotionSettings} from './MotionSettings';
import {journeyPose,journeyRange,type JourneyStop,type JourneyBox} from './journeyMotion';
/** One scroll-linked playhead carries the cards between their real layout positions. */
export function useSculptureJourney(root:RefObject<HTMLDivElement|null>){
 const {effective}=useMotionSettings();
 useEffect(()=>{if(effective==='reduced'||!root.current)return;let disposed=false,clean=()=>{};
 void Promise.all([import('gsap'),import('gsap/ScrollTrigger')]).then(([{gsap},{ScrollTrigger}])=>{
 if(disposed||!root.current)return;gsap.registerPlugin(ScrollTrigger);
 const node=root.current;
 const cards=Array.from(node.querySelectorAll<HTMLElement>('.heritage-pile .heritage-card'));
 const destinations=Array.from(node.querySelectorAll<HTMLElement>('.liquid-chapter .heritage-image-frame'));
 const flights=Array.from(node.querySelectorAll<HTMLElement>('.journey-flight-card'));
 if(cards.length!==3||destinations.length!==3||flights.length!==3)return;
 const playhead={scroll:window.scrollY};let stops:JourneyStop[]=[];
 const box=(element:HTMLElement):JourneyBox=>{const rect=element.getBoundingClientRect();return {x:rect.left,y:rect.top+window.scrollY,width:rect.width,height:rect.height}};
 const measure=()=>{const departed=node.classList.contains('journey-departed');node.classList.add('journey-departed');let previousEnd=0;stops=cards.map((card,index)=>{const chapter=destinations[index].closest<HTMLElement>('.liquid-chapter')!;const destination=box(destinations[index]);const origin=box(card);if(index>0){const prior=box(destinations[index-1]);origin.x=destination.x+(destination.width-origin.width)/2;origin.y=Math.max(prior.y+prior.height+90,destination.y-100);}const pile=index===0?card.closest<HTMLElement>('.reference-pile'):null;const departure=pile?box(pile).y+box(pile).height*.2:0;const range=journeyRange(box(chapter).y,innerHeight,previousEnd,departure);previousEnd=range.end;return {origin,destination,...range,direction:index%2===0?-1:1}});if(!departed)node.classList.remove('journey-departed')};
 const render=()=>{node.classList.toggle('journey-departed',playhead.scroll>(stops[0]?.start??0));stops.forEach((stop,index)=>{const pose=journeyPose(stop,playhead.scroll,window.scrollY,effective==='full'),flight=flights[index];flight.style.opacity=String(pose.opacity);flight.style.visibility=pose.opacity>0?'visible':'hidden';flight.style.width=pose.width+'px';flight.style.height=pose.height+'px';flight.style.transform=`translate3d(${pose.x}px,${pose.y}px,0) perspective(1400px) rotateY(${pose.tilt}deg) rotateZ(${pose.rotation}deg)`;cards[index].style.opacity=String(pose.originOpacity);destinations[index].style.opacity=String(pose.destinationOpacity);});};
 node.classList.add('journey-ready');measure();
 const context=gsap.context(()=>{gsap.fromTo(playhead,{scroll:0},{scroll:()=>Math.max(1,document.documentElement.scrollHeight-innerHeight),ease:'none',onUpdate:render,scrollTrigger:{trigger:document.documentElement,start:0,end:'max',scrub:1.2,invalidateOnRefresh:true,onRefreshInit:measure,onRefresh:render}})},node);
 // Native wheel, touch, anchors and keyboard scrolling all use the same trajectory.
 const update=()=>render();window.addEventListener('scroll',update,{passive:true});
 const observer=new ResizeObserver(()=>ScrollTrigger.refresh());observer.observe(node);
 clean=()=>{node.classList.remove('journey-ready','journey-departed');observer.disconnect();window.removeEventListener('scroll',update);context.revert();cards.forEach(card=>card.style.removeProperty('opacity'));destinations.forEach(card=>card.style.removeProperty('opacity'));flights.forEach(card=>card.removeAttribute('style'));};
 ScrollTrigger.refresh();render();
 }).catch(()=>{/* The original cards remain the complete static fallback. */});
 return()=>{disposed=true;clean()};
 },[root,effective]);
}
