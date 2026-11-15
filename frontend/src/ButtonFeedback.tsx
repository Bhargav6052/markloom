import {useEffect,useRef} from 'react';
/** Capture input before the control's handler; never intercept or replay the action. */
export default function ButtonFeedback(){const glow=useRef<HTMLDivElement>(null);
 useEffect(()=>{let animation:Animation|undefined;let previous:Element|null=null,last=0;
 function highlight(target:EventTarget|null){if(!(target instanceof Element))return;const control=target.closest<HTMLElement>('button,a[href],[role="button"]');if(!control||control.matches(':disabled,[aria-disabled="true"]'))return;const now=performance.now();if(control===previous&&now-last<120)return;previous=control;last=now;const rect=control.getBoundingClientRect(),el=glow.current;if(!el||!rect.width||!rect.height)return;animation?.cancel();Object.assign(el.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',borderRadius:getComputedStyle(control).borderRadius});
 const reduced=document.documentElement.dataset.interfaceMotion==='static'||matchMedia('(prefers-reduced-motion: reduce)').matches||document.querySelector<HTMLElement>('.landing')?.dataset.interfaceMotion==='static';
 animation=el.animate(reduced?[{opacity:.25},{opacity:0}]:[{opacity:.2,transform:'perspective(700px) rotateX(-1deg) scale(.995)',boxShadow:'0 0 0 #c698ff00'},{opacity:.4,transform:'perspective(700px) rotateX(1deg) scale(1.005)',boxShadow:'0 0 32px #b77eff28, inset 0 0 22px #cca0ff18',offset:.35},{opacity:0,transform:'perspective(700px) rotateX(0) scale(1.005)',boxShadow:'0 0 45px #b77eff00'}],{duration:reduced?140:200,easing:'cubic-bezier(.16,1,.3,1)'});
 }
 const pointer=(e:PointerEvent)=>highlight(e.target);const keyboard=(e:KeyboardEvent)=>{if(e.key==='Enter'||e.key===' ')highlight(e.target)};
 document.addEventListener('pointerdown',pointer,true);document.addEventListener('keydown',keyboard,true);return()=>{document.removeEventListener('pointerdown',pointer,true);document.removeEventListener('keydown',keyboard,true);animation?.cancel()};
 },[]);return <div ref={glow} className="action-glint" aria-hidden="true"/>;
}
