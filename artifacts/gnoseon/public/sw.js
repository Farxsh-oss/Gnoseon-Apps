/**
 * Service Worker for Gnōseōn application
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'gnoseon-v2';
const STATIC_CACHE = 'gnoseon-static-v2';
const API_CACHE = 'gnoseon-api-v2';

// Assets to cache on install
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((error) => console.error('SW install failed:', error))
  );
});

// Activate event - clean up ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames.map((cacheName) => {
          // Delete ALL old caches to force fresh content
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch event - pass through everything, no caching of HTML or JS
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept Vite dev server requests, HMR, or module requests
  if (url.pathname.startsWith('/@') || 
      url.pathname.startsWith('/node_modules') ||
      url.pathname.startsWith('/src') ||
      url.pathname === '/' ||
      url.pathname === '/index.html' ||
      url.pathname.endsWith('.tsx') ||
      url.pathname.endsWith('.ts') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.mjs') ||
      url.pathname.endsWith('.css') ||
      url.protocol === 'ws:' ||
      url.protocol === 'wss:') {
    return; // Let the request pass through normally
  }

  // For API requests, network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // For everything else, network-first with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
