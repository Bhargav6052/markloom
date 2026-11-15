/** Email destinations come only from deployment configuration, never query input. */
export function authDestination(pageOrigin:string,configuredOrigin=''){
 const url=new URL(configuredOrigin||pageOrigin);
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(url.username||url.password||url.pathname!=='/'||url.search||url.hash||(!local&&url.protocol!=='https:')||!['https:','http:'].includes(url.protocol))throw new Error('The authentication website address must be an HTTPS origin.');
 return url.origin+'/auth/callback';
}
export function emailReturn(search:string,hash:string){
 const query=new URLSearchParams(search),fragment=new URLSearchParams(hash.replace(/^#/,''));
 const code=fragment.get('error_code')||query.get('error_code');
 const failed=!!(code||fragment.get('error')||query.get('error'));
 return {present:failed||fragment.has('access_token')||query.has('code'),recovery:fragment.get('type')==='recovery',error:failed?(code==='otp_expired'?'This email link has expired or has already been used. Request a new email, or sign in if you already confirmed your account.':'The email link could not be verified. Request a new email and open the most recent link.'):null};
}
