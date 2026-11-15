import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {cinematicScroll} from './cinematicScroll';
export default function BackToTop(){const navigate=useNavigate();const [visible,setVisible]=useState(false);useEffect(()=>{const update=()=>setVisible(scrollY>220);update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update)},[]);
 function back(){cinematicScroll('main-content');navigate({pathname:location.pathname,search:location.search,hash:'#main-content'},{replace:true,preventScrollReset:true})}
 return <button className={'floating-top'+(visible?' is-visible':'')} onClick={back} aria-label="Scroll to top" title="Back to top" tabIndex={visible?0:-1} aria-hidden={!visible}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20V4m-6 6 6-6 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
}
