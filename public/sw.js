/**
 * Service Worker for Gnōseōn application
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'gnoseon-v1';
const STATIC_CACHE = 'gnoseon-static-v1';
const API_CACHE = 'gnoseon-api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/logo.png',
  '/assets/contacts.png',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/user/profile',
  '/api/contacts',
  '/api/messages',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('Service Worker: Activation failed:', error);
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default: try network first, then cache
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle API requests with caching strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // GET requests: cache first, then network
  if (request.method === 'GET') {
    try {
      // Try cache first
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Update cache in background
        fetch(request).then(async (networkResponse) => {
          if (networkResponse.ok) {
            const apiCache = await caches.open(API_CACHE);
            apiCache.put(request, networkResponse.clone());
          }
        });
        return cachedResponse;
      }

      // Try network
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const apiCache = await caches.open(API_CACHE);
        apiCache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (error) {
      console.error('Service Worker: API request failed:', error);
    }
  }

  // POST/PUT/DELETE requests: network only with offline fallback
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Network request failed, queuing for later:', error);
    
    // For failed requests, return a custom offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Request queued for when online',
        queued: true,
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Handle static assets with cache first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const staticCache = await caches.open(STATIC_CACHE);
      staticCache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.error('Service Worker: Static request failed:', error);
  }

  // Return offline fallback
  return new Response('Offline', { status: 503 });
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const staticCache = await caches.open(STATIC_CACHE);
      staticCache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.error('Service Worker: Navigation request failed:', error);
  }

  // Return offline page
  return caches.match('/index.html');
}

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

// Perform background sync
async function performBackgroundSync() {
  try {
    // Get offline queue from IndexedDB
    const queue = await getOfflineQueue();
    
    // Process queued requests
    for (const item of queue) {
      try {
        const response = await fetch(item.url, item.options);
        if (response.ok) {
          await removeFromQueue(item.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync item:', error);
      }
    }
    
    console.log('Service Worker: Background sync complete');
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data?.text() || 'New message',
    icon: '/assets/logo.png',
    badge: '/assets/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore this new world',
        icon: '/images/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/images/xmark.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('Gnōseōn', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle message from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Utility functions for IndexedDB operations
async function getOfflineQueue() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gnoseon-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offline-data'], 'readonly');
      const store = transaction.objectStore('offline-data');
      const getRequest = store.get('offline-action-queue');
      
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => resolve(getRequest.result?.data || []);
    };
  });
}

async function removeFromQueue(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gnoseon-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offline-data'], 'readwrite');
      const store = transaction.objectStore('offline-data');
      const getRequest = store.get('offline-action-queue');
      
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const queue = getRequest.result?.data || [];
        const updatedQueue = queue.filter(item => item.id !== id);
        
        const putRequest = store.put({
          id: 'offline-action-queue',
          data: updatedQueue,
          timestamp: Date.now(),
        });
        
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      };
    };
  });
}

// Cleanup old caches periodically
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    event.waitUntil(cleanupCache());
  }
});

async function cleanupCache() {
  try {
    const cacheNames = await caches.keys();
    const currentCaches = [STATIC_CACHE, API_CACHE];
    
    await Promise.all(
      cacheNames
        .filter(cacheName => !currentCaches.includes(cacheName))
        .map(cacheName => caches.delete(cacheName))
    );
    
    console.log('Service Worker: Cache cleanup complete');
  } catch (error) {
    console.error('Service Worker: Cache cleanup failed:', error);
  }
}
