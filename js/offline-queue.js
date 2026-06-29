// ═══════════════════════════════════════════════════
// offline-queue.js — SHIF Offline Queue
// Simpan transaksi ke IndexedDB saat offline
// Sync otomatis ke server saat online kembali
// ═══════════════════════════════════════════════════

const OQ_DB_NAME    = 'shif-offline';
const OQ_DB_VERSION = 1;
const OQ_STORE      = 'pending_transactions';

// ── BUKA IndexedDB ──
function oqOpenDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OQ_DB_NAME, OQ_DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(OQ_STORE)) {
        const store = db.createObjectStore(OQ_STORE, {
          keyPath: 'id', autoIncrement: true
        });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

// ── TAMBAH KE ANTRIAN ──
async function oqAdd(data) {
  const db = await oqOpenDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(OQ_STORE, 'readwrite');
    const store = tx.objectStore(OQ_STORE);
    const req   = store.add({ ...data, createdAt: Date.now(), status: 'pending' });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = e => reject(e.target.error);
  });
}

// ── AMBIL SEMUA PENDING ──
async function oqGetAll() {
  const db = await oqOpenDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(OQ_STORE, 'readonly');
    const store = tx.objectStore(OQ_STORE);
    const req   = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = e => reject(e.target.error);
  });
}

// ── HAPUS DARI ANTRIAN ──
async function oqDelete(id) {
  const db = await oqOpenDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(OQ_STORE, 'readwrite');
    const store = tx.objectStore(OQ_STORE);
    const req   = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

// ── JUMLAH PENDING ──
async function oqCount() {
  const db = await oqOpenDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(OQ_STORE, 'readonly');
    const store = tx.objectStore(OQ_STORE);
    const req   = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = e => reject(e.target.error);
  });
}

// ── SYNC KE SERVER ──
async function oqSync() {
  if (!navigator.onLine) return;
  const items = await oqGetAll();
  if (!items.length) return;

  let syncedCount = 0;
  let failCount = 0;

  for (const item of items) {
    try {
      const res = await fetch(`${API_URL}/api/sheets?action=append`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
      if (res.ok) {
        await oqDelete(item.id);
        syncedCount++;
      } else {
        failCount++;
      }
    } catch {
      failCount++;
    }
  }

  if (syncedCount > 0) {
    toast(`${syncedCount} transaksi offline berhasil disinkron ✓`, 'ok');
    allRows = [];
    await fetchDBOptions();
    await loadDashboard();
    updateOfflineBadge();
  }
  if (failCount > 0) {
    console.warn(`[oq] ${failCount} transaksi gagal sync`);
  }
}

// ── UPDATE BADGE OFFLINE DI UI ──
async function updateOfflineBadge() {
  const count = await oqCount();
  const badge = document.getElementById('offlineBadge');
  if (badge) {
    badge.textContent = count > 0 ? `${count} pending` : '';
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }
  // Update status bar
  const statusBar = document.getElementById('offlineStatusBar');
  if (statusBar) {
    if (!navigator.onLine) {
      statusBar.style.display = 'flex';
      statusBar.innerHTML = `
        <span>📵 Mode Offline${count > 0 ? ` · ${count} transaksi pending` : ''}</span>
      `;
    } else if (count > 0) {
      statusBar.style.display = 'flex';
      statusBar.innerHTML = `
        <span>🔄 Menyinkron ${count} transaksi...</span>
      `;
    } else {
      statusBar.style.display = 'none';
    }
  }
}

// ── INIT: listen online/offline events ──
function initOfflineQueue() {
  // Cek status awal
  updateOfflineBadge();

  // Saat online kembali → sync
  window.addEventListener('online', async () => {
    console.log('[oq] Online — mulai sync...');
    updateOfflineBadge();
    await oqSync();
  });

  // Saat offline → update UI
  window.addEventListener('offline', () => {
    console.log('[oq] Offline mode aktif');
    updateOfflineBadge();
    toast('Mode Offline — transaksi akan disimpan lokal', '');
  });

  // Sync saat app pertama dibuka (kalau ada pending dari sebelumnya)
  if (navigator.onLine) {
    oqCount().then(count => {
      if (count > 0) oqSync();
    });
  }
}

// ── SUBMIT DENGAN OFFLINE SUPPORT ──
// Dipanggil dari modals.js sebagai pengganti sheetsAppend langsung
async function submitWithOfflineSupport(payload) {
  if (navigator.onLine) {
    // Online → langsung ke server
    const res = await fetch(`${API_URL}/api/sheets?action=append`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  } else {
    // Offline → simpan ke antrian
    await oqAdd({ payload, savedAt: new Date().toISOString() });
    await updateOfflineBadge();
    // Return mock success
    return { success: true, offline: true };
  }
}
