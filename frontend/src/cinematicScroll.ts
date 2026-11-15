export function cinematicScroll(id:string){
 const root=document.querySelector<HTMLElement>('.landing');const target=document.getElementById(id);if(!target)return;
 const reduced=document.documentElement.dataset.interfaceMotion==='static'||matchMedia('(prefers-reduced-motion: reduce)').matches||root?.dataset.interfaceMotion==='static';
 const request=new CustomEvent('inkloom:scroll',{detail:{id},cancelable:true});
 if(!reduced&&root&&!root.dispatchEvent(request))return;
 if(id==='main-content')window.scrollTo({top:0,behavior:reduced?'instant':'smooth'});else target.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
}
export function slideIndex(index:number,direction:number,total=3){return ((index+direction)%total+total)%total}
