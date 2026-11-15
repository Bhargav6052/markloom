import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {siteBuildPlugin,validatePublicEnv} from './scripts/site-build.mjs';
export default defineConfig(({mode})=>{const env=loadEnv(mode,process.cwd(),'VITE_');validatePublicEnv(env);return {plugins:[react(),tailwindcss(),siteBuildPlugin(env)],build:{sourcemap:false},server:{host:'127.0.0.1'}}});
