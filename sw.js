// Sat Sri Akal — Service Worker
// Handles: PWA caching + daily 8PM IST ੴ Simran notification

const CACHE = 'sat-sri-akal-v5';
const ASSETS = ['./index.html', './manifest.json'];

// ── Install: cache core assets ──────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clear old caches ───────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
  scheduleDailySimran();
});

// ── Fetch: serve from cache, fallback to network ────────────────────────────
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// ── Notification click: open the app ────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow('./index.html');
    })
  );
});

// ── Message from app: reschedule if needed ───────────────────────────────────
self.addEventListener('message', e => {
  if (e.data === 'SCHEDULE_SIMRAN') scheduleDailySimran();
});

// ── Daily Simran Scheduler ───────────────────────────────────────────────────
// Fires every day at 20:00 IST (UTC+5:30 = 14:30 UTC)
function scheduleDailySimran() {
  const now = new Date();
  // Target: 20:00 IST = 14:30 UTC
  const target = new Date();
  target.setUTCHours(14, 30, 0, 0);

  // If 8 PM IST already passed today, schedule for tomorrow
  if (target <= now) target.setUTCDate(target.getUTCDate() + 1);

  const delay = target.getTime() - now.getTime();

  setTimeout(() => {
    fireSimranNotification();
    // Reschedule for next day
    setInterval(fireSimranNotification, 24 * 60 * 60 * 1000);
  }, delay);
}

function fireSimranNotification() {
  self.registration.showNotification('ੴ', {
    body: 'Satnam Waheguru 🙏',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'daily-simran',          // replaces itself, never stacks
    renotify: false,
    silent: false,
    vibrate: [200, 100, 200]
  });
}
