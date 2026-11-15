import {useEffect,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {initialEmailReturn} from './authLanding';
import {supabase} from './api';
import {emailReturn} from './authLinks';
export default function AuthCallback(){
 const navigate=useNavigate();const [incoming]=useState(()=>initialEmailReturn.present?initialEmailReturn:emailReturn(location.search,location.hash));const [error,setError]=useState(incoming.error||'');const [checking,setChecking]=useState(!incoming.error);
 useEffect(()=>{let live=true;
 async function finish(){
  if(incoming.error){navigate('/auth/callback',{replace:true});return}
  try{if(!supabase)throw new Error('Sign-in is currently unavailable. Please contact support.');const {data,error}=await supabase.auth.getSession();if(!live)return;if(error)throw error;
   if(data.session){navigate(incoming.recovery?'/reset-password':'/app/dashboard',{replace:true});return}
   throw new Error('No verified session was received. If your email was confirmed, sign in with your email and password. Otherwise request a new confirmation email.');
  }catch(e){if(live){setError(e instanceof Error?e.message:'Email verification failed. Please try again.');navigate('/auth/callback',{replace:true})}}finally{if(live)setChecking(false)}
 }
 void finish();return()=>{live=false};
 },[incoming,navigate]);
 return <main className="auth panel"><Link to="/">← Markloom home</Link><p className="eyebrow">MARKLOOM / EMAIL VERIFICATION</p><h1>{checking?'Checking your email link':'Continue to your account'}</h1>{checking?<p role="status">Verifying your session…</p>:<><p role="alert" className="error">{error}</p><div className="actions"><Link className="button" to="/login">Sign in</Link><Link className="button secondary" to="/resend-confirmation">Send a new confirmation</Link><Link to="/forgot-password">Request a password reset</Link></div><p className="muted">Opening a link on a phone requires a publicly reachable website. A localhost address only works on the computer running Markloom.</p></>}</main>
}
