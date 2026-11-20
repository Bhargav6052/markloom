import {test,expect} from '../../frontend/node_modules/@playwright/test';

test('desktop renders actual WebGL and follows source, draft and decision scroll stages',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:'Reject optional',exact:true}).click();
 await expect(page.getByRole('heading',{level:1})).toContainText('Proof behind');
 await expect(page.locator('.brand-logo-webgl canvas')).toBeVisible({timeout:25000});
 await expect(page.locator('.brand-logo-fallback')).toHaveClass(/is-rendered/,{timeout:25000});
 const logo=page.locator('.brand-logo-webgl');
 await expect(logo).toHaveAttribute('data-logo-motion','idle');
 const startYaw=Number(await logo.getAttribute('data-logo-yaw'));
 await expect.poll(async()=>Number(await logo.getAttribute('data-logo-yaw'))-startYaw).toBeGreaterThan(.025);
 await page.locator('.brand-hero').hover({position:{x:120,y:200}});
 await expect(logo).toHaveAttribute('data-logo-motion','cursor');
 await expect(logo).toHaveAttribute('data-logo-motion','idle',{timeout:5000});
 await page.screenshot({path:'test-results/signature-hero.png'});
 await page.locator('#loom-hero').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(page.locator('.loom-webgl canvas')).toBeVisible({timeout:25000});
 await expect(page.locator('.loom-fallback')).toHaveClass(/is-rendered/,{timeout:25000});
 await expect(page.getByRole('link',{name:'Sign in',exact:true})).toBeVisible();
 await expect(page.locator('.premiere-panel')).toHaveCount(3);
 await page.screenshot({path:'test-results/loom-desktop.png'});
 for(const [id,label] of [['source','Source'],['draft','Draft'],['decision','Decision']]){
  await page.locator('#'+id).evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
  await expect(page.locator('.loom-stage-caption strong')).toHaveText(label);
  await expect(page.locator('.loom-fallback')).toHaveClass(/is-rendered/);
  await page.screenshot({path:'test-results/loom-'+id+'.png'});
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});

test('reduced motion uses a static scene and preserves all stage links',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await page.getByRole('button',{name:'Reject optional',exact:true}).click();
 await expect(page.locator('.brand-logo-fallback svg')).toBeVisible();
 await expect(page.locator('.brand-logo-webgl canvas')).toHaveCount(0);
 await page.locator('#loom-hero').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(page.locator('.loom-fallback svg')).toBeVisible();
 await expect(page.locator('.loom-webgl canvas')).toHaveCount(0);
 await page.getByRole('navigation',{name:'Workflow stages'}).getByRole('link',{name:'02 Draft'}).click();
 await expect(page).toHaveURL(/#draft$/);
 await expect(page.locator('#draft-title')).toBeVisible();
 await expect(page.locator('.loom-stage-caption strong')).toHaveText('Draft');
 await page.screenshot({path:'test-results/loom-reduced.png'});
});

test('mobile has distinct static stage art with readable content and no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByRole('button',{name:'Reject optional',exact:true}).click();
 await expect(page.getByRole('heading',{level:1})).toBeVisible();
 await expect(page.locator('.loom-webgl canvas')).toHaveCount(0);
 await expect(page.locator('.brand-logo-webgl canvas')).toHaveCount(0);
 await expect(page.locator('.brand-logo-fallback svg')).toBeVisible();
 await expect(page.locator('.loom-mobile-art svg')).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/loom-mobile.png',fullPage:true});
});
