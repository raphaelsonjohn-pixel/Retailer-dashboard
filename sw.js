/* ════════════════════════════════════════════════════════════
   BOMAWAVE SERVICE WORKER v6
   Strategy:
   - App shell (index.html, app.js, fonts) → Cache First
   - Supabase API calls → Network First, fallback to cache
   - Images/QR → Cache First
   - Offline page fallback
════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'bomawave-v6';
const OFFLINE_URL = '/offline.html';

/* ─── Files to cache immediately on install ─── */
const APP_SHELL = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap',
];

/* ════════════════════════════════════════════════════════════
   INSTALL — cache app shell
════════════════════════════════════════════════════════════ */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL).catch(err => {
        console.warn('[SW] Failed to cache some files:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

/* ════════════════════════════════════════════════════════════
   ACTIVATE — clean up old caches
════════════════════════════════════════════════════════════ */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ════════════════════════════════════════════════════════════
   FETCH — routing logic
════════════════════════════════════════════════════════════ */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension, etc
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // ── Supabase API → Network First ──
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // ── QR code API → Cache First ──
  if (url.hostname.includes('qrserver.com')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Google Fonts → Cache First ──
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── App shell (HTML, JS, manifest) → Cache First, revalidate ──
  if (url.hostname === self.location.hostname) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // ── Everything else → Network First ──
  event.respondWith(networkFirst(request));
});

/* ════════════════════════════════════════════════════════════
   STRATEGIES
════════════════════════════════════════════════════════════ */

/* Network first — try network, fallback to cache */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // If it's a navigation request and we're offline
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/index.html');
      if (offlinePage) return offlinePage;
    }
    return new Response('{"error":"offline"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/* Cache first — return from cache, fetch if not found */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

/* Stale while revalidate — return cache immediately, update in background */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  }).catch(() => null);

  return cached || networkPromise || new Response('', { status: 503 });
}

/* ════════════════════════════════════════════════════════════
   BACKGROUND SYNC — sync offline POS sales
════════════════════════════════════════════════════════════ */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pos-sales') {
    event.waitUntil(syncPOSSales());
  }
});

async function syncPOSSales() {
  // Notify the active client to run syncOfflineData
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_POS_SALES' });
  });
}

/* ════════════════════════════════════════════════════════════
   PUSH NOTIFICATIONS
════════════════════════════════════════════════════════════ */
self.addEventListener('push', event => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'BomaWave', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || 'BomaWave', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
      actions: data.actions || [],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const existing = clients.find(c => c.url === url);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});

/* ════════════════════════════════════════════════════════════
   MESSAGES from app
════════════════════════════════════════════════════════════ */
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
