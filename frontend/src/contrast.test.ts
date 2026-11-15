import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import tokens from './design-tokens.json';
import {contrast,semanticPairs} from './contrast';
describe('WCAG relative luminance regression',()=>{it('matches the black/white reference',()=>expect(contrast('#000000','#ffffff')).toBe(21));it.each(semanticPairs)('$component meets $threshold:1',({foreground,background,threshold})=>expect(contrast(foreground,background)).toBeGreaterThanOrEqual(threshold));it('rejects ivory text on bright violet or gold',()=>{expect(contrast(tokens.text,tokens.violet)).toBeLessThan(4.5);expect(contrast(tokens.text,tokens.gold)).toBeLessThan(4.5)});it('keeps CSS tokens synchronized with the source palette',()=>{const css=readFileSync(new URL('./theme.css',import.meta.url),'utf8');for(const [key,value]of Object.entries(tokens)){const name=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());expect(css).toContain(`--${name}:${value}`)}})});
