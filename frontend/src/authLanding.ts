import {emailReturn} from './authLinks';
// Capture only non-secret status before the SDK consumes and removes the fragment.
export const initialEmailReturn=typeof location==='undefined'?emailReturn('',''):emailReturn(location.search,location.hash);
if(typeof location!=='undefined'&&initialEmailReturn.present&&location.pathname!=='/auth/callback')history.replaceState(null,'','/auth/callback'+location.search+location.hash);
