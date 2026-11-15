// Local browser diagnostics only: numeric timings in the DOM, never sent to analytics.
if(typeof window!=='undefined'&&window.location.pathname==='/'){
 const values:{fcp_ms?:number;lcp_ms?:number;cls:number}={cls:0};
 let maxSession=0;let session=0;let first=0;let last=0;
 const report=()=>{const nav=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;document.documentElement.dataset.inkloomPerformance=JSON.stringify({...values,dom_content_loaded_ms:nav?.domContentLoadedEventEnd||0,load_ms:nav?.loadEventEnd||0,js_transfer_bytes:performance.getEntriesByType('resource').filter(e=>e.name.split('?')[0].endsWith('.js')).reduce((n,e)=>n+(e as PerformanceResourceTiming).transferSize,0)})};
 try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.name==='first-contentful-paint')values.fcp_ms=Math.round(e.startTime);report()}).observe({type:'paint',buffered:true});
 new PerformanceObserver(list=>{for(const e of list.getEntries())values.lcp_ms=Math.round(e.startTime);report()}).observe({type:'largest-contentful-paint',buffered:true});
 new PerformanceObserver(list=>{for(const entry of list.getEntries()){const e=entry as PerformanceEntry&{value:number;hadRecentInput:boolean};if(e.hadRecentInput)continue;if(e.startTime-last<1000&&e.startTime-first<5000){session+=e.value}else{session=e.value;first=e.startTime}last=e.startTime;maxSession=Math.max(maxSession,session);values.cls=Number(maxSession.toFixed(4))}report()}).observe({type:'layout-shift',buffered:true})}catch{/* Unsupported browsers retain navigation diagnostics. */}
 window.addEventListener('load',()=>{report();setTimeout(report,1500)},{once:true});
 document.addEventListener('visibilitychange',report);
}
