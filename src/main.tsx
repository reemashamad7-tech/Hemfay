import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Clear caches on startup to force reload of updated bundle assets
if (typeof window !== 'undefined' && 'caches' in window) {
  window.caches.keys().then((keys) => {
    keys.forEach((key) => window.caches.delete(key));
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for Progressive Web App offline caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        console.log('Hemafy PWA ServiceWorker successfully registered on scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Hemafy PWA ServiceWorker registration failed:', error);
      });
  });
}
