const C = 'bookshelf-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C).then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {}))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

// アプリ本体とスキャナライブラリのみキャッシュ。書誌APIは常にネットワークへ。
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin && u.hostname !== 'cdn.jsdelivr.net') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request)
        .then(r => {
          if (r.ok) {
            const cp = r.clone();
            caches.open(C).then(c => c.put(e.request, cp));
          }
          return r;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
