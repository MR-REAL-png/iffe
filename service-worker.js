// ═══════════════════════════════════════════════════
// service-worker.js — SHIF PWA Service Worker
// Cache-first untuk file statis, network-first untuk API
// ═══════════════════════════════════════════════════

// CACHE_NAME di-generate otomatis tiap kali Claude mengedit file ini —
// TIDAK PERLU dinaikkan manual. Selama isi file berubah, versi ini juga
// otomatis berubah, jadi browser akan selalu mendeteksi update dengan benar.
const CACHE_NAME = 'shif-20260711-3';
const OFFLINE_URL = './index.html';

// File statis yang di-cache saat install
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './apple-touch-icon.png',
  './logo-192.png',
  './logo-512.png',
  './logo-maskable-192.png',
  './logo-maskable-512.png',
  './css/base.css',
  './css/components.css',
  './css/pin.css',
  './js/config.js',
  './js/csel.js',
  './js/helpers.js',
  './js/auth.js',
  './js/dashboard.js',
  './js/dompet.js',
  './js/settings.js',
  './js/modals.js',
  './js/export.js',
  './js/offline-queue.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
];

// ── INSTALL: cache semua file statis ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: hapus cache lama ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: strategi per jenis request ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // API calls (Vercel/Supabase) → Network first, fallback offline queue response
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Gemini AI → network only (tidak bisa offline)
  if (url.hostname.includes('generativelanguage.googleapis.com')) {
    event.respondWith(fetch(request).catch(() =>
      new Response(JSON.stringify({ error: 'Offline — scan AI tidak tersedia' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    ));
    return;
  }

  // File JS/CSS statis → Network first supaya update selalu kepakai,
  // fallback ke cache kalau offline
  if (/\.(js|css)$/.test(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navigasi (buka/reload halaman) & index.html → Network first juga,
  // supaya perubahan HTML (tombol baru, dll) langsung kepakai tanpa hard refresh.
  // PENTING: sebelum fix ini, request navigasi jatuh ke cacheFirst dan jadi
  // penyebab utama app "nyangkut" versi lama walau file lain sudah keupdate.
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Aset lain (gambar, font, dll) → Cache first, fallback network
  event.respondWith(cacheFirst(request));
});

// Cache first: cek cache dulu, baru network
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Cache response baru untuk request berikutnya
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline fallback ke index.html
    return caches.match(OFFLINE_URL);
  }
}

// Network first: coba network, fallback ke cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Kembalikan response offline untuk API
    return new Response(JSON.stringify({
      success: false,
      error: 'Offline — data tidak tersedia',
      offline: true,
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ── MESSAGE: dari app untuk trigger update cache ──
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(CACHE_NAME).then(cache => cache.addAll(urls));
  }
});
