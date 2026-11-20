/** Normalized stage transition: 0 hero, 1 source, 2 draft, 3 decision. */
export function loomBlend(progress:number){
 const p=Number.isFinite(progress)?Math.max(0,Math.min(3,progress)):0;
 const from=Math.min(2,Math.floor(p));
 const fraction=p-from;
 const mix=fraction*fraction*(3-2*fraction);
 return {from,to:from+1,mix};
}
export function loomProgress(scroll:number,anchors:readonly number[]){
 if(anchors.length!==4||!Number.isFinite(scroll)||anchors.some((a,i)=>!Number.isFinite(a)||(i>0&&a<=anchors[i-1])))return 0;
 if(scroll<=anchors[0])return 0;
 for(let i=0;i<3;i++)if(scroll<anchors[i+1])return i+(scroll-anchors[i])/(anchors[i+1]-anchors[i]);
 return 3;
}
export const loomStages=['Living Loom','Source','Draft','Decision'] as const;
