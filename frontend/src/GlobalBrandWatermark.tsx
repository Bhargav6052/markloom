import {useEffect,useRef} from 'react';
import {useMotionSettings} from './MotionSettings';
/** One quiet, decorative brand layer shared by public, auth and workspace routes. */
export default function GlobalBrandWatermark(){const ref=useRef<HTMLDivElement>(null),{effective}=useMotionSettings();
 useEffect(()=>{const node=ref.current;if(!node)return;const visibility=()=>node.dataset.foreground=String(!document.hidden);visibility();document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility)},[]);
 return <div ref={ref} className="global-brand-watermark" data-motion={effective} aria-hidden="true"><img src="/markloom-logo.webp" alt="" width="720" height="480" draggable={false}/></div>;
}
