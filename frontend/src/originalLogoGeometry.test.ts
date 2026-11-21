import {describe,it,expect} from 'vitest';
import {originalLogoGeometry} from './originalLogoGeometry';
describe('original ribbon logo extrusion',()=>{
 it('has real beveled thickness and separate artwork / glass side surfaces',()=>{const {geometry,edges}=originalLogoGeometry();geometry.computeBoundingBox();const bounds=geometry.boundingBox!;expect(bounds.max.z-bounds.min.z).toBeGreaterThan(.12);expect(bounds.max.z-bounds.min.z).toBeLessThan(.2);expect(bounds.max.x-bounds.min.x).toBeGreaterThan(2.5);expect(new Set(geometry.groups.map(group=>group.materialIndex))).toEqual(new Set([0,1]));geometry.dispose();edges.forEach(edge=>edge.dispose())});
 it('produces finite mesh positions, normals and normalized artwork UVs',()=>{const {geometry,edges}=originalLogoGeometry();for(const name of ['position','normal','uv'])expect(Array.from(geometry.getAttribute(name).array).every(Number.isFinite)).toBe(true);const uv=Array.from(geometry.getAttribute('uv').array);expect(Math.min(...uv)).toBeGreaterThanOrEqual(0);expect(Math.max(...uv)).toBeLessThanOrEqual(1);geometry.dispose();edges.forEach(edge=>edge.dispose())});
});
