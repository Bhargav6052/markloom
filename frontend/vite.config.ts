import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {siteBuildPlugin,validatePublicEnv} from './scripts/site-build.mjs';
export default defineConfig(({mode})=>{const publicEnvNames=['VITE_API_URL','VITE_SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY','VITE_SITE_URL'];const env=loadEnv(mode,process.cwd(),publicEnvNames);validatePublicEnv(env);return {envPrefix:publicEnvNames,plugins:[react(),tailwindcss(),siteBuildPlugin(env)],build:{sourcemap:false},server:{host:'127.0.0.1'}}});
