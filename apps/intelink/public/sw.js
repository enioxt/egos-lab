/**
 * Intelink Service Worker
 * Enables offline-first experience for police intelligence app
 * 
 * @version 1.0.0
 * @updated 2025-12-12
 */

const CACHE_NAME = 'intelink-v3';
const STATIC_CACHE = 'intelink-static-v3';
const DATA_CACHE = 'intelink-data-v3';

// Critical resources to cache immediately
const PRECACHE_URLS = [
  '/',
  '/login',
  '/central',
  '/offline',
  '/manifest.json',
];

// API routes to cache with network-first strategy
const API_ROUTES = [
  '/api/investigation/',
  '/api/search',
  '/api/graph/',
];

// ============================================================================
// INSTALL - Precache critical resources
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================================================
// ACTIVATE - Clean old caches
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE && name !== DATA_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ============================================================================
// FETCH - Smart caching strategies
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external requests
  if (!url.origin.includes(self.location.origin)) return;
  
  // NEVER cache auth-related routes - always go to network
  if (url.pathname.startsWith('/api/v2/auth') || 
      url.pathname.startsWith('/api/auth') ||
      url.pathname === '/login' ||
      url.pathname === '/logout') {
    return; // Let browser handle normally (no caching)
  }
  
  // NEVER cache Next.js chunks - they change frequently and cause HMR issues
  if (url.pathname.startsWith('/_next/static/chunks/') ||
      url.pathname.startsWith('/_next/static/webpack/')) {
    return; // Let browser handle normally (no caching)
  }
  
  // API requests: Network-first, fallback to cache
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(networkFirstWithCache(request, DATA_CACHE));
    return;
  }
  
  // Static assets: Cache-first
  if (request.destination === 'image' || 
      request.destination === 'font' ||
      url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // Pages: Network-first for fresh content
  event.respondWith(networkFirstWithCache(request, CACHE_NAME));
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Network-first: Try network, fallback to cache, then offline page
 */
async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a page request, show offline page
    if (request.destination === 'document') {
      return caches.match('/offline');
    }
    
    // Return error for API requests
    return new Response(
      JSON.stringify({ error: 'Offline', offline: true }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Cache-first: Try cache, fallback to network
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url);
    return new Response('', { status: 404 });
  }
}

// ============================================================================
// BACKGROUND SYNC (for pending actions when offline)
// ============================================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  console.log('[SW] Syncing pending actions...');
  // Future: sync queued mutations when back online
}

// ============================================================================
// PUSH NOTIFICATIONS (Future feature)
// ============================================================================
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Intelink', {
      body: data.body || 'Nova atualização',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data.url || '/',
      tag: data.tag || 'default',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

console.log('[SW] Service Worker loaded');
