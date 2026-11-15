import {apiBase} from './runtime';
import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url,key,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}}) : null;
export {apiBase} from './runtime';
export async function api<T=any>(path:string, body?:unknown, form?:FormData):Promise<T>{
 const {data}=supabase ? await supabase.auth.getSession() : {data:{session:null}};
 const response=await fetch(apiBase+path,{signal:AbortSignal.timeout(45000),method:body!==undefined||form?'POST':'GET',headers:{...(data.session?{Authorization:`Bearer ${data.session.access_token}`} :{}),...(!form?{'Content-Type':'application/json'}:{})},body:form|| (body!==undefined?JSON.stringify(body):undefined)});
 if(!response.ok){const error=await response.json().catch(()=>({detail:'Request failed'}));throw new Error(typeof error.detail==='string'?error.detail:'Validation failed. Check your inputs.');}
 return response.json();
}
