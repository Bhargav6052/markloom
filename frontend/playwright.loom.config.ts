import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'../tests/e2e',
 testMatch:'living-loom.spec.ts',
 timeout:60000,
 workers:1,
 use:{baseURL:'http://127.0.0.1:4180',browserName:'chromium',headless:true,launchOptions:{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}},
 webServer:{command:'pnpm exec vite preview --host 127.0.0.1 --port 4180 --strictPort',url:'http://127.0.0.1:4180',timeout:30000,reuseExistingServer:false},
 reporter:'list'
});
