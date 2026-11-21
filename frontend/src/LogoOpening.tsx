import {useEffect,useRef,useState} from 'react';
import {useMotionSettings} from './MotionSettings';
/** Flip owns the planar landing; the supplied logo artwork retains its exact material identity. */
export default function LogoOpening(){
 const {effective}=useMotionSettings();const logo=useRef<HTMLDivElement>(null);
 const [show,setShow]=useState(()=>{try{return effective!=='reduced'&&!sessionStorage.getItem('markloom_ribbon_opening_seen')&&!location.hash}catch{return false}});
 const finish=()=>{setShow(false);window.dispatchEvent(new Event('markloom:opening-complete'))};
 useEffect(()=>{if(!show||effective==='reduced')return;let disposed=false,kill=()=>{};
 try{sessionStorage.setItem('markloom_ribbon_opening_seen','1')}catch{/* Optional enhancement. */}
 const fallback=window.setTimeout(finish,2700);
 void Promise.all([import('gsap'),import('gsap/Flip')]).then(([{gsap},{Flip}])=>{if(disposed||!logo.current)return;gsap.registerPlugin(Flip);const element=logo.current;
 const timer=gsap.delayedCall(1.2,()=>{const target=document.querySelector('.liquid-header .liquid-wordmark img');if(!target){finish();return}const state=Flip.getState(element);const bounds=target.getBoundingClientRect();gsap.set(element,{left:bounds.left,top:bounds.top,width:bounds.width,height:bounds.height});element.closest('.brand-arrival')?.classList.add('is-docking');const tween=Flip.from(state,{duration:.85,ease:'power2.inOut',scale:true,onComplete:finish});kill=()=>{timer.kill();tween.kill()};});kill=()=>timer.kill();
 }).catch(finish);
 return()=>{disposed=true;clearTimeout(fallback);kill()};
 },[show,effective]);
 if(!show||effective==='reduced')return null;
 return <aside className="brand-arrival" aria-label="Markloom opening"><div className="brand-arrival-veil"/><div ref={logo} className="brand-arrival-logo" aria-hidden="true"><img src="/markloom-logo.webp" alt="" width="720" height="480"/></div><button onClick={finish}>Skip opening</button></aside>;
}
