import {useEffect,useId,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {useMotionSettings} from './MotionSettings';

export function MarkloomSymbol(){
 return <svg aria-hidden="true" className="markloom-symbol" viewBox="0 0 44 44" fill="none"><g transform="rotate(-15 22 22)" stroke="currentColor" strokeWidth="2.5"><rect x="8" y="5" width="22" height="29" rx="3"/><rect x="15" y="10" width="22" height="29" rx="3"/></g></svg>
}

function StillLogo(){
 const id=useId(),metal=id+'-metal',rim=id+'-rim';
 return <svg className="brand-static-logo" viewBox="0 0 520 440" aria-hidden="true">
 <defs><linearGradient id={metal} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f4e0bd"/><stop offset=".19" stopColor="#a997bb"/><stop offset=".39" stopColor="#51435e"/><stop offset=".65" stopColor="#dcc1ea"/><stop offset=".8" stopColor="#776283"/><stop offset="1" stopColor="#e2c99a"/></linearGradient><linearGradient id={rim}><stop stopColor="#f9e5c8"/><stop offset=".5" stopColor="#d6b5f2"/><stop offset="1" stopColor="#b49872"/></linearGradient></defs>
 <g transform="translate(260 215) rotate(-16)"><rect x="-144" y="-146" width="190" height="240" rx="37" stroke="#1a1720" strokeWidth="37" fill="none"/><rect x="-140" y="-152" width="190" height="240" rx="37" stroke={`url(#${metal})`} strokeWidth="31" fill="none"/><rect x="-68" y="-94" width="190" height="240" rx="37" stroke="#1a1720" strokeWidth="37" fill="none"/><rect x="-65" y="-100" width="190" height="240" rx="37" stroke={`url(#${metal})`} strokeWidth="31" fill="none"/><rect x="-65" y="-100" width="190" height="240" rx="37" stroke={`url(#${rim})`} strokeOpacity=".8" strokeWidth="2" fill="none"/></g>
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
 <div className="brand-haze" aria-hidden="true"/><div className="brand-backtype" aria-hidden="true">markloom</div>
 <div className="brand-hero-layout">
 <div className="brand-hero-copy"><p className="brand-eyebrow">Brand knowledge. In context.</p>
 <h1 id="hero-title">Proof behind<br/><em>every idea.</em></h1>
 <p className="brand-lead">From approved knowledge and real evidence to confident brand decisions.</p>
 <div className="brand-actions"><Link className="primary-link brand-glass-button" to="/signup" onClick={onCreate}>Create your workspace <span aria-hidden="true">↗</span></Link><a className="brand-glass-button brand-quiet" href="#loom-hero">How it works <span aria-hidden="true">↓</span></a><Link className="brand-glass-button brand-quiet" to="/product-tour">Product tour</Link></div>
 </div>
 <div className="brand-hero-art" aria-hidden="true"><div className="brand-orbit"/><div className="brand-orbit brand-orbit-gold"/><div className="brand-reflection"/><div className={'brand-logo-fallback'+(ready?' is-rendered':'')}><StillLogo/></div><div className="brand-logo-webgl" ref={host}/><span className="brand-art-caption">{wide&&effective!=='reduced'&&ready?'Move your cursor · rotates when idle':'Markloom / Connected evidence'}</span></div>
 </div>
 <a className="brand-scroll" href="#loom-hero">Scroll to explore <span aria-hidden="true">↓</span></a>
 </section>
}
