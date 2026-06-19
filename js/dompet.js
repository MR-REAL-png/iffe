// ============================================
// IFFE — dompet.js
// ============================================

import { requireSession, fetchAll, insertRow } from './supabase.js';
import { formatRupiah, applySessionTheme, renderBottomNav, showToast } from './global.js';

applySessionTheme();
const user = requireSession();

let bankList = [];
let usersList = [];
let transaksiList = [];
let transfersList = [];

if (user) {
  renderBottomNav('dompet');
  init();
}

async function init() {
  [bankList, usersList, transaksiList, transfersList] = await Promise.all([
    fetchAll('bank'),
    fetchAll('users'),
    fetchAll('transaksi'),
    fetchAll('transfers'),
  ]);

  renderMyCards();
  renderOtherWallets();
  populateTransferForm();
}

// Saldo = akumulasi transaksi (pemasukan - pengeluaran) + transfer masuk - transfer keluar
function calcBalance(userId, bankId) {
  let saldo = 0;

  transaksiList.forEach((t) => {
    if (t.user_id === userId && t.bank_id === bankId) {
      saldo += t.jenis === 'pemasukan' ? Number(t.nominal) : -Number(t.nominal);
    }
  });

  transfersList.forEach((tf) => {
    if (tf.dari_user_id === userId && tf.dari_bank_id === bankId) {
      saldo -= Number(tf.nominal);
    }
    if (tf.ke_user_id === userId && tf.ke_bank_id === bankId) {
      saldo += Number(tf.nominal);
    }
  });

  return saldo;
}

function calcTotalBalance(userId) {
  return bankList.reduce((sum, bank) => sum + calcBalance(userId, bank.id), 0);
}

function renderMyCards() {
  const container = document.getElementById('myCards');

  if (bankList.length === 0) {
    container.innerHTML =
      '<p class="text-secondary empty-state">Belum ada bank. Tambahkan dulu lewat Pengaturan.</p>';
    return;
  }

  container.innerHTML = bankList
    .map((bank) => {
      const saldo = calcBalance(user.id, bank.id);
      return `
      <div class="wallet-card" style="background:${bank.warna || '#3B82F6'}">
        <div class="wallet-card-top">
          ${
            bank.logo_url
              ? `<img src="${bank.logo_url}" class="wallet-card-logo" alt="${bank.nama}" />`
              : `<span class="wallet-card-initial">${bank.inisial}</span>`
          }
        </div>
        <div>
          <p class="wallet-card-name">${bank.nama}</p>
          <p class="wallet-card-balance">${formatRupiah(saldo)}</p>
        </div>
      </div>
    `;
    })
    .join('');
}

function renderOtherWallets() {
  const container = document.getElementById('otherWallets');
  const others = usersList.filter((u) => u.id !== user.id);

  if (others.length === 0) {
    container.innerHTML =
      '<p class="text-secondary empty-state">Belum ada anggota lain.</p>';
    return;
  }

  container.innerHTML = others
    .map(
      (u) => `
    <div class="card other-wallet-item">
      <span class="other-wallet-name">${u.nama}</span>
      <span class="other-wallet-total">${formatRupiah(calcTotalBalance(u.id))}</span>
    </div>
  `
    )
    .join('');
}

// ===== Transfer Modal =====
const modal = document.getElementById('transferModal');
const form = document.getElementById('transferForm');
const fabTransfer = document.getElementById('fabTransfer');
const cancelTransfer = document.getElementById('cancelTransfer');
const transferNominal = document.getElementById('transferNominal');

fabTransfer.addEventListener('click', () => {

modal.addEventListener('click', (e) => { if (e.target === modal) { modal.hidden = true; form.reset(); } });
  if (bankList.length === 0) {
    showToast('Belum ada bank untuk transfer', 'danger');
    return;
  }
  modal.hidden = false;
});

cancelTransfer.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  modal.hidden = true;
  form.reset();
});

function populateTransferForm() {
  const dariBankEl = document.getElementById('dariBank');
  const keUserEl = document.getElementById('keUser');
  const keBankEl = document.getElementById('keBank');

  dariBankEl.innerHTML = bankList
    .map(
      (b) =>
        `<option value="${b.id}">${b.nama} (${formatRupiah(calcBalance(user.id, b.id))})</option>`
    )
    .join('');

  keUserEl.innerHTML = usersList
    .map((u) => `<option value="${u.id}">${u.id === user.id ? u.nama + ' (saya)' : u.nama}</option>`)
    .join('');

  keBankEl.innerHTML = bankList.map((b) => `<option value="${b.id}">${b.nama}</option>`).join('');
}

transferNominal.addEventListener('input', () => {
  const raw = transferNominal.value.replace(/\D/g, '');
  transferNominal.value = raw ? Number(raw).toLocaleString('id-ID') : '';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nominal = Number(transferNominal.value.replace(/\D/g, ''));
  if (!nominal) {
    showToast('Nominal belum diisi', 'danger');
    return;
  }

  const dariBankId = document.getElementById('dariBank').value;
  const keUserId = document.getElementById('keUser').value;
  const keBankId = document.getElementById('keBank').value;

  if (dariBankId === keBankId && keUserId === user.id) {
    showToast('Kartu asal dan tujuan sama', 'danger');
    return;
  }

  const payload = {
    dari_user_id: user.id,
    dari_bank_id: dariBankId,
    ke_user_id: keUserId,
    ke_bank_id: keBankId,
    nominal,
    keterangan: document.getElementById('transferKeterangan').value || null,
  };

  const result = await insertRow('transfers', payload);

  if (!result) {
    showToast('Gagal transfer', 'danger');
    return;
  }

  showToast('Transfer berhasil');
  modal.hidden = true;
  form.reset();

  transfersList = await fetchAll('transfers');
  renderMyCards();
  renderOtherWallets();
  populateTransferForm();
});
