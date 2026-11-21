import {useEffect,useId,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {useMotionSettings} from './MotionSettings';

function GlassM(){
 const uid=useId(),fill=uid+'-glass',edge=uid+'-edge';
 const d='M80 288 L117 120 Q137 45 180 113 L250 232 Q261 247 274 224 L341 106 Q381 35 404 117 L438 288';
 return <svg className="saturn-m-svg" viewBox="0 0 520 365" role="presentation" aria-hidden="true">
 <defs>
  <linearGradient id={fill} x1="0" y1="0" x2=".85" y2="1"><stop stopColor="#edccff"/><stop offset=".24" stopColor="#9e66d5"/><stop offset=".45" stopColor="#5f398a"/><stop offset=".63" stopColor="#c5a3ef"/><stop offset=".83" stopColor="#8a57bd"/><stop offset="1" stopColor="#e6b86d"/></linearGradient>
  <linearGradient id={edge} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f3c987"/><stop offset=".34" stopColor="#dcc0ff"/><stop offset=".62" stopColor="#fce5bc"/><stop offset="1" stopColor="#a572dc"/></linearGradient>
 </defs>
 <path d={d} fill="none" stroke="#543363" strokeWidth="45" strokeLinecap="round" strokeLinejoin="round" transform="translate(4 6)"/>
 <path d={d} fill="none" stroke={`url(#${edge})`} strokeWidth="45" strokeLinecap="round" strokeLinejoin="round"/>
 <path d={d} fill="none" stroke={`url(#${fill})`} strokeWidth="38" strokeLinecap="round" strokeLinejoin="round"/>
 <path d={d} fill="none" stroke="#fff5e9" strokeWidth="2" strokeOpacity=".72" strokeLinecap="round" strokeLinejoin="round" transform="translate(-3 -4)"/>
 </svg>
}
export function MarkloomMIcon(){return <svg aria-hidden="true" className="saturn-m-icon" viewBox="0 0 44 44"><path d="M4 36L10 10Q12 4 16 11L22 26L30 10Q34 4 36 12L40 36" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
export default function SaturnHero({onCreate}:{onCreate:()=>void}){
 const root=useRef<HTMLElement>(null),host=useRef<HTMLDivElement>(null),[ready,setReady]=useState(false);
 const {effective}=useMotionSettings(),[wide,setWide]=useState(()=>typeof matchMedia!=='undefined'&&matchMedia('(min-width: 850px)').matches);
 useEffect(()=>{const query=matchMedia('(min-width: 850px)'),change=()=>setWide(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change)},[]);
 useEffect(()=>{
  setReady(false);
  if(effective==='reduced'||!wide||!root.current||!host.current)return;
  let cancelled=false,dispose:(()=>void)|undefined;
  void import('./saturnScene').then(({mountSaturnScene})=>{
    if(cancelled||!root.current||!host.current)return;
    dispose=mountSaturnScene(host.current,root.current,effective==='full',state=>{if(!cancelled)setReady(state)});
  }).catch(()=>{if(!cancelled)setReady(false)});
  return()=>{cancelled=true;dispose?.()};
 },[effective,wide]);
 return <section className="saturn-hero" ref={root} aria-labelledby="hero-title">
 <div className="saturn-hero-word" aria-hidden="true">markloom</div>
 <div className="saturn-hero-lights" aria-hidden="true"/>
 <div className="saturn-optics" aria-hidden="true"><span className="saturn-wave-a"/><span className="saturn-wave-b"/><span className="saturn-floor"/></div>
 <div className="saturn-copy">
 <p className="saturn-eyebrow">BRAND KNOWLEDGE. IN CONTEXT.</p>
 <h1 id="hero-title">Proof behind<br/><em>every idea.</em></h1>
 <p className="saturn-description">From approved knowledge and real evidence to confident brand decisions and governance.</p>
 <div className="saturn-actions">
  <Link to="/signup" onClick={onCreate} className="saturn-glass-button saturn-cta">Create your workspace <span aria-hidden="true">↗</span></Link>
  <a className="saturn-glass-button saturn-secondary" href="#source">How it works <span aria-hidden="true">↓</span></a>
  <Link to="/product-tour" className="saturn-glass-button saturn-secondary">Product tour</Link>
 </div>
 </div>
 <div className="saturn-art" aria-hidden="true">
  <div className="saturn-light-halo"/>
  <div className="saturn-m-static"><div className="saturn-static-orbit"/><GlassM/></div>
  <div ref={host} className={'saturn-webgl'+(ready?' is-rendered':'')}/>
  <div className="saturn-floor-reflection"/>
  {ready&&<><span className="saturn-callout saturn-pointer">Reacts to<br/>your cursor</span><span className="saturn-callout saturn-idle">Auto-rotates<br/>when idle</span></>}
  <div className="saturn-angle">← <span>360°</span> →</div>
 </div>
 <a href="#source" className="saturn-scroll-cue">SCROLL TO EXPLORE <span aria-hidden="true">⌄</span></a>
 <nav className="saturn-features" aria-label="Explore Markloom workflow">
 <a href="#source"><span>01</span> Trusted knowledge</a>
 <a href="#draft"><span>02</span> Brand governance</a>
 <a href="#decision"><span>03</span> Confident decisions</a>
 </nav>
 </section>
}
