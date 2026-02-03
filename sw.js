// Bump the cache version when adding/removing assets
const CACHE_NAME = 'ucwgame-v2';
const ASSETS = [
  /* AUTO_GENERATED_ASSETS_START */

  './',
  'index.html',
  'style.css',
  'JS/mechanics.js',
  'JS/moves.js',
  'JS/secrets.js',
  'manifest.json',
  'images/69-Pin.png',
  'images/absolute-zero.png',
  'images/amazon-straddle.png',
  'images/atlas-hold.png',
  'images/ball-breaker.png',
  'images/belt.png',
  'images/body-lock.png',
  'images/breast-smother.png',
  'images/full-mount-control.png',
  'images/goddess-scissors.png',
  'images/grapevine-hold.png',
  'images/jaw-clamp.png',
  'images/queens-throne.png',
  'images/ring-bg.jpg',
  'images/sole-priority.png',
  'images/the-anaconda.png',
  'images/the-black-widow.png',
  'images/the-bulldozer.png',
  'images/the-conquerers-claim.png',
  'images/the-crucible.png',
  'images/the-crucifix.png',
  'images/the-crusher.png',
  'images/the-display.png',
  'images/the-gravity-well.png',
  'images/the-lockdown.png',
  'images/the-matriarch.png',
  'images/the-monolith.png',
  'images/the-pillager.png',
  'images/the-serpents-coil.png',
  'images/the-stockade.png',
  'images/the-throne-of-thorns.png',
  'images/the-venus-trap.png',
  'images/vice-grip.png',

/* AUTO_GENERATED_ASSETS_END */
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  // Activate worker immediately after installation
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => { if (k !== CACHE_NAME) return caches.delete(k); })
    )).then(() => self.clients.claim())
  );
});

// Helper: simple SVG fallback for missing images
function svgPlaceholder(text) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><rect width='100%' height='100%' fill='#111'/><text x='50%' y='50%' fill='#888' font-size='20' text-anchor='middle' dy='.3em'>${text}</text></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Navigation requests -> network first, fallback to cached index
  if (req.mode === 'navigate' || (req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(req).then((res) => {
        // Only cache successful navigation responses (status 200) and same-origin/basic responses
        if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
          try {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          } catch(e) { console.warn('Failed to cache navigation response', e); }
        }
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }

  // Images -> cache-first with SVG fallback
  if (req.destination === 'image') {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        // Only cache successful images; opaque responses (cross-origin) may be ok to cache too
        if (res && (res.ok || res.type === 'opaque')) {
          try {
            const rcopy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, rcopy));
          } catch(e) { console.warn('Failed to cache image', e); }
        }
        return res;
      }).catch(() => svgPlaceholder('Image unavailable')))
    );
    return;
  }

  // Other requests -> cache-first then network
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res && res.ok && (res.type === 'basic' || res.type === 'cors' || res.type === 'opaque')) {
        try { const copy = res.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)); } catch(e) { console.warn('Failed to cache fetch response', e); }
      }
      return res;
    }).catch(() => { /* network error */ }))
  );
});

// Allow skipWaiting via message
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
});