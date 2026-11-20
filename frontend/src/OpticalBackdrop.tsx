import {useId} from 'react';
export default function OpticalBackdrop(){
 const uid=useId(),id=(x:string)=>uid+x,url=(x:string)=>'url(#'+id(x)+')';
 return <svg className="signature-optical-scene" viewBox="0 0 1600 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
 <linearGradient id={id('sheen')} x1="0" y1="0" x2=".9" y2="1"><stop stopColor="#21172d" stopOpacity=".1"/><stop offset=".28" stopColor="#59446f" stopOpacity=".35"/><stop offset=".45" stopColor="#a889dc" stopOpacity=".7"/><stop offset=".48" stopColor="#e9cbff" stopOpacity=".88"/><stop offset=".53" stopColor="#6c4b9b" stopOpacity=".53"/><stop offset=".75" stopColor="#2b1e3e" stopOpacity=".8"/><stop offset="1" stopColor="#aa81d2" stopOpacity=".3"/></linearGradient>
 <linearGradient id={id('edge')}><stop stopColor="#ab86cc" stopOpacity=".18"/><stop offset=".34" stopColor="#dcbafa"/><stop offset=".51" stopColor="#ffdfaa"/><stop offset=".68" stopColor="#c39ae8"/><stop offset="1" stopColor="#ad83d0" stopOpacity=".2"/></linearGradient>
 <radialGradient id={id('purple')}><stop stopColor="#d4acff" stopOpacity=".8"/><stop offset=".24" stopColor="#a377ed" stopOpacity=".65"/><stop offset="1" stopColor="#7b41b6" stopOpacity="0"/></radialGradient>
 <radialGradient id={id('gold')}><stop stopColor="#ffedc6" stopOpacity=".95"/><stop offset=".22" stopColor="#d7a15b" stopOpacity=".5"/><stop offset="1" stopColor="#cfaa74" stopOpacity="0"/></radialGradient>
 <linearGradient id={id('floor')} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#20152e" stopOpacity="0"/><stop offset=".25" stopColor="#533764" stopOpacity=".6"/><stop offset=".85" stopColor="#110e19" stopOpacity=".5"/><stop offset="1" stopColor="#21162b" stopOpacity="0"/></linearGradient>
 <filter id={id('blur')} x="-40%" y="-100%" width="180%" height="300%"><feGaussianBlur stdDeviation="11"/></filter>
 </defs>
 <path d="M-90 403C100 540 250 542 440 478C284 613 78 588-90 524Z" fill={url('sheen')} opacity=".58"/><path d="M-90 456C111 575 260 542 440 478" stroke={url('edge')} fill="none" strokeWidth="2"/>
 <path d="M1670 93C1473 282 1345 441 1395 489C1502 500 1599 361 1660 322Z" fill={url('sheen')}/><path d="M1660 100C1480 297 1341 438 1395 489" stroke={url('edge')} strokeWidth="3" fill="none"/>
 <rect y="556" width="1600" height="144" fill={url('floor')}/>
 <g filter={url('blur')}><ellipse cx="220" cy="593" rx="148" ry="24" fill={url('purple')}/><ellipse cx="925" cy="587" rx="182" ry="25" fill={url('purple')}/><ellipse cx="1090" cy="589" rx="164" ry="22" fill={url('gold')}/><ellipse cx="1270" cy="618" rx="236" ry="25" fill={url('purple')}/></g>
 {Array.from({length:12},(_,i)=><path key={i} d={'M'+(80+i*31)+' '+(594+i*5)+' Q790 '+(580+i*6)+' '+(1510-i*19)+' '+(600+i*5)} stroke={i%3===0?'#f8d6a0':'#b28cdc'} strokeOpacity={.11+(i%3)*.04} strokeWidth={i%3===0?1:2} fill="none"/>)}
 <path d="M-50 624 C410 600 672 838 1082 729 Q1400 632 1660 479 L1670 850H-70Z" fill={url('sheen')} opacity=".86"/><path d="M-50 624 C410 600 672 838 1082 729 Q1400 632 1660 479" fill="none" stroke={url('edge')} strokeWidth="3"/>
 <path d="M-65 664C422 623 625 856 1015 793" stroke={url('edge')} strokeWidth="1.5" strokeOpacity=".5" fill="none"/>
 </svg>
}
