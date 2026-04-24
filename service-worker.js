const CACHE = 'hotel-ops-v1';
const ASSETS = [
    '/', '/index.html', '/styles.css', '/manifest.json',
    '/favicon.png', '/icon-192.png', '/icon-512.png',
    '/js/config.js', '/js/ui.js', '/js/rooms.js', '/js/forms.js',
    '/js/dashboard.js', '/js/tickets.js', '/js/auth.js', '/js/realtime.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ));
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.hostname.includes('supabase.co') ||
        url.hostname.includes('telegram.org') ||
        url.hostname.includes('jsdelivr.net') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('gstatic.com') ||
        url.hostname.includes('sentry.io') ||
        url.hostname.includes('vercel-insights') ||
        url.hostname.includes('vercel-scripts')) return;

    e.respondWith(
        caches.match(e.request).then((cached) =>
            cached || fetch(e.request).then((res) => {
                const copy = res.clone();
                caches.open(CACHE).then((c) => c.put(e.request, copy));
                return res;
            }).catch(() => cached)
        )
    );
});