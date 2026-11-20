import {useEffect,useId,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {useMotionSettings} from './MotionSettings';

export function MarkloomSymbol(){
 return <svg aria-hidden="true" className="markloom-symbol" viewBox="0 0 44 44" fill="none"><path d="M5 35L10 10Q11 7 14 11L22 25L31 9Q34 5 35 11L40 35" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function StillLogo(){
 const uid=useId(),metal=uid+'-glass',rim=uid+'-rim';
 const path='M96 326L127 128Q139 82 167 121L250 242Q260 260 274 239L355 104Q383 66 395 123L424 326';
 return <svg className="brand-static-logo" viewBox="0 0 520 440" aria-hidden="true">
 <defs><linearGradient id={metal} x1="0" y1="0" x2=".75" y2="1"><stop stopColor="#b999d2"/><stop offset=".19" stopColor="#e9ccf9"/><stop offset=".39" stopColor="#655078"/><stop offset=".58" stopColor="#9771be"/><stop offset=".81" stopColor="#73558e"/><stop offset="1" stopColor="#f6d4a0"/></linearGradient><linearGradient id={rim}><stop stopColor="#f7d394"/><stop offset=".43" stopColor="#e4c1ff"/><stop offset=".72" stopColor="#a783d0"/><stop offset="1" stopColor="#f8daae"/></linearGradient></defs>
 <path d={path} transform="translate(8 9)" stroke="#372643" strokeWidth="45" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
 <path d={path} stroke={`url(#${rim})`} strokeWidth="43" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
 <path d={path} stroke={`url(#${metal})`} strokeWidth="38" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
 <path d={path} transform="translate(-4 -4)" stroke="#fdf0ff" strokeWidth="2" strokeOpacity=".58" strokeLinecap="round" fill="none"/>
 </svg>
}
export default function BrandHero({onCreate}:{onCreate:()=>void}){
 const root=useRef<HTMLElement>(null),host=useRef<HTMLDivElement>(null);
 const {effective}=useMotionSettings();
 const [ready,setReady]=useState(false);
 const [wide,setWide]=useState(()=>typeof matchMedia==='function'&&matchMedia('(min-width: 900px)').matches);
 useEffect(()=>{const media=matchMedia('(min-width: 900px)');const change=()=>setWide(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
 useEffect(()=>{
  setReady(false);if(!wide||effective==='reduced'||!host.current||!root.current)return;
  let dead=false,dispose:(()=>void)|undefined;
  void import('./brandLogoWebgl').then(({mountBrandLogo})=>{if(!dead&&root.current&&host.current)dispose=mountBrandLogo(host.current,root.current,effective==='full',value=>{if(!dead)setReady(value)})}).catch(()=>{if(!dead)setReady(false)});
  return()=>{dead=true;dispose?.()};
 },[wide,effective]);
 return <section className="brand-hero" id="brand-hero" ref={root} aria-labelledby="hero-title">
 <div className="brand-haze" aria-hidden="true"/><div className="brand-backtype" aria-hidden="true">markloom</div><div className="signature-wave signature-wave-top" aria-hidden="true"/><div className="signature-wave signature-wave-bottom" aria-hidden="true"/>
 <div className="brand-hero-layout">
 <div className="brand-hero-copy"><p className="brand-eyebrow">Brand knowledge. In context.</p>
 <h1 id="hero-title">Proof behind<br/><em>every idea.</em></h1>
 <p className="brand-lead">From approved knowledge and real evidence to confident brand decisions and governance.</p>
 <div className="brand-actions"><Link className="primary-link brand-glass-button" to="/signup" onClick={onCreate}>Create your workspace <span aria-hidden="true">↗</span></Link><a className="brand-glass-button brand-quiet" href="#loom-hero">How it works <span aria-hidden="true">↓</span></a><Link className="brand-glass-button brand-quiet" to="/product-tour">Product tour</Link></div>
 </div>
 <div className="brand-hero-art" aria-hidden="true"><div className="brand-orbit"/><div className="brand-orbit brand-orbit-gold"/><div className="brand-reflection"/><div className={'brand-logo-fallback'+(ready?' is-rendered':'')}><StillLogo/></div><div className="brand-logo-webgl" ref={host}/>{wide&&effective!=='reduced'&&ready&&<div className="brand-interaction-labels"><span className="brand-cursor-label">Reacts to<br/>your cursor</span><span className="brand-idle-label">Auto-rotates<br/>when idle</span></div>}<span className="brand-art-caption">{wide&&effective!=='reduced'&&ready?'←  360°  →':'Markloom / Connected evidence'}</span></div>
 </div>
 <a className="brand-scroll" href="#loom-hero">Scroll to explore <span aria-hidden="true">↓</span></a>
 </section>
}
