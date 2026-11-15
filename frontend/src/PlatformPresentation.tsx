import {useEffect,useState,type ReactNode} from 'react';
import {Link,useLocation} from 'react-router-dom';
import PurposeVisual from './PurposeVisual';
import {useMotionSettings} from './MotionSettings';
export function AuthEnvironment({children}:{children:ReactNode}){return <div className="auth-environment"><section className="auth-context"><Link className="wordmark" to="/">markloom</Link><PurposeVisual kind="privacy"/><p className="auth-context-title">A considered space<br/>for your brand.</p><p>Approved knowledge. Connected work. Human decisions.</p></section>{children}</div>}
export function GlobalBackToTop(){const {pathname}=useLocation();const {effective}=useMotionSettings();const [visible,setVisible]=useState(false);useEffect(()=>{const update=()=>setVisible(scrollY>400);update();addEventListener('scroll',update,{passive:true});return()=>removeEventListener('scroll',update)},[pathname]);if(pathname==='/'||!visible)return null;return <button className="site-back-top" aria-label="Back to top" onClick={()=>window.scrollTo({top:0,behavior:effective==='reduced'?'instant':'smooth'})}>↑</button>}
