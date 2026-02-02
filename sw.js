const CACHE_NAME = 'ucwgame-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/JS/mechanics.js',
  '/JS/moves.js',
  '/JS/secrets.js',
  '/manifest.json',
  '/images/ring-bg.jpg',
  '/images/belt.png'
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
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Images -> cache-first with SVG fallback
  if (req.destination === 'image') {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const rcopy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, rcopy));
        return res;
      }).catch(() => svgPlaceholder('Image unavailable')))
    );
    return;
  }

  // Other requests -> cache-first then network
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      try { caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone())); } catch(e){}
      return res;
    }))
  );
});

// Allow skipWaiting via message
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
});