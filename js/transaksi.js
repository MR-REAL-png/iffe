// ============================================
// IFFE — transaksi.js
// ============================================

import { requireSession, fetchAll, insertRow } from './supabase.js';
import { formatRupiah, applySessionTheme, renderBottomNav, formatTanggal, showToast } from './global.js';

applySessionTheme();
const user = requireSession();

let kategoriList = [];
let currentJenis = 'pengeluaran';

const modal = document.getElementById('transaksiModal');
const form = document.getElementById('transaksiForm');
const fabAdd = document.getElementById('fabAdd');
const cancelBtn = document.getElementById('cancelBtn');
const jenisToggle = document.getElementById('jenisToggle');
const inputNominal = document.getElementById('inputNominal');
const inputTanggal = document.getElementById('inputTanggal');
const filterUser = document.getElementById('filterUser');
const filterKategori = document.getElementById('filterKategori');
const filterBulan = document.getElementById('filterBulan');

if (user) {
  renderBottomNav('transaksi');
  init();
}

async function init() {
  inputTanggal.value = todayStr();
  filterBulan.value = todayStr().slice(0, 7);

  const [kategori, bank, metode, users] = await Promise.all([
    fetchAll('kategori'),
    fetchAll('bank'),
    fetchAll('metode'),
    fetchAll('users'),
  ]);

  kategoriList = kategori;
  populateSelect('inputKategori', kategori, 'Pilih kategori');
  populateSelect('inputBank', bank, 'Pilih bank');
  populateSelect('inputMetode', metode, 'Pilih metode');
  populateFilterSelect(filterUser, users, 'Semua Anggota');
  populateFilterSelect(filterKategori, kategori, 'Semua Kategori');

  loadTransaksi();
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function populateSelect(elId, list, placeholder) {
  const el = document.getElementById(elId);
  el.innerHTML = `<option value="">${placeholder}</option>` +
    list.map((item) => `<option value="${item.id}">${item.nama}</option>`).join('');
}

function populateFilterSelect(el, list, placeholder) {
  el.innerHTML = `<option value="">${placeholder}</option>` +
    list.map((item) => `<option value="${item.id}">${item.nama}</option>`).join('');
}

// ===== Modal =====
fabAdd.addEventListener('click', () => { modal.hidden = false; });

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

cancelBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeModal();
});

function closeModal() {
  modal.hidden = true;
  form.reset();
  inputTanggal.value = todayStr();
  setJenis('pengeluaran');
}

// ===== Segmented Jenis =====
jenisToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  setJenis(btn.dataset.jenis);
});

function setJenis(jenis) {
  currentJenis = jenis;
  jenisToggle.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('active', b.dataset.jenis === jenis);
  });
}

// ===== Format nominal =====
inputNominal.addEventListener('input', () => {
  const raw = inputNominal.value.replace(/\D/g, '');
  inputNominal.value = raw ? Number(raw).toLocaleString('id-ID') : '';
});

// ===== Scan Struk AI dengan overlay animasi =====
const inputStruk = document.getElementById('inputStruk');
const aiScanOverlay = document.getElementById('aiScanOverlay');
const aiScanImg = document.getElementById('aiScanImg');
const aiScanLbl = document.getElementById('aiScanLbl');
const aiScanCancel = document.getElementById('aiScanCancel');
let aiScanAbort = false;

inputStruk.addEventListener('change', async () => {
  const file = inputStruk.files[0];
  if (!file) return;

  aiScanAbort = false;
  aiScanImg.src = URL.createObjectURL(file);
  aiScanLbl.textContent = 'Membaca struk...';
  aiScanOverlay.hidden = false;

  try {
    const base64 = await fileToBase64(file);
    if (aiScanAbort) return;

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, mimeType: file.type }),
    });
    const data = await response.json();
    if (aiScanAbort) return;

    if (!data.success) {
      aiScanLbl.textContent = 'Gagal membaca struk';
      setTimeout(() => { aiScanOverlay.hidden = true; }, 900);
      showToast('Gagal membaca struk, isi manual', 'danger');
      return;
    }

    const { nominal, tanggal, keterangan } = data.result;
    if (nominal) inputNominal.value = Number(nominal).toLocaleString('id-ID');
    if (tanggal) inputTanggal.value = tanggal;
    if (keterangan) document.getElementById('inputDeskripsi').value = keterangan;

    aiScanLbl.textContent = 'Berhasil dibaca!';
    setTimeout(() => { aiScanOverlay.hidden = true; }, 700);
  } catch (err) {
    if (!aiScanAbort) {
      aiScanLbl.textContent = 'Gagal membaca struk';
      setTimeout(() => { aiScanOverlay.hidden = true; }, 900);
      showToast('Gagal membaca struk', 'danger');
    }
  }
});

