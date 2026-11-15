import Lenis from 'lenis';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {mountPileStory} from './pileStory';
import type {SceneMotion} from './sceneState';
gsap.registerPlugin(ScrollTrigger);

export function mountCinematicMotion(root:HTMLElement,motion:SceneMotion,desktop=true){
 const lenis=desktop?new Lenis({autoRaf:false,smoothWheel:true,syncTouch:false,anchors:true,lerp:.085,prevent:node=>!!node.closest('dialog,.consent-banner,[data-lenis-prevent]')}):null;
 const tick=(seconds:number)=>lenis?.raf(seconds*1000);
 const update=()=>ScrollTrigger.update();
 lenis?.on('scroll',update);gsap.ticker.add(tick);
 let journey:ReturnType<typeof mountPileStory>;
 const context=gsap.context(()=>{
  gsap.from('.hero-line>span',{opacity:1,duration:1.25,stagger:.13,ease:'power3.out',clearProps:'transform'});
  gsap.from('.hero-subcopy,.hero-actions,.hero-footnote',{opacity:1,duration:1.2,stagger:.1,ease:'power3.out',clearProps:'transform'});
  journey=mountPileStory(root);
  for(const section of root.querySelectorAll<HTMLElement>('[data-reveal]')){
   gsap.from(section,{opacity:1,duration:1.1,ease:'power3.out',clearProps:'transform',scrollTrigger:{trigger:section,start:'top 90%',once:true}});
  }

  gsap.to('.statement-image',{yPercent:1.5,scale:1.01,ease:'none',scrollTrigger:{trigger:'.statement-section',start:'top bottom',end:'bottom top',scrub:1.1}});

  gsap.to('.statement-glow',{xPercent:3,ease:'none',scrollTrigger:{trigger:'.statement-section',start:'top bottom',end:'bottom top',scrub:1.4}});
 },root);
 const visibility=()=>{if(document.hidden){lenis?.stop();gsap.ticker.remove(tick)}else{lenis?.start();gsap.ticker.add(tick);ScrollTrigger.refresh()}};
 document.addEventListener('visibilitychange',visibility);
 if(document.hidden)visibility();
 const ids=['source','draft','decision'];
 const go=(id:string)=>{const target=root.querySelector<HTMLElement>('#'+id);if(!target)return;ScrollTrigger.refresh();lenis?.resize();const top=target.getBoundingClientRect().top+scrollY,dock=journey?.arrivalScroll(id)??top;if(lenis)lenis.scrollTo(top,{duration:.9,easing:t=>1-Math.pow(1-t,3),onComplete:()=>lenis.scrollTo(dock,{duration:1.1,easing:t=>t*t*(3-2*t)})});else window.scrollTo({top:dock,behavior:'smooth'})};
 const chapterClick=(event:MouseEvent)=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.defaultPrevented||!(event.target instanceof Element))return;const hash=event.target.closest<HTMLAnchorElement>('a[href]')?.getAttribute('href');if(!hash||!ids.includes(hash.slice(1)))return;event.preventDefault();event.stopPropagation();if(location.hash!==hash)history.pushState(history.state,'',location.pathname+location.search+hash);window.dispatchEvent(new PopStateEvent('popstate'))};root.addEventListener('click',chapterClick,true);
 const historyChange=()=>{const id=location.hash.slice(1);if(ids.includes(id))go(id);else if(id==='main-content')lenis?.scrollTo(0,{duration:1.35})};window.addEventListener('popstate',historyChange);window.addEventListener('hashchange',historyChange);
 const refreshLayout=()=>ScrollTrigger.refresh();root.addEventListener('inkloom:layout',refreshLayout);
 const requestedScroll=(event:Event)=>{const request=event as CustomEvent<{id:string}>;const target=root.querySelector<HTMLElement>('#'+CSS.escape(request.detail.id));if(!target)return;if(ids.includes(request.detail.id)){event.preventDefault();go(request.detail.id);return}if(!lenis)return;event.preventDefault();lenis.scrollTo(request.detail.id==='main-content'?0:target,{duration:1.35,easing:t=>1-Math.pow(1-t,4)})};root.addEventListener('inkloom:scroll',requestedScroll);
 const refresh=requestAnimationFrame(()=>{ScrollTrigger.refresh();if(ids.includes(location.hash.slice(1)))go(location.hash.slice(1))});
 return()=>{window.removeEventListener('popstate',historyChange);window.removeEventListener('hashchange',historyChange);root.querySelectorAll<HTMLElement>('.pile-card').forEach(card=>{card.inert=false;card.removeAttribute('aria-hidden')});root.removeEventListener('click',chapterClick,true);root.removeEventListener('inkloom:layout',refreshLayout);root.removeEventListener('inkloom:scroll',requestedScroll);cancelAnimationFrame(refresh);document.removeEventListener('visibilitychange',visibility);gsap.ticker.remove(tick);lenis?.off('scroll',update);lenis?.destroy();context.revert();root.querySelectorAll<HTMLElement>('.pile-navigation').forEach(nav=>{delete nav.dataset.storyPosition;delete nav.dataset.activeStage});motion.progress=0};
}
