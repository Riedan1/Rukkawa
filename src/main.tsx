import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const swUrl = `${(import.meta as any).env?.BASE_URL || '/'}sw.js`;

// Register Service Worker for offline PWA support and caching
if ('serviceWorker' in navigator && ((import.meta as any).env?.PROD || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'))) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl).then(
      (registration) => {
        console.log('ServiceWorker registered successfully with scope:', registration.scope);
      },
      (err) => {
        console.warn('ServiceWorker registration failed:', err);
      }
    );
  });
} else if ('serviceWorker' in navigator) {
  // Also register in dev mode for testing offline functionality
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

