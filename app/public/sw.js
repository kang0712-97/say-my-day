// 최소 서비스 워커: 앱 껍데기(화면·그림·아이콘)만 보관해 오프라인에서도 열린다. /api/* 는 절대 가로채지 않는다(번역·음성·저장은 항상 서버로).
const CACHE = 'smd-shell-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname === '/healthz') return;
  // 화면·스크립트: 인터넷이 되면 항상 새 것을 받고, 안 되면 보관본. 그림: 보관본 먼저.
  const isImg = /\.(webp|png)$/.test(url.pathname);
  if (isImg) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return res; })));
    return;
  }
  e.respondWith(fetch(req).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('/') : Response.error()))));
});
