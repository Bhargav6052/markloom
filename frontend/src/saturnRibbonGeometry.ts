import * as THREE from 'three';

/** One continuous sculptural M, swept as a rounded, gently twisted flat glass ribbon. */
export function createMarkloomRibbon(){
 const points=[[-1.57,-.98,.22],[-1.38,-.15,.02],[-1.13,.91,-.19],[-.92,1.02,-.14],[-.64,.64,.02],[-.11,-.03,.29],[.02,-.18,.33],[.19,.03,.25],[.78,.92,-.15],[1.05,1.14,-.21],[1.26,.92,-.07],[1.48,-.12,.12],[1.61,-.98,.29]].map(p=>new THREE.Vector3(...p as [number,number,number]));
 const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
 const steps=150,sides=24,positions:number[]=[],indices:number[]=[];
 const axis=new THREE.Vector3(0,0,1);
 for(let i=0;i<=steps;i++){
  const t=i/steps,center=curve.getPointAt(t),tangent=curve.getTangentAt(t).normalize();
  const width=new THREE.Vector3().crossVectors(axis,tangent).normalize();
  const depth=new THREE.Vector3().crossVectors(tangent,width).normalize();
  // The glass folds from a broad face into a narrow edge at each turn.
  const twist=.38*Math.cos(t*Math.PI*4)+.13*Math.sin(t*Math.PI*2);
  width.applyAxisAngle(tangent,twist);depth.applyAxisAngle(tangent,twist);
  const halfWidth=.255+.040*Math.sin(Math.PI*t),halfDepth=.093;
  const taper=.76+.24*Math.min(1,Math.min(t,1-t)*28);
  for(let j=0;j<sides;j++){
   const a=j/sides*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
   const u=Math.sign(c)*Math.pow(Math.abs(c),.48)*halfWidth*taper;
   const v=Math.sign(s)*Math.pow(Math.abs(s),.48)*halfDepth*taper;
   const p=center.clone().addScaledVector(width,u).addScaledVector(depth,v);
   positions.push(p.x,p.y,p.z);
   if(i<steps){const A=i*sides+j,B=i*sides+(j+1)%sides,C=A+sides,D=B+sides;indices.push(A,B,C,B,D,C)}
  }
 }
 // Closed solid with separately indexed cap fans.
 const first=positions.length/3,begin=curve.getPointAt(0),finish=curve.getPointAt(1);
 positions.push(begin.x,begin.y,begin.z,finish.x,finish.y,finish.z);
 for(let j=0;j<sides;j++){const k=(j+1)%sides;indices.push(first,k,j,first+1,steps*sides+j,steps*sides+k)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