aiScanCancel.addEventListener('click', () => {
  aiScanAbort = true;
  aiScanOverlay.hidden = true;
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===== Submit =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nominal = Number(inputNominal.value.replace(/\D/g, ''));
  if (!nominal) { showToast('Nominal belum diisi', 'danger'); return; }

  const payload = {
    user_id: user.id,
    tanggal: inputTanggal.value,
    jenis: currentJenis,
    kategori_id: document.getElementById('inputKategori').value || null,
    bank_id: document.getElementById('inputBank').value || null,
    metode_id: document.getElementById('inputMetode').value || null,
    nominal,
    deskripsi: document.getElementById('inputDeskripsi').value || null,
  };

  const result = await insertRow('transaksi', payload);
  if (!result) { showToast('Gagal menyimpan transaksi', 'danger'); return; }

  showToast('Transaksi tersimpan');
  closeModal();
  loadTransaksi();
});

// ===== Filter =====
[filterUser, filterKategori, filterBulan].forEach((el) => {
  el.addEventListener('change', loadTransaksi);
});

async function loadTransaksi() {
  const options = { order: { column: 'tanggal', ascending: false } };
  const eq = {};
  if (filterUser.value) eq.user_id = filterUser.value;
  if (filterKategori.value) eq.kategori_id = filterKategori.value;
  if (Object.keys(eq).length) options.eq = eq;

  let data = await fetchAll('transaksi', options);
  if (filterBulan.value) data = data.filter((t) => t.tanggal?.startsWith(filterBulan.value));
  renderList(data);
}

// ===== Render list gaya timeline: dikelompokkan per tanggal =====
function renderList(items) {
  const container = document.getElementById('transactionList');

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="empty-state">Belum ada transaksi.</p>';
    return;
  }

  const kategoriMap = Object.fromEntries(kategoriList.map((k) => [k.id, k.nama]));

  const groups = {};
  items.forEach((t) => {
    if (!groups[t.tanggal]) groups[t.tanggal] = [];
    groups[t.tanggal].push(t);
  });

  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  container.innerHTML = dates.map((tgl) => {
    const dayItems = groups[tgl];
    const hasIn = dayItems.some((t) => t.jenis === 'pemasukan');
    const hasOut = dayItems.some((t) => t.jenis === 'pengeluaran');
    const dotClass = hasIn && hasOut ? 'mix' : hasIn ? 'inc' : 'spd';

    const netTotal = dayItems.reduce(
      (s, t) => s + (t.jenis === 'pemasukan' ? Number(t.nominal) : -Number(t.nominal)),
      0
    );

    const cardsHTML = dayItems.map((t) => `
      <div class="card transaction-item ${t.jenis === 'pemasukan' ? 'inc' : 'spd'}">
        <div class="transaction-info">
          <span class="transaction-category">${kategoriMap[t.kategori_id] || 'Tanpa kategori'}</span>
          ${t.deskripsi ? `<span class="transaction-meta">${t.deskripsi}</span>` : ''}
        </div>
        <span class="transaction-amount ${t.jenis === 'pemasukan' ? 'amount-in' : 'amount-out'}">
          ${t.jenis === 'pemasukan' ? '+' : '-'} ${formatRupiah(t.nominal)}
        </span>
      </div>
    `).join('');

    return `
      <div class="date-group">
        <div class="dg-header">
          <span class="dg-dot ${dotClass}"></span>
          <span class="dg-date">${formatTanggal(tgl)}</span>
          <span class="dg-total ${netTotal >= 0 ? 'amount-in' : 'amount-out'}">${netTotal >= 0 ? '+' : ''}${formatRupiah(netTotal)}</span>
        </div>
        <div class="dg-cards">${cardsHTML}</div>
      </div>
    `;
  }).join('');
}
