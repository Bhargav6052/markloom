import {useEffect,useRef,useState} from 'react';
import {Link,useNavigate,useLocation} from 'react-router-dom';
import {trackPublicEvent,openConsent} from './Consent';
import FlowNavigation from './FlowNavigation';
import ExperienceDeck,{experienceSlides} from './ExperienceDeck';
import BackToTop from './BackToTop';
import {cinematicScroll} from './cinematicScroll';
import EvidenceStory from './EvidenceStory';
import WorkflowChapters from './WorkflowChapters';
import {useMotionSettings} from './MotionSettings';
import type {SceneMotion} from './sceneState';
export function Shield(){return <svg width="18" height="20" viewBox="0 0 24 26" fill="none" aria-hidden="true"><path d="M12 2 22 6v7c0 5-5 9-10 11C7 22 2 18 2 13V6l10-4Z" stroke="currentColor" strokeWidth="1.6"/><path d="m7 13 3 3 7-7" stroke="currentColor" strokeWidth="1.6"/></svg>}
export default function Landing(){
 const root=useRef<HTMLDivElement>(null);const motion=useRef<SceneMotion>({progress:0});const {effective}=useMotionSettings();const reduced=effective==='reduced';const [desktop,setDesktop]=useState(()=>typeof matchMedia==='function'&&matchMedia('(min-width: 761px)').matches);
 useEffect(()=>{const query=matchMedia('(min-width: 761px)');const update=()=>setDesktop(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);
 const animated=desktop&&!reduced;
 useEffect(()=>{if(reduced||!root.current)return;let disposed=false;let cleanup:(()=>void)|undefined;void import('./cinematicMotion').then(({mountCinematicMotion})=>{if(!disposed&&root.current)cleanup=mountCinematicMotion(root.current,motion.current,desktop)}).catch(()=>{/* Native scrolling remains available. */});return()=>{disposed=true;cleanup?.()}},[desktop,reduced,effective]);
 const navigate=useNavigate();const {hash}=useLocation();const [slide,setSlide]=useState(()=>Math.max(0,experienceSlides.findIndex(s=>'#'+s.id===hash)));const [direction,setDirection]=useState(1);const [showExperience,setShowExperience]=useState(()=>experienceSlides.some(item=>item.id!=='product-tour'&&'#'+item.id===hash));
 useEffect(()=>{if(hash==='#product-tour'){navigate({hash:'#source'},{replace:true,preventScrollReset:true});cinematicScroll('source');return}const index=experienceSlides.findIndex(s=>'#'+s.id===hash);if(index<0)return;setShowExperience(true);setSlide(index);const frame=requestAnimationFrame(()=>cinematicScroll('experience'));return()=>cancelAnimationFrame(frame)},[hash]);
 const openSlide=(index:number,dir=index>=slide?1:-1)=>{if(index===2){navigate({hash:'#source'},{preventScrollReset:true});cinematicScroll('source');return}setShowExperience(true);setDirection(dir);setSlide(index);const next='#'+experienceSlides[index].id;if(hash!==next)navigate({hash:next},{preventScrollReset:true});else cinematicScroll('experience')};
 const cta=()=>void trackPublicEvent('cta_click','/');
 return <div ref={root} className="landing cinematic video-led flow-led refined-led pile-led journey-led" data-motion={animated?'enabled':'static'} data-interface-motion={reduced?'static':'enabled'} data-motion-mode={effective}>
  <div className="site-atmosphere" aria-hidden="true"><div className="ambient-beam"/><div className="ambient-floor"/><div className="ambient-pool"/></div>
  <a className="skip-link" href="#main-content">Skip to content</a>
  <nav className="public-nav" aria-label="Public navigation"><Link className="wordmark" to="/" aria-label="Markloom home">markloom<span className="brand-mark" aria-hidden="true"/></Link><div className="public-links">{[['/how-it-works','How it works'],['/our-principles','Our principles'],['/product-tour','Product tour']].map(([to,label])=><Link key={to} to={to}>{label}</Link>)}</div><Link className="nav-signin" to="/login">Sign in <span aria-hidden="true">↗</span></Link></nav>
  <main id="main-content" className="public-main">
   <div className="pile-story"><div className="pile-visual-rail"><div className="pile-sticky-stage"><FlowNavigation animated={!reduced}/></div></div>
   <section className="hero" aria-labelledby="hero-title">
    <div className="hero-copy"><p className="kicker hero-eyebrow">BRAND KNOWLEDGE. IN CONTEXT.</p><h1 id="hero-title"><span className="hero-line"><span>Proof behind</span></span><span className="hero-line accent-line"><span>every idea.</span></span></h1><p className="hero-subcopy">From approved knowledge to confident decisions.</p><div className="hero-actions"><Link className="primary-link" to="/signup" onClick={cta}>Create your workspace <span aria-hidden="true">↗</span></Link></div></div>
    <div className="hero-bottom"><a href="#source" className="scroll-cue"><span className="scroll-line" aria-hidden="true"/>Scroll to explore</a></div>
   </section>
   <WorkflowChapters/>
   </div>
   <div className="experience-slot">{showExperience&&<ExperienceDeck active={slide} direction={direction} onChange={openSlide} animated={!reduced}/>}</div>
   <EvidenceStory/>
   <section className="statement-section"><img className="statement-image" src="/connected-evidence.webp" alt="Translucent evidence sheets and a chrome seal connected by a violet filament" width="1536" height="864" loading="lazy" decoding="async"/><div className="statement-glow" aria-hidden="true"/><p className="kicker" data-reveal>CREATIVITY, WITH CONTINUITY.</p><h2 data-reveal>Every claim has a source.<br/><span>Every decision has a story.</span></h2><p className="statement-caption" data-reveal>Keep the connection.</p></section>
   <section className="closing-section"><div className="closing-halo" aria-hidden="true"/><p className="kicker" data-reveal>A NEW PERSPECTIVE ON BRAND GOVERNANCE</p><h2 data-reveal>Good ideas deserve<br/><span>solid ground.</span></h2><Link className="primary-link" to="/signup" onClick={cta}>Create your workspace <span aria-hidden="true">↗</span></Link><p className="closing-note">Start with your own sources. Build with your own people.</p></section>
  </main>
  <BackToTop/>
  <footer className="public-footer"><div className="footer-top"><Link className="wordmark" to="/" aria-label="Markloom home">markloom<span className="brand-mark" aria-hidden="true"/></Link><p>Connected evidence.<br/>Considered decisions.</p></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Markloom</span><div><Link to="/privacy">Privacy policy</Link><Link to="/terms">Terms</Link><Link to="/contact">Contact / Support</Link><button className="footer-preferences" onClick={openConsent}>Cookie preferences</button></div><a href="#main-content" className="back-top">Back to top <span aria-hidden="true">↑</span></a></div></footer>
 </div>
}
