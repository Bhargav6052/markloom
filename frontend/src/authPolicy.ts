import type {PublicConfig} from './runtime';

export function captchaPolicy(config:PublicConfig|null,productionBuild:boolean,pageOrigin:string,apiOrigin:string){
 const loopback=(hostname:string)=>['localhost','127.0.0.1','[::1]','::1'].includes(hostname);
 let localDevelopment=false;
 try{localDevelopment=config?.deployment_environment==='development'&&loopback(new URL(pageOrigin).hostname)&&loopback(new URL(apiOrigin||pageOrigin,pageOrigin).hostname)}catch{/* Unknown origins cannot qualify as a local preview. */}
 return {localDevelopment,required:!!(config?.bot_protection_required||config?.turnstile_site_key||(productionBuild&&!localDevelopment))};
}
