import {describe,it,expect} from 'vitest';
import {slideIndex} from './cinematicScroll';
describe('section slideshow navigation',()=>{
 it('reaches every panel in either direction, wrapping at both ends',()=>{expect([slideIndex(0,1),slideIndex(1,1),slideIndex(2,1)]).toEqual([1,2,0]);expect([slideIndex(0,-1),slideIndex(2,-1),slideIndex(1,-1)]).toEqual([2,1,0])});
});
