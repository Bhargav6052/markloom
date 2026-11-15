import {test,expect} from '../../frontend/node_modules/@playwright/test';
test('workspace routes require real authentication',async({page})=>{
 await page.goto('/app/content');await expect(page.getByRole('heading',{name:'Welcome back'})).toBeVisible();
 await expect(page).toHaveURL(/\/login$/);
 await expect(page.getByLabel('Email',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Create account',exact:true}).click();await expect(page.getByRole('heading',{name:'Create your account'})).toBeVisible();
 await page.getByRole('button',{name:'Forgot password',exact:true}).click();await expect(page.getByRole('heading',{name:'Reset your password'})).toBeVisible();
});
test('mobile authentication controls fit viewport',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('/login');await expect(page.getByLabel('Email',{exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();await page.screenshot({path:'test-results/auth-mobile.png',fullPage:true});});
test('frontend origin reaches real backend and unauthenticated requests are denied',async({page})=>{await page.goto('/login');const status=await page.evaluate(async()=>{const res=await fetch('http://127.0.0.1:8000/health');return {code:res.status,health:await res.json()}});expect(status.code).toBe(200);expect(status.health.status).toBe('ok');const denied=await page.request.get('http://127.0.0.1:8000/api/me');expect(denied.status()).toBe(401);});
