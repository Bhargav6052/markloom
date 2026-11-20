import {useEffect,useId,useRef,useState} from 'react';
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
 const uid=useId();const metal=uid+'-metal',glow=uid+'-glow';
 const paths=['M112 245 C45 90 300 20 355 174 S148 350 93 170 S331 44 370 220 S120 395 112 245',
 'M95 113 C95 55 362 55 362 113 S95 171 95 113 L95 210 C95 268 362 268 362 210 S95 152 95 210 L95 298 C95 356 362 356 362 298 S95 240 95 298',
 'M74 198 C74 58 394 58 394 198 S74 338 74 198 M229 44 C80 44 80 352 229 352 S378 44 229 44 M90 106 L371 291 M94 294 L371 105',
 'M100 204 L189 284 L352 106'];
 const dots=Array.from({length:24},(_,i)=>({x:234+176*Math.cos(i*Math.PI/12),y:198+160*Math.sin(i*Math.PI/12)}));
 return <svg className="loom-still" viewBox="0 0 468 398" aria-hidden="true">
 <defs><linearGradient id={metal} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#ffffff"/><stop offset=".23" stopColor="#9daadc"/><stop offset=".51" stopColor="#26314e"/><stop offset=".76" stopColor="#d6c4ff"/><stop offset="1" stopColor="#728cc9"/></linearGradient><radialGradient id={glow}><stop stopColor="#9d95ff" stopOpacity=".28"/><stop offset="1" stopColor="#394b83" stopOpacity="0"/></radialGradient></defs>
 <ellipse cx="234" cy="199" rx="222" ry="190" fill={`url(#${glow})`}/>
 {dots.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={i%3===0?3:1.6} fill="#c8d7ff" opacity={.45+(i%3)*.17}/>)}
 <path d={paths[stage]} stroke="#a4baff" strokeOpacity=".22" strokeWidth="26" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
 <path d={paths[stage]} stroke={`url(#${metal})`} strokeWidth="17" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
 <path d={paths[stage]} stroke="#ffffff" strokeOpacity=".36" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -4)"/>
 </svg>
}

function GlassPanels(){
 return <div className="premiere-panels" aria-hidden="true">
  <div className="premiere-panel pane-source"><div className="pane-top"><span>01</span><span>Source</span></div><p className="pane-caption">Approved knowledge</p><div className="pane-sources">{['Brand guidelines','Product facts','Brand assets'].map((label,i)=><div key={label}><span className="pane-sheet"><i/><i/><i/></span><span>{label}<small>Versioned evidence · 0{i+1}</small></span></div>)}</div><div className="pane-bottom">Knowledge, in context.</div></div>
  <div className="premiere-panel pane-draft"><div className="pane-top"><span>02</span><span>Draft</span></div><p className="pane-caption">Evidence-led review</p><div className="pane-editor"><i/><i/><i/><div className="pane-highlight"><span>Claim linked to source</span><i/><i/></div><i/><i/><i/></div><div className="pane-bottom">Traceable findings.</div></div>
  <div className="premiere-panel pane-decision"><div className="pane-top"><span>03</span><span>Decision</span></div><p className="pane-caption">Human-controlled approval</p><svg className="pane-check" viewBox="0 0 160 116"><path d="M27 57L64 94L135 23" fill="none" stroke="#7f65be" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round"/><path d="M27 57L64 94L135 23" fill="none" stroke="#d5caff" strokeWidth="23" strokeLinecap="round" strokeLinejoin="round"/><path d="M27 53L64 90L135 19" fill="none" stroke="#f6efff" strokeOpacity=".8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg><div className="pane-decision-list"><span>Exact saved version</span><span>Evidence snapshot</span><span>Independent review</span></div><div className="pane-bottom">A human makes the call.</div></div>
 </div>
}

