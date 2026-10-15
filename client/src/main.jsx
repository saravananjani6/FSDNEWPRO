import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Aggressive cache purge for all outdated caches
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key !== 'vmcare-cache-v4-bust') {
        console.log('[PWA] Purging obsolete cache from client:', key);
        caches.delete(key);
      }
    });
  }).catch((e) => console.warn('[PWA] Cache purge warning:', e));
}

// Register Service Worker for PWA Offline Caching with instant reload on update
if ('serviceWorker' in navigator) {
  // If the service worker controller changes, reload the page immediately so the latest UI takes effect!
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered, scope:', reg.scope);
        // Force check for fresh sw.js
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
