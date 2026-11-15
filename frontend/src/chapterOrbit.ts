import {gsap} from 'gsap';

/** A decorative card makes one full turn, then becomes the chapter image. */
export function mountChapterOrbit(chapter:HTMLElement,desktop:boolean){
 const card=chapter.querySelector<HTMLElement>('.chapter-orbiter');const dock=chapter.querySelector<HTMLElement>('.chapter-visual');const image=dock?.querySelector('img');const copy=chapter.querySelector<HTMLElement>('.chapter-copy');if(!card||!dock||!image||!copy)return;
 const measure=()=>{const w=desktop?142:76,h=desktop?190:104;return {w,h,cx:copy.offsetLeft+copy.offsetWidth/2,cy:copy.offsetTop+copy.offsetHeight/2,rx:desktop?copy.offsetWidth/2+w/2+30:copy.offsetWidth*.38,ry:copy.offsetHeight/2+h/2+18,width:chapter.clientWidth,height:chapter.clientHeight,dx:dock.offsetLeft,dy:dock.offsetTop,dw:dock.offsetWidth,dh:dock.offsetHeight}};
 let layout=measure();const flight={angle:-Math.PI/2};const position=()=>{const a=flight.angle;gsap.set(card,{x:gsap.utils.clamp(12,layout.width-layout.w-12,layout.cx+Math.cos(a)*layout.rx-layout.w/2),y:gsap.utils.clamp(12,layout.height-layout.h-12,layout.cy+Math.sin(a)*layout.ry-layout.h/2),z:Math.sin(a)*55,rotationY:Math.cos(a)*28,rotationX:-Math.sin(a)*12,rotationZ:Math.cos(a)*9})};
 chapter.dataset.orbit='ready';gsap.set(card,{width:layout.w,height:layout.h,autoAlpha:0,transformPerspective:1400,force3D:true});position();gsap.set(image,{opacity:.25});
 const timeline=gsap.timeline({scrollTrigger:{id:'orbit-'+chapter.id,trigger:chapter,start:desktop?'top top':'top 80%',end:desktop?()=>'+='+Math.max(innerHeight*1.1,700):'bottom bottom',pin:desktop,pinSpacing:true,anticipatePin:1,scrub:.65,invalidateOnRefresh:true,onRefreshInit:()=>{layout=measure()},onUpdate:self=>{chapter.dataset.orbitState=self.progress>=.96?'settled':self.progress<=.10?'approach':'orbit';chapter.dataset.orbitProgress=self.progress.toFixed(3)}}});
 timeline.to(card,{autoAlpha:1,duration:.08},0).to(image,{opacity:.12,duration:.08},0)
 .to(flight,{angle:Math.PI*1.5,duration:.68,ease:'none',onUpdate:position},.08)
 .fromTo(card,{width:()=>layout.w,height:()=>layout.h},{x:()=>layout.dx,y:()=>layout.dy,z:0,width:()=>layout.dw,height:()=>layout.dh,rotationX:0,rotationY:0,rotationZ:0,duration:.19,ease:'power2.inOut'},.76)
 .to(image,{opacity:1,duration:.04},.95).to(card,{autoAlpha:0,duration:.04},.96).to({}, {duration:.04},1);
 return()=>{timeline.scrollTrigger?.kill();timeline.kill();delete chapter.dataset.orbit;delete chapter.dataset.orbitState;delete chapter.dataset.orbitProgress};
}
