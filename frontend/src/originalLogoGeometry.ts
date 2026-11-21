import {CatmullRomCurve3,ExtrudeGeometry,Path,Shape,TubeGeometry,Vector2,Vector3,type UVGenerator} from 'three';
import outline from './logoShape.json';
/** Silhouette and face UVs come from the supplied ribbon artwork, not a font or generic M. */
export function originalLogoGeometry(){
 const shape=new Shape(outline.outer.map(([x,y])=>new Vector2(x,y)));
 const holes:number[][][]=outline.holes;holes.forEach(loop=>shape.holes.push(new Path(loop.map(([x,y])=>new Vector2(x,y)))));
 const uv=(vertices:number[],index:number)=>new Vector2(vertices[index*3]/outline.width+.5,vertices[index*3+1]/outline.height+.5);
 const UVGenerator:UVGenerator={generateTopUV:(_geometry,vertices,a,b,c)=>[uv(vertices,a),uv(vertices,b),uv(vertices,c)],generateSideWallUV:()=>[new Vector2(0,0),new Vector2(1,0),new Vector2(1,1),new Vector2(0,1)]};
 const geometry=new ExtrudeGeometry(shape,{depth:.12,steps:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.018,bevelSegments:3,UVGenerator});geometry.translate(0,0,-.06);
 const edges=[-.075,.075].map(z=>new TubeGeometry(new CatmullRomCurve3(outline.outer.map(([x,y])=>new Vector3(x,y,z)),true,'centripetal'),240,.005,5,true));
 return {geometry,edges};
}
