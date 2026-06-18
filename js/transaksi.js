// ============================================
// IFFE — transaksi.js
// ============================================

import { requireSession, fetchAll, insertRow } from './supabase.js';
import { formatRupiah, renderBottomNav, formatTanggal, showToast } from './global.js';

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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function populateSelect(elId, list, placeholder) {
  const el = document.getElementById(elId);
  el.innerHTML = `<option value="">${placeholder}</option>` +
    list.map((item) => `<option value="${item.id}">${item.nama}</option>`).join('');
}

function populateFilterSelect(el, list, placeholder) {
  el.innerHTML = `<option value="">${placeholder}</option>` +
    list.map((item) => `<option value="${item.id}">${item.nama}</option>`).join('');
}

// ===== Modal open/close =====
fabAdd.addEventListener('click', () => {
  modal.hidden = false;
});

cancelBtn.addEventListener('click', closeModal);

function closeModal() {
  modal.hidden = true;
  form.reset();
  inputTanggal.value = todayStr();
  setJenis('pengeluaran');
}

// ===== Toggle Pemasukan / Pengeluaran =====
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

// ===== Format nominal saat mengetik (Rp 1.000.000) =====
inputNominal.addEventListener('input', () => {
  const raw = inputNominal.value.replace(/\D/g, '');
  inputNominal.value = raw ? Number(raw).toLocaleString('id-ID') : '';
});

// ===== Scan Struk AI =====
const inputStruk = document.getElementById('inputStruk');

inputStruk.addEventListener('change', async () => {
  const file = inputStruk.files[0];
  if (!file) return;

  showToast('Membaca struk...');

  try {
    const base64 = await fileToBase64(file);

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, mimeType: file.type }),
    });

    const data = await response.json();

    if (!data.success) {
      showToast('Gagal membaca struk, isi manual ya', 'danger');
      return;
    }

    const { nominal, tanggal, keterangan } = data.result;

    if (nominal) {
      inputNominal.value = Number(nominal).toLocaleString('id-ID');
    }
    if (tanggal) {
      inputTanggal.value = tanggal;
    }
    if (keterangan) {
      document.getElementById('inputDeskripsi').value = keterangan;
    }

    showToast('Struk berhasil dibaca, cek lagi datanya sebelum simpan');
  } catch (err) {
    console.error('Scan struk error:', err);
    showToast('Gagal membaca struk', 'danger');
  }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===== Submit form tambah transaksi =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nominal = Number(inputNominal.value.replace(/\D/g, ''));
  if (!nominal) {
    showToast('Nominal belum diisi', 'danger');
    return;
  }

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

  if (!result) {
    showToast('Gagal menyimpan transaksi', 'danger');
    return;
  }

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

  if (filterBulan.value) {
    data = data.filter((t) => t.tanggal?.startsWith(filterBulan.value));
  }

  renderList(data);
}

function renderList(items) {
  const container = document.getElementById('transactionList');

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="text-secondary empty-state">Belum ada transaksi.</p>';
    return;
  }

  const kategoriMap = Object.fromEntries(kategoriList.map((k) => [k.id, k.nama]));

  container.innerHTML = items.map((t) => `
    <div class="card transaction-item">
      <div class="transaction-info">
        <span class="transaction-category">${kategoriMap[t.kategori_id] || 'Tanpa kategori'}</span>
        <span class="transaction-meta">${formatTanggal(t.tanggal)}${t.deskripsi ? ' · ' + t.deskripsi : ''}</span>
      </div>
      <span class="transaction-amount ${t.jenis === 'pemasukan' ? 'amount-in' : 'amount-out'}">
        ${t.jenis === 'pemasukan' ? '+' : '-'} ${formatRupiah(t.nominal)}
      </span>
    </div>
  `).join('');
}
