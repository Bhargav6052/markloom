import GlobalBrandWatermark from './GlobalBrandWatermark';
import {PublicMotionSettings} from './MotionSettings';
import {Component,Suspense,lazy,type ReactNode} from 'react';
import {Routes,Route,useLocation} from 'react-router-dom';
import Landing from './LiquidLanding';
import PublicPrivacy from './PublicPrivacy';
import Terms from './Terms';
import Contact from './Contact';
import NotFound from './NotFound';
import ConsentBanner from './Consent';
import Seo from './Seo';
import RouteMotion from './RouteMotion';
import ButtonFeedback from './ButtonFeedback';
import './authLanding';
import {AuthEnvironment,GlobalBackToTop} from './PlatformPresentation';
const PublicExperience=lazy(()=>import('./PublicExperience'));
const BrowserAudit=import.meta.env.DEV&&new URLSearchParams(location.search).has('__audit')?lazy(()=>import('./BrowserAudit')):null;
const AuthCallback=lazy(()=>import('./AuthCallback'));
const Workspace=lazy(()=>import('./Workspace'));
const Auth=lazy(()=>import('./Auth'));
class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true}};
 render(){return this.state.failed?<div className="auth panel" role="alert"><h1>This page could not load</h1><p>Reload to try again. Your saved workspace records are preserved.</p><a href="/">Return home</a></div>:this.props.children}
}
function SkipToContent(){const {pathname}=useLocation();return ['/', '/how-it-works','/our-principles','/product-tour'].includes(pathname)?null:<a className="skip-link" href="#main-content">Skip to content</a>}
export default function App(){return <ErrorBoundary><SkipToContent/><Seo/><RouteMotion/><ButtonFeedback/><PublicMotionSettings/><ConsentBanner/><GlobalBackToTop/><Suspense fallback={<div className="auth" role="status">Loading Markloom…</div>}><AppRoutes/>{BrowserAudit&&<BrowserAudit/>}</Suspense><GlobalBrandWatermark/></ErrorBoundary>}
function AppRoutes(){return <Routes><Route path="/auth/callback" element={<AuthCallback/>}/><Route path="/" element={<Landing/>}/><Route path="/how-it-works" element={<PublicExperience/>}/><Route path="/our-principles" element={<PublicExperience/>}/><Route path="/product-tour" element={<PublicExperience/>}/><Route path="/contact" element={<Contact/>}/><Route path="/terms" element={<Terms/>}/><Route path="/privacy" element={<PublicPrivacy/>}/><Route path="/login" element={<AuthEnvironment><Auth initialMode="login"/></AuthEnvironment>}/><Route path="/signup" element={<AuthEnvironment><Auth initialMode="signup"/></AuthEnvironment>}/><Route path="/resend-confirmation" element={<AuthEnvironment><Auth initialMode="verify"/></AuthEnvironment>}/><Route path="/forgot-password" element={<AuthEnvironment><Auth initialMode="forgot"/></AuthEnvironment>}/><Route path="/reset-password" element={<AuthEnvironment><Auth recovery/></AuthEnvironment>}/><Route path="/app/*" element={<Workspace/>}/><Route path="*" element={<NotFound/>}/></Routes>}
