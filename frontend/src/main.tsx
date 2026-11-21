import './performance';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import {MotionProvider} from './MotionSettings';
import './styles.css';
import './public.css';
import './cinematic.css';
import './flow.css';
import './refined.css';
import './pile.css';
import './journey.css';
import './comfort.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><MotionProvider><App/></MotionProvider></BrowserRouter></React.StrictMode>);

import "./theme.css";
import "./saturn.css";
