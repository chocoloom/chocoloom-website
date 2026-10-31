// Chocoloom Progressive Web App (PWA) Service Worker
const CACHE_NAME = 'chocoloom-cache-v1.0.0';
const PRECACHE_ASSETS = [
    './',
    './order.html',
    './index.html',
    './styles.css',
    './app.js',
    './data.js',
    './manifest.json',
    './assets/logo.png',
    './assets/icons/icon-192x192.png',
    './assets/icons/icon-512x512.png',
    './assets/icons/apple-touch-icon.png'
];

// Install Event - Pre-cache core shell assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[ServiceWorker] Pre-caching partial fail (will fetch on demand):', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate Event - Clean up outdated caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Stale-while-revalidate for assets, Network-first for navigation
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Only handle GET requests
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Bypass API / database sync requests from caching
    if (url.pathname.includes('/save_catalog') ||
        url.pathname.includes('/api/') ||
        url.hostname.includes('supabase.co') ||
        url.hostname.includes('neon.tech')) {
        return;
    }

    // HTML Navigation requests: Network first, fall back to cached HTML
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || caches.match('./order.html') || caches.match('./index.html');
                    });
                })
        );
        return;
    }

    // Static Assets (CSS, JS, Images, Fonts): Cache first, fallback to network
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                // Fetch in background to update cache (stale-while-revalidate)
                fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
                    }
                }).catch(() => {/* offline, ignore */});
                return cachedResponse;
            }

            return fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && request.url.startsWith(self.location.origin)) {
                    const copy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return networkResponse;
            }).catch(() => {
                // Asset offline fallback
                return new Response('Resource offline', { status: 503, statusText: 'Offline' });
            });
        })
    );
});
