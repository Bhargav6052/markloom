import * as THREE from 'three';

/** One continuous sculptural M, swept as a rounded, gently twisted flat glass ribbon. */
export function createMarkloomRibbon(){
 const v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
 const curve=new THREE.CurvePath<THREE.Vector3>();
 const line=(a:THREE.Vector3,b:THREE.Vector3)=>curve.add(new THREE.LineCurve3(a,b));
 const bend=(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,d:THREE.Vector3)=>curve.add(new THREE.CubicBezierCurve3(a,b,c,d));
 const a=v(-1.63,-.98,.27),b=v(-1.28,.63,-.18),c=v(-.76,.72,-.08),d=v(-.18,-.18,.30),e=v(.37,-.08,.26),f=v(.86,.85,-.16),g=v(1.42,.76,-.19),h=v(1.65,-.98,.24);
 line(a,b);bend(b,v(-1.17,1.12,-.27),v(-1.04,1.13,-.25),c);line(c,d);
 bend(d,v(.01,-.49,.43),v(.20,-.39,.39),e);line(e,f);
 bend(f,v(1.08,1.27,-.24),v(1.35,1.28,-.29),g);line(g,h);
 const steps=150,sides=24,positions:number[]=[],indices:number[]=[],profiles:number[]=[];
 const axis=new THREE.Vector3(0,0,1);
 for(let i=0;i<=steps;i++){
  const t=i/steps,center=curve.getPointAt(t),tangent=curve.getTangentAt(t).normalize();
  const width=new THREE.Vector3().crossVectors(axis,tangent).normalize();
  const depth=new THREE.Vector3().crossVectors(tangent,width).normalize();
  // The glass folds from a broad face into a narrow edge at each turn.
  const twist=.48+.46*Math.sin(t*Math.PI*2-.5);
  width.applyAxisAngle(tangent,twist);depth.applyAxisAngle(tangent,twist);
  const halfWidth=.23+.045*Math.sin(Math.PI*t),halfDepth=.075;
  const taper=.35+.65*Math.sin(Math.PI/2*Math.min(1,Math.min(t,1-t)*34));
  for(let j=0;j<sides;j++){
   const a=j/sides*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
   const u=Math.sign(c)*Math.pow(Math.abs(c),.48)*halfWidth*taper;
   const v=Math.sign(s)*Math.pow(Math.abs(s),.48)*halfDepth*taper;
   const p=center.clone().addScaledVector(width,u).addScaledVector(depth,v);
   positions.push(p.x,p.y,p.z);profiles.push(t,c,s);
   if(i<steps){const A=i*sides+j,B=i*sides+(j+1)%sides,C=A+sides,D=B+sides;indices.push(A,B,C,B,D,C)}
  }
 }
 // Closed solid with separately indexed cap fans.
 const first=positions.length/3,begin=curve.getPointAt(0),finish=curve.getPointAt(1);
 positions.push(begin.x,begin.y,begin.z,finish.x,finish.y,finish.z);profiles.push(0,0,0,1,0,0);
 for(let j=0;j<sides;j++){const k=(j+1)%sides;indices.push(first,k,j,first+1,steps*sides+j,steps*sides+k)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('ribbonProfile',new THREE.Float32BufferAttribute(profiles,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
