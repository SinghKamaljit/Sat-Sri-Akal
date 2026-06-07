// Sat Sri Akal — Service Worker v8
// Strategy: Network-first for HTML, cache-first for everything else
// index.html is NEVER cached — always fetched fresh from network
// This ensures every update is immediately visible without manual refresh

const CACHE = 'sat-sri-akal-v9';
const NEVER_CACHE = ['index.html', '/Sat-Sri-Akal/', '/Sat-Sri-Akal/index.html'];

// ── Install: skip waiting immediately, take control ─────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting(); // activate immediately, don't wait
});

// ── Activate: wipe ALL old caches, claim all clients ────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k)))) // delete ALL
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({type:'window', includeUncontrolled:true}))
      .then(clients => clients.forEach(c => c.postMessage('SW_UPDATED')))
  );
  scheduleDailySimran();
});

// ── Fetch strategy ───────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = NEVER_CACHE.some(p => url.pathname.endsWith(p))
               || url.pathname === '/Sat-Sri-Akal/'
               || e.request.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // HTML — always network, never cache
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
  } else {
    // Everything else — cache first, fallback to network, then cache it
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          // Only cache valid responses
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return response;
        });
      })
    );
  }
});

// ── Notification click: open the app ────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow('./index.html');
    })
  );
});

// ── Message from app ─────────────────────────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data === 'SCHEDULE_SIMRAN') scheduleDailySimran();
});

// ── Daily Simran at 8 PM IST (14:30 UTC) ────────────────────────────────────
function scheduleDailySimran() {
  const now    = new Date();
  const target = new Date();
  target.setUTCHours(14, 30, 0, 0);
  if (target <= now) target.setUTCDate(target.getUTCDate() + 1);
  const delay = target.getTime() - now.getTime();
  setTimeout(() => {
    fireSimranNotification();
    setInterval(fireSimranNotification, 24 * 60 * 60 * 1000);
  }, delay);
}

function fireSimranNotification() {
  self.registration.showNotification('ੴ', {
    body: 'Satnam Waheguru 🙏',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'daily-simran',
    renotify: false,
    silent: false,
    vibrate: [200, 100, 200]
  });
}
