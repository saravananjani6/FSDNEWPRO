const CACHE_NAME = 'vmcare-cache-v4-bust';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/audio/en/fever.mp3',
  '/audio/en/cough.mp3',
  '/audio/en/breathing.mp3',
  '/audio/en/chest_pain.mp3',
  '/audio/en/severe_bleeding.mp3',
  '/audio/en/unconscious.mp3',
  '/audio/en/headache.mp3',
  '/audio/en/vomiting.mp3',
  '/audio/en/diarrhea.mp3',
  '/audio/en/abdominal_pain.mp3',
  '/audio/en/dizziness.mp3',
  '/audio/en/injury.mp3',
  '/audio/en/emergency_alert.mp3',
  '/audio/en/urgent_alert.mp3',
  '/audio/en/non_urgent_alert.mp3',
  '/audio/en/senior_welcome.mp3',
  '/audio/en/senior_yes_registered.mp3',
  '/audio/en/senior_no_registered.mp3',
  '/audio/en/senior_bodymap_intro.mp3',
  '/audio/en/senior_emergency_sos.mp3',
  '/audio/ta/fever.mp3',
  '/audio/ta/cough.mp3',
  '/audio/ta/breathing.mp3',
  '/audio/ta/chest_pain.mp3',
  '/audio/ta/severe_bleeding.mp3',
  '/audio/ta/unconscious.mp3',
  '/audio/ta/headache.mp3',
  '/audio/ta/vomiting.mp3',
  '/audio/ta/diarrhea.mp3',
  '/audio/ta/abdominal_pain.mp3',
  '/audio/ta/dizziness.mp3',
  '/audio/ta/injury.mp3',
  '/audio/ta/emergency_alert.mp3',
  '/audio/ta/urgent_alert.mp3',
  '/audio/ta/non_urgent_alert.mp3',
  '/audio/ta/senior_welcome.mp3',
  '/audio/ta/senior_yes_registered.mp3',
  '/audio/ta/senior_no_registered.mp3',
  '/audio/ta/senior_bodymap_intro.mp3',
  '/audio/ta/senior_emergency_sos.mp3'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets for VMcare v4');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Pre-cache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Deleting outdated/stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Force reload all open windows so the updated UI renders immediately
      return self.clients.matchAll({ type: 'window' });
    }).then((clients) => {
      clients.forEach((client) => {
        try {
          client.navigate(client.url);
        } catch (e) {
          console.warn('[Service Worker] Client navigate error:', e);
        }
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NEVER intercept API calls, dev modules, or Vite HMR endpoints
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('node_modules') ||
    url.pathname.includes('vite') ||
    event.request.method !== 'GET'
  ) {
    return; // Pass through to network
  }

  // 2. For HTML navigation requests, return network first, falling back to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 3. For static assets (audio, icons, fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-while-revalidate
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        if (event.request.destination === 'audio') {
          return caches.match('/audio/en/fever.mp3');
        }
        return null;
      });
    })
  );
});
