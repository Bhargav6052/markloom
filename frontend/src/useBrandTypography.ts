import {useEffect,type RefObject} from 'react';
import {useMotionSettings} from './MotionSettings';
/** Accessible characters for the hero, words for chapters; restore the original DOM on cleanup. */
export function useBrandTypography(root:RefObject<HTMLDivElement|null>){const {effective}=useMotionSettings();
 useEffect(()=>{if(effective==='reduced'||!root.current)return;let disposed=false,cleanup=()=>{};
 void Promise.all([import('gsap'),import('gsap/SplitText'),import('gsap/ScrollTrigger')]).then(([{gsap},{SplitText},{ScrollTrigger}])=>{if(disposed||!root.current)return;gsap.registerPlugin(SplitText,ScrollTrigger);
 const splits:ReturnType<typeof SplitText.create>[]=[];let context:ReturnType<typeof gsap.context>|undefined;
 const start=()=>{if(disposed||context||!root.current)return;context=gsap.context(()=>{root.current!.querySelectorAll<HTMLElement>('.liquid-hero h1,.liquid-chapter h2,.liquid-finale h2').forEach(heading=>{const hero=heading.id==='liquid-title';let played=false;
 const split=SplitText.create(heading,{type:hero?'words,chars':'words',aria:'auto',autoSplit:true,onSplit(self){if(played)return;return gsap.from(hero?self.chars:self.words,{y:hero?14:8,opacity:0,duration:hero?.7:.6,stagger:hero?.018:.05,ease:'power2.out',onStart:()=>{played=true},scrollTrigger:{trigger:heading,start:'top 94%',once:true}})}});splits.push(split);
 });},root);ScrollTrigger.refresh();};
 if(document.querySelector('.brand-arrival'))window.addEventListener('markloom:opening-complete',start,{once:true});else start();
 cleanup=()=>{window.removeEventListener('markloom:opening-complete',start);context?.revert();splits.forEach(split=>split.revert())};
 }).catch(()=>{/* Unsplit text remains the fallback. */});
 return()=>{disposed=true;cleanup()};
 },[root,effective]);
}
