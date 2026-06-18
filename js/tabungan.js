// ============================================
// IFFE — tabungan.js
// ============================================

import { requireSession, fetchAll, insertRow, updateRow } from './supabase.js';
import { formatRupiah, renderBottomNav, showToast } from './global.js';

const user = requireSession();

let tabunganList = [];
let bankList = [];

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
  [tabunganList, bankList] = await Promise.all([
    fetchAll('tabungan', {
      eq: { user_id: user.id },
      order: { column: 'created_at', ascending: false },
    }),
    fetchAll('bank'),
  ]);
}

function renderList() {
  const container = document.getElementById('tabunganList');

  if (tabunganList.length === 0) {
    container.innerHTML =
      '<p class="text-secondary empty-state">Belum ada tabungan. Sisihkan dana lewat tombol +.</p>';
    return;
  }

  container.innerHTML = tabunganList
    .map(
      (t) => `
    <div class="card tabungan-item">
      <div class="tabungan-info">
        <span class="tabungan-nama">${t.nama}</span>
        ${t.tujuan ? `<span class="tabungan-tujuan">${t.tujuan}</span>` : ''}
      </div>
      <span class="tabungan-saldo">${formatRupiah(t.saldo)}</span>
    </div>
  `
    )
    .join('');
}

function populateForm() {
  const pilihEl = document.getElementById('pilihTabungan');
  pilihEl.innerHTML =
    '<option value="new">+ Tabungan Baru</option>' +
    tabunganList.map((t) => `<option value="${t.id}">${t.nama}</option>`).join('');

  document.getElementById('dariBankTabungan').innerHTML = bankList
    .map((b) => `<option value="${b.id}">${b.nama}</option>`)
    .join('');
}

// ===== Modal =====
const modal = document.getElementById('tabunganModal');
const form = document.getElementById('tabunganForm');
const fabAdd = document.getElementById('fabAdd');
const cancelBtn = document.getElementById('cancelTabungan');
const pilihTabungan = document.getElementById('pilihTabungan');
const newFields = document.getElementById('newTabunganFields');
const nominalInput = document.getElementById('nominalTabungan');

fabAdd.addEventListener('click', () => {
  if (bankList.length === 0) {
    showToast('Belum ada bank, tambahkan dulu di Pengaturan', 'danger');
    return;
  }
  modal.hidden = false;
});

cancelBtn.addEventListener('click', closeModal);

function closeModal() {
  modal.hidden = true;
  form.reset();
  toggleNewFields();
}

pilihTabungan.addEventListener('change', toggleNewFields);

function toggleNewFields() {
  newFields.hidden = pilihTabungan.value !== 'new';
}
toggleNewFields();

nominalInput.addEventListener('input', () => {
  const raw = nominalInput.value.replace(/\D/g, '');
  nominalInput.value = raw ? Number(raw).toLocaleString('id-ID') : '';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nominal = Number(nominalInput.value.replace(/\D/g, ''));
  if (!nominal) {
    showToast('Nominal belum diisi', 'danger');
    return;
  }

  const bankId = document.getElementById('dariBankTabungan').value;
  let tabunganId = pilihTabungan.value;
  let namaForDesc = '';

  if (tabunganId === 'new') {
    const nama = document.getElementById('namaTabungan').value.trim();
    if (!nama) {
      showToast('Nama tabungan belum diisi', 'danger');
      return;
    }
    const tujuan = document.getElementById('tujuanTabungan').value || null;

    const newRow = await insertRow('tabungan', {
      user_id: user.id,
      nama,
      tujuan,
      saldo: nominal,
    });

    if (!newRow) {
      showToast('Gagal membuat tabungan', 'danger');
      return;
    }
    tabunganId = newRow.id;
    namaForDesc = nama;
  } else {
    const current = tabunganList.find((t) => t.id === tabunganId);
    const updated = await updateRow('tabungan', tabunganId, {
      saldo: Number(current.saldo) + nominal,
    });
    if (!updated) {
      showToast('Gagal update tabungan', 'danger');
      return;
    }
    namaForDesc = current.nama;
  }

  // Catat sebagai pengeluaran di bank asal biar saldo dompet ikut update
  await insertRow('transaksi', {
    user_id: user.id,
    tanggal: new Date().toISOString().slice(0, 10),
    jenis: 'pengeluaran',
    kategori_id: null,
    bank_id: bankId,
    metode_id: null,
    nominal,
    deskripsi: `Disisihkan ke tabungan: ${namaForDesc}`,
  });

  showToast('Tabungan tersimpan');
  closeModal();

  await loadData();
  renderList();
  populateForm();
});