export default function LivingLoom({onCreate}:{onCreate:()=>void}){
 const journey=useRef<HTMLDivElement>(null),host=useRef<HTMLDivElement>(null),art=useRef<HTMLDivElement>(null),progress=useRef(0);
 const [stage,setStage]=useState(0),[ready,setReady]=useState(false);
 const {effective}=useMotionSettings();
 useEffect(()=>{const el=art.current;if(!el||effective==='reduced')return;const move=(e:PointerEvent)=>{const r=el.getBoundingClientRect();if(!r.width||!r.height)return;el.style.setProperty('--pointer-x',String(Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1))));el.style.setProperty('--pointer-y',String(Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1))))};const reset=()=>{el.style.setProperty('--pointer-x','0');el.style.setProperty('--pointer-y','0')};el.addEventListener('pointermove',move);el.addEventListener('pointerleave',reset);return()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',reset);reset()}},[effective]);
 const [wide,setWide]=useState(()=>typeof matchMedia==='function'&&matchMedia('(min-width: 900px)').matches);
 useEffect(()=>{const media=matchMedia('(min-width: 900px)');const change=()=>setWide(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
 useEffect(()=>{
  let raf=0;const tick=()=>{raf=0;const positions=ids.map(id=>document.getElementById(id)?.getBoundingClientRect().top??0);const anchors=positions.map(p=>p+window.scrollY-window.innerHeight*.22);progress.current=loomProgress(window.scrollY,anchors);setStage(Math.round(progress.current));art.current?.style.setProperty("--journey-progress",String(progress.current))};
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
 return <div className="loom-journey premiere-journey" ref={journey} data-stage={stage}>
 <div className="loom-visual-rail"><div className="loom-visual">
 <div className="loom-orbit" aria-hidden="true"/><div className="loom-stage-caption"><span>01—03 / THE LIVING LOOM</span><strong>{loomStages[stage]}</strong></div>
 <div className="loom-art premiere-art" ref={art}><div className={'loom-fallback'+(ready?' is-rendered':'')}><Still stage={wide?stage:0}/></div><div className="loom-webgl" ref={host}/><div className="premiere-ribbon" aria-hidden="true"/><GlassPanels/><span className="premiere-disclosure">Product illustration · not a live approval</span></div>
 <div className="loom-visual-foot"><span>Connected intelligence</span><span>{stage===0?'Explore the workflow':String(stage).padStart(2,'0')+' / 03'}</span></div>
 </div></div>
 <div className="loom-copy-rail">
 <section className="loom-intro" id="loom-hero" aria-labelledby="workflow-title">
 <p className="loom-kicker">SOURCE / DRAFT / DECISION</p>
 <h2 id="workflow-title">Every idea has a journey.</h2>
 <p className="loom-lead">Connect trusted knowledge, review your content and keep the final decision human.</p>
 <div className="loom-actions"><Link className="primary-link" to="/signup" onClick={onCreate}>Create your workspace <span aria-hidden="true">↗</span></Link><Link className="loom-secondary-link" to="/product-tour">Explore product <span aria-hidden="true">↗</span></Link></div>
 <nav className="loom-stage-links" aria-label="Workflow stages">{chapters.map(c=><a href={'#'+c.id} key={c.id} aria-current={stage===Number(c.n)?'location':undefined}><span>{c.n}</span>{c.name}</a>)}</nav>
 <a className="loom-scroll" href="#source">Scroll to explore <span aria-hidden="true">↓</span></a>
 </section>
 {chapters.map(c=><section className="loom-chapter" id={c.id} key={c.id} aria-labelledby={c.id+'-title'}>
 <div className="loom-mobile-art"><Still stage={Number(c.n)}/></div><p className="loom-kicker">{c.n} / {c.name}</p><h2 id={c.id+'-title'}>{c.title}</h2><p className="loom-lead">{c.copy}</p><p className="loom-detail">{c.detail}</p>
 <details className="loom-preview"><summary>See a {c.name.toLowerCase()} example</summary><ProductPreview stage={c.id}/></details>
 <Link className="loom-secondary-link" to={c.link}>Open {c.name.toLowerCase()} workspace ↗</Link>
 </section>)}
 </div>
 </div>
}
