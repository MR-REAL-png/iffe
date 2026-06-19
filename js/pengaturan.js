// ============================================
// IFFE — pengaturan.js
// ============================================

import { supabase, requireSession, isAdmin, fetchAll, insertRow, deleteRow, setSession, clearSession } from './supabase.js';
import { renderBottomNav, showToast } from './global.js';

const user = requireSession();

if (user) {
  renderBottomNav('');
  applyTheme(user.tema || 'blue-ocean');
  setupThemePicker();
  setupLogout();

  if (isAdmin()) {
    document.getElementById('adminSections').hidden = false;
    setupAnggota();
    setupKategori();
    setupBank();
    setupMetode();
  }
}

// Toggle inline forms
document.querySelectorAll('.add-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const form = document.getElementById(btn.dataset.target);
    form.hidden = !form.hidden;
  });
});

// ===== Tema =====
function applyTheme(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  document.querySelectorAll('.theme-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.tema === tema);
  });
}

function setupThemePicker() {
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tema = btn.dataset.tema;
      user.tema = tema;
      setSession(user);
      applyTheme(tema);
      await supabase.from('users').update({ tema }).eq('id', user.id);
      showToast('Tema diperbarui');
    });
  });
}

// ===== Logout =====
function setupLogout() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
}

// ===== Anggota =====
async function setupAnggota() {
  const form = document.getElementById('formAnggota');
  await renderAnggota();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama = document.getElementById('namaAnggota').value.trim();
    const role = document.getElementById('roleAnggota').value;
    if (!nama) return;
    const result = await insertRow('users', { nama, role });
    if (!result) { showToast('Gagal menambah anggota', 'danger'); return; }
    showToast('Anggota ditambahkan');
    form.reset();
    form.hidden = true;
    await renderAnggota();
  });
}

async function renderAnggota() {
  const list = await fetchAll('users');
  const container = document.getElementById('listAnggota');
  container.innerHTML = list.map((u) => `
    <div class="settings-item">
      <div class="settings-item-left">
        <span>${u.nama}</span>
        <span class="role-badge">${u.role}</span>
      </div>
      ${u.id !== user.id ? `<button class="delete-btn" data-id="${u.id}" data-table="users">Hapus</button>` : '<span></span>'}
    </div>
  `).join('');
  attachDeleteHandlers(container, renderAnggota);
}

// ===== Kategori =====
async function setupKategori() {
  const form = document.getElementById('formKategori');
  await renderKategori();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama = document.getElementById('namaKategori').value.trim();
    const jenis = document.getElementById('jenisKategori').value;
    if (!nama) return;
    const result = await insertRow('kategori', { nama, jenis });
    if (!result) { showToast('Gagal', 'danger'); return; }
    showToast('Kategori ditambahkan');
    form.reset();
    form.hidden = true;
    await renderKategori();
  });
}

async function renderKategori() {
  const list = await fetchAll('kategori');
  const container = document.getElementById('listKategori');
  container.innerHTML = list.map((k) => `
    <div class="settings-item">
      <div class="settings-item-left">
        <span>${k.nama}</span>
        <span class="role-badge">${k.jenis}</span>
      </div>
      <button class="delete-btn" data-id="${k.id}" data-table="kategori">Hapus</button>
    </div>
  `).join('');
  attachDeleteHandlers(container, renderKategori);
}

// ===== Bank =====
async function setupBank() {
  const form = document.getElementById('formBank');
  await renderBank();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama = document.getElementById('namaBank').value.trim();
    const inisial = document.getElementById('inisialBank').value.trim();
    const warna = document.getElementById('warnaBank').value;
    if (!nama || !inisial) return;
    const result = await insertRow('bank', { nama, inisial, warna });
    if (!result) { showToast('Gagal', 'danger'); return; }
    showToast('Bank ditambahkan');
    form.reset();
    form.hidden = true;
    await renderBank();
  });
}

async function renderBank() {
  const list = await fetchAll('bank');
  const container = document.getElementById('listBank');
  container.innerHTML = list.map((b) => `
    <div class="settings-item">
      <div class="settings-item-left">
        <span class="color-dot" style="background:${b.warna}"></span>
        <span>${b.nama} (${b.inisial})</span>
      </div>
      <button class="delete-btn" data-id="${b.id}" data-table="bank" data-checktransaksi="true">Hapus</button>
    </div>
  `).join('');
  attachDeleteHandlers(container, renderBank);
}

// ===== Metode =====
async function setupMetode() {
  const form = document.getElementById('formMetode');
  await renderMetode();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama = document.getElementById('namaMetode').value.trim();
    if (!nama) return;
    const result = await insertRow('metode', { nama });
    if (!result) { showToast('Gagal', 'danger'); return; }
    showToast('Metode ditambahkan');
    form.reset();
    form.hidden = true;
    await renderMetode();
  });
}

async function renderMetode() {
  const list = await fetchAll('metode');
  const container = document.getElementById('listMetode');
  container.innerHTML = list.map((m) => `
    <div class="settings-item">
      <span>${m.nama}</span>
      <button class="delete-btn" data-id="${m.id}" data-table="metode">Hapus</button>
    </div>
  `).join('');
  attachDeleteHandlers(container, renderMetode);
}

// ===== Shared delete =====
function attachDeleteHandlers(container, refreshFn) {
  container.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const { id, table, checktransaksi } = btn.dataset;
      if (checktransaksi) {
        const related = await fetchAll('transaksi', { eq: { bank_id: id } });
        if (related.length > 0) {
          showToast('Bank masih punya transaksi, tidak bisa dihapus', 'danger');
          return;
        }
      }
      const ok = await deleteRow(table, id);
      if (!ok) { showToast('Gagal menghapus', 'danger'); return; }
      showToast('Berhasil dihapus');
      refreshFn();
    });
  });
}
