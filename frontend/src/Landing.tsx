import {useEffect} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {trackPublicEvent,openConsent} from './Consent';
import BackToTop from './BackToTop';
import EvidenceStory from './EvidenceStory';
import LivingLoom from './LivingLoom';
import BrandHero,{MarkloomSymbol} from './BrandHero';
import {useMotionSettings} from './MotionSettings';
export function Shield(){return <svg width="18" height="20" viewBox="0 0 24 26" fill="none" aria-hidden="true"><path d="M12 2 22 6v7c0 5-5 9-10 11C7 22 2 18 2 13V6l10-4Z" stroke="currentColor" strokeWidth="1.6"/><path d="m7 13 3 3 7-7" stroke="currentColor" strokeWidth="1.6"/></svg>}
export default function Landing(){
 const {effective}=useMotionSettings();const {hash}=useLocation();
 useEffect(()=>{const id=hash.slice(1);if(!id)return;const aliases:Record<string,string>={'product-tour':'source','how-it-works':'source','experience':'source','main-content':'brand-hero','our-principles':'principles'};const frame=requestAnimationFrame(()=>document.getElementById(aliases[id]||id)?.scrollIntoView({behavior:'instant'}));return()=>cancelAnimationFrame(frame)},[hash]);
 const cta=()=>void trackPublicEvent('cta_click','/');
 return <div className="landing loom-led premiere-led" data-motion-mode={effective}>
  <a className="skip-link" href="#main-content">Skip to content</a>
  <nav className="public-nav" aria-label="Public navigation"><Link className="wordmark" to="/" aria-label="Markloom home"><MarkloomSymbol/>markloom</Link><div className="public-links">{[['/how-it-works','How it works'],['/product-tour','Product tour'],['/our-principles','Our principles']].map(([to,label])=><Link key={to} to={to}>{label}</Link>)}</div><div className="premiere-nav-actions"><Link className="nav-signin" to="/login">Sign in</Link><Link className="primary-link premiere-nav-cta" to="/signup" onClick={cta}>Create your workspace ↗</Link></div></nav>
  <main id="main-content" className="public-main">
   <BrandHero onCreate={cta}/>
   <nav className="signature-teasers" aria-label="Explore Markloom capabilities"><a href="#source">Trusted knowledge</a><a href="#draft">Brand governance</a><a href="#decision">Confident decisions</a></nav><LivingLoom onCreate={cta}/>
   <div id="principles"><EvidenceStory/></div>
   <section className="loom-final"><p className="loom-kicker">KNOWLEDGE IN MOTION</p><h2>Keep your brand <span>connected.</span></h2><p className="loom-detail">From approved evidence to accountable decisions. One workspace, built around your people.</p><Link className="primary-link" to="/signup" onClick={cta}>Create your workspace <span aria-hidden="true">↗</span></Link></section>
  </main>
  <BackToTop/>
  <footer className="public-footer"><div className="footer-top"><Link className="wordmark" to="/" aria-label="Markloom home">markloom.</Link><p>Connected evidence.<br/>Considered decisions.</p></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Markloom</span><div><Link to="/privacy">Privacy policy</Link><Link to="/terms">Terms</Link><Link to="/contact">Contact / Support</Link><button className="footer-preferences" onClick={openConsent}>Cookie preferences</button></div><a href="#main-content" className="back-top">Back to top <span aria-hidden="true">↑</span></a></div></footer>
 </div>
}
