import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import {initPWAInstallListener} from './hooks/usePWAInstall';
import App from './App.tsx';
import './index.css';

initPWAInstallListener();

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({immediate: true});
}

createRoot(document.getElementById('root')!).render(<App />);
