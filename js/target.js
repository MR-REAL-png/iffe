// ============================================
// IFFE — target.js
// ============================================

import { requireSession, fetchAll, insertRow } from './supabase.js';
import { formatRupiah, applySessionTheme, renderBottomNav, showToast } from './global.js';

applySessionTheme();
const user = requireSession();

let targetList = [];
let tabunganList = [];

if (user) {
  renderBottomNav('keuangan');
  init();
}

async function init() {
  await loadData();
  renderList();
  populateForm();
}

async function loadData() {
  [targetList, tabunganList] = await Promise.all([
    fetchAll('target', {
      eq: { user_id: user.id },
      order: { column: 'created_at', ascending: false },
    }),
    fetchAll('tabungan', { eq: { user_id: user.id } }),
  ]);
}

function renderList() {
  const container = document.getElementById('targetList');

  if (targetList.length === 0) {
    container.innerHTML = '<p class="empty-state">Belum ada target.</p>';
    return;
  }

  const tabunganMap = Object.fromEntries(tabunganList.map((t) => [t.id, t]));

  container.innerHTML = targetList.map((t) => {
    const tabungan = tabunganMap[t.tabungan_id];
    const saldoTerkumpul = tabungan ? Number(tabungan.saldo) : 0;
    const persen = Math.min(100, Math.round((saldoTerkumpul / Number(t.nominal_target)) * 100)) || 0;

    return `
      <div class="card target-item">
        <div class="target-header">
          <span class="target-nama">${t.nama}</span>
          <span class="target-percent">${persen}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${persen}%"></div>
        </div>
        <div class="target-meta">
          <span>${formatRupiah(saldoTerkumpul)}</span>
          <span>${formatRupiah(t.nominal_target)}</span>
        </div>
        ${!tabungan ? '<p class="text-secondary" style="font-size:11px;margin-top:6px;">Belum terhubung ke tabungan</p>' : ''}
      </div>
    `;
  }).join('');
}

function populateForm() {
  const linkEl = document.getElementById('linkTabungan');
  linkEl.innerHTML =
    '<option value="">Tidak terhubung</option>' +
    tabunganList.map((t) => `<option value="${t.id}">${t.nama}</option>`).join('');
}

// ===== Modal =====
const modal = document.getElementById('targetModal');
const form = document.getElementById('targetForm');
const fabAdd = document.getElementById('fabAdd');
const cancelBtn = document.getElementById('cancelTarget');
const nominalInput = document.getElementById('nominalTarget');

function openModal() { modal.hidden = false; }

function closeModal() {
  modal.hidden = true;
  form.reset();
}

fabAdd.addEventListener('click', openModal);
cancelBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

nominalInput.addEventListener('input', () => {
  const raw = nominalInput.value.replace(/\D/g, '');
  nominalInput.value = raw ? Number(raw).toLocaleString('id-ID') : '';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nominalTarget = Number(nominalInput.value.replace(/\D/g, ''));
  const nama = document.getElementById('namaTarget').value.trim();

  if (!nama || !nominalTarget) {
    showToast('Lengkapi nama & nominal target', 'danger');
    return;
  }

  const result = await insertRow('target', {
    user_id: user.id,
    nama,
    nominal_target: nominalTarget,
    tabungan_id: document.getElementById('linkTabungan').value || null,
  });

  if (!result) { showToast('Gagal menyimpan target', 'danger'); return; }

  showToast('Target tersimpan');
  closeModal();

  await loadData();
  renderList();
  populateForm();
});
