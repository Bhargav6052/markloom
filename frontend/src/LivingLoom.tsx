import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import ProductPreview from './ProductPreview';
import {useMotionSettings} from './MotionSettings';
import {loomProgress,loomStages} from './loomModel';

const ids=['loom-hero','source','draft','decision'];
const chapters=[
 {id:'source',n:'01',name:'Source',title:'Give every claim a foundation.',copy:'Approve the guidelines, facts and assets that define your brand. Preserve each source and exact version.',detail:'Only approved knowledge becomes authoritative. Unapproved uploads stay separate.',link:'/app/knowledge'},
 {id:'draft',n:'02',name:'Draft',title:'See the connections.',copy:'Review your saved draft against approved evidence. Understand what needs attention and why.',detail:'Inspect citations and correction suggestions. Changes are always a human choice.',link:'/app/content'},
 {id:'decision',n:'03',name:'Decision',title:'Make the final call human.',copy:'An independent reviewer approves the exact saved version. When evidence changes, affected work returns for review.',detail:'A version-bound approval passport preserves the decision and its evidence snapshot.',link:'/app/approvals'},
] as const;

function Still({stage}:{stage:number}){
 const paths=['M112 245 C45 90 300 20 355 174 S148 350 93 170 S331 44 370 220 S120 395 112 245',
 'M95 113 C95 55 362 55 362 113 S95 171 95 113 L95 210 C95 268 362 268 362 210 S95 152 95 210 L95 298 C95 356 362 356 362 298 S95 240 95 298',
 'M74 198 C74 58 394 58 394 198 S74 338 74 198 M229 44 C80 44 80 352 229 352 S378 44 229 44 M90 106 L371 291 M94 294 L371 105',
 'M100 204 L189 284 L352 106'];
 const dots=Array.from({length:24},(_,i)=>({x:234+176*Math.cos(i*Math.PI/12),y:198+160*Math.sin(i*Math.PI/12)}));
 return <svg className="loom-still" viewBox="0 0 468 398" aria-hidden="true">
 <defs><linearGradient id="loom-still-metal" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#ffffff"/><stop offset=".23" stopColor="#9daadc"/><stop offset=".51" stopColor="#26314e"/><stop offset=".76" stopColor="#d6c4ff"/><stop offset="1" stopColor="#728cc9"/></linearGradient><radialGradient id="loom-still-glow"><stop stopColor="#9d95ff" stopOpacity=".28"/><stop offset="1" stopColor="#394b83" stopOpacity="0"/></radialGradient></defs>
 <ellipse cx="234" cy="199" rx="222" ry="190" fill="url(#loom-still-glow)"/>
 {dots.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={i%3===0?3:1.6} fill="#c8d7ff" opacity={.45+(i%3)*.17}/>)}
 <path d={paths[stage]} stroke="#a4baff" strokeOpacity=".22" strokeWidth="26" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
 <path d={paths[stage]} stroke="url(#loom-still-metal)" strokeWidth="17" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
 <path d={paths[stage]} stroke="#ffffff" strokeOpacity=".36" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -4)"/>
 </svg>
}

export default function LivingLoom({onCreate}:{onCreate:()=>void}){
 const journey=useRef<HTMLDivElement>(null),host=useRef<HTMLDivElement>(null),progress=useRef(0);
 const [stage,setStage]=useState(0),[ready,setReady]=useState(false);
 const {effective}=useMotionSettings();
 const [wide,setWide]=useState(()=>typeof matchMedia==='function'&&matchMedia('(min-width: 900px)').matches);
 useEffect(()=>{const media=matchMedia('(min-width: 900px)');const change=()=>setWide(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
 useEffect(()=>{
  let raf=0;const tick=()=>{raf=0;const positions=ids.map(id=>document.getElementById(id)?.getBoundingClientRect().top??0);const anchors=positions.map(p=>p+window.scrollY-window.innerHeight*.22);progress.current=loomProgress(window.scrollY,anchors);setStage(Math.round(progress.current))};
  const update=()=>{if(!raf)raf=requestAnimationFrame(tick)};window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);update();
  const observer=new ResizeObserver(update);if(journey.current)observer.observe(journey.current);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('scroll',update);window.removeEventListener('resize',update)};
 },[]);
 useEffect(()=>{
  setReady(false);if(!wide||effective==='reduced'||!host.current)return;
  let dead=false,dispose:(()=>void)|undefined;
  void import('./loomWebgl').then(({mountLoom})=>{if(!dead&&host.current)dispose=mountLoom(host.current,progress,effective==='full',value=>{if(!dead)setReady(value)})}).catch(()=>{if(!dead)setReady(false)});
  return()=>{dead=true;dispose?.()};
 },[wide,effective]);
 return <div className="loom-journey" ref={journey}>
 <div className="loom-visual-rail"><div className="loom-visual">
 <div className="loom-orbit" aria-hidden="true"/><div className="loom-stage-caption"><span>01—03 / THE LIVING LOOM</span><strong>{loomStages[stage]}</strong></div>
 <div className="loom-art"><div className={'loom-fallback'+(ready?' is-rendered':'')}><Still stage={stage}/></div><div className="loom-webgl" ref={host}/></div>
 <div className="loom-visual-foot"><span>Connected intelligence</span><span>{stage===0?'Explore the workflow':String(stage).padStart(2,'0')+' / 03'}</span></div>
 </div></div>
 <div className="loom-copy-rail">
 <section className="loom-intro" id="loom-hero" aria-labelledby="hero-title">
 <p className="loom-kicker">BRAND INTELLIGENCE / HUMAN CONTROL</p>
 <h1 id="hero-title">Make every<br/>idea <em>stand.</em></h1>
 <p className="loom-lead">Your brand has a truth. Keep it connected to every draft, every claim and every decision.</p>
 <div className="loom-actions"><Link className="primary-link" to="/signup" onClick={onCreate}>Create your workspace <span aria-hidden="true">↗</span></Link><Link className="loom-secondary-link" to="/product-tour">Explore product <span aria-hidden="true">↗</span></Link></div>
 <nav className="loom-stage-links" aria-label="Workflow stages">{chapters.map(c=><a href={'#'+c.id} key={c.id} aria-current={stage===Number(c.n)?'location':undefined}><span>{c.n}</span>{c.name}</a>)}</nav>
 <a className="loom-scroll" href="#source">Scroll to explore <span aria-hidden="true">↓</span></a>
 </section>
 {chapters.map(c=><section className="loom-chapter" id={c.id} key={c.id} aria-labelledby={c.id+'-title'}>
 <p className="loom-kicker">{c.n} / {c.name}</p><h2 id={c.id+'-title'}>{c.title}</h2><p className="loom-lead">{c.copy}</p><p className="loom-detail">{c.detail}</p>
 <details className="loom-preview"><summary>See a {c.name.toLowerCase()} example</summary><ProductPreview stage={c.id}/></details>
 <Link className="loom-secondary-link" to={c.link}>Open {c.name.toLowerCase()} workspace ↗</Link>
 </section>)}
 </div>
 </div>
}
