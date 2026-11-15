import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'node',env:{VITE_SUPABASE_URL:'',VITE_SUPABASE_PUBLISHABLE_KEY:''},include:['src/**/*.test.ts','src/**/*.test.tsx']}});
