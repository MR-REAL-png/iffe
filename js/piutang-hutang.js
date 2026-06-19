// ============================================
// IFFE — piutang-hutang.js
// ============================================

import { requireSession, fetchAll, insertRow, updateRow } from './supabase.js';
import { formatRupiah, applySessionTheme, renderBottomNav, formatTanggal, showToast } from './global.js';

applySessionTheme();
const user = requireSession();

let piutangList = [];
let activeJenis = 'piutang';
let modalJenis = 'piutang';

if (user) {
  renderBottomNav('keuangan');
  init();
}

async function init() {
  piutangList = await fetchAll('piutang', {
    eq: { user_id: user.id },
    order: { column: 'created_at', ascending: false },
  });
  renderList();
}

function renderList() {
  const container = document.getElementById('piutangList');
  const filtered = piutangList.filter((p) => p.jenis === activeJenis);

  if (filtered.length === 0) {
    container.innerHTML = `<p class="empty-state">Belum ada ${activeJenis}.</p>`;
    return;
  }

  container.innerHTML = filtered.map((p) => `
    <div class="card piutang-item">
      <div class="piutang-info">
        <span class="piutang-nama">${p.nama_pihak}</span>
        <span class="piutang-meta">${
          p.tanggal_jatuh_tempo ? 'Jatuh tempo ' + formatTanggal(p.tanggal_jatuh_tempo) : p.deskripsi || ''
        }</span>
      </div>
      <div class="piutang-right">
        <span class="piutang-nominal">${formatRupiah(p.nominal)}</span>
        <button class="status-badge status-${p.status}" data-id="${p.id}" data-status="${p.status}">
          ${p.status === 'lunas' ? 'Lunas' : 'Belum'}
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.status-badge').forEach((btn) => {
    btn.addEventListener('click', () => toggleStatus(btn.dataset.id, btn.dataset.status));
  });
}

async function toggleStatus(id, currentStatus) {
  const newStatus = currentStatus === 'lunas' ? 'belum' : 'lunas';
  const updated = await updateRow('piutang', id, { status: newStatus });

  if (!updated) { showToast('Gagal update status', 'danger'); return; }

  piutangList = piutangList.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
  renderList();
}

// ===== Tab filter =====
const jenisTab = document.getElementById('jenisTab');
jenisTab.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  activeJenis = btn.dataset.jenis;
  jenisTab.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.jenis === activeJenis));
  renderList();
});

// ===== Modal =====
const modal = document.getElementById('piutangModal');
const form = document.getElementById('piutangForm');
const fabAdd = document.getElementById('fabAdd');
const cancelBtn = document.getElementById('cancelPiutang');
const modalJenisToggle = document.getElementById('modalJenisToggle');
const nominalInput = document.getElementById('nominalPiutang');

function openModal() {
  modalJenis = activeJenis;
  modalJenisToggle.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.jenis === modalJenis));
  modal.hidden = false;
}

function closeModal() {
  modal.hidden = true;
  form.reset();
}

fabAdd.addEventListener('click', openModal);
cancelBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

modalJenisToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  modalJenis = btn.dataset.jenis;
  modalJenisToggle.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.jenis === modalJenis));
});

nominalInput.addEventListener('input', () => {
  const raw = nominalInput.value.replace(/\D/g, '');
  nominalInput.value = raw ? Number(raw).toLocaleString('id-ID') : '';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nominal = Number(nominalInput.value.replace(/\D/g, ''));
  const namaPihak = document.getElementById('namaPihak').value.trim();

  if (!namaPihak || !nominal) {
    showToast('Lengkapi nama & nominal', 'danger');
    return;
  }

  const result = await insertRow('piutang', {
    user_id: user.id,
    jenis: modalJenis,
    nama_pihak: namaPihak,
    nominal,
    status: 'belum',
    tanggal_jatuh_tempo: document.getElementById('jatuhTempo').value || null,
    deskripsi: document.getElementById('deskripsiPiutang').value || null,
  });

  if (!result) { showToast('Gagal menyimpan', 'danger'); return; }

  showToast('Tersimpan');
  closeModal();

  piutangList = await fetchAll('piutang', {
    eq: { user_id: user.id },
    order: { column: 'created_at', ascending: false },
  });
  renderList();
});
