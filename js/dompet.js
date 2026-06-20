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

function calcBalance(userId, bankId) {
  let saldo = 0;

  transaksiList.forEach((t) => {
    if (t.user_id === userId && t.bank_id === bankId) {
      saldo += t.jenis === 'pemasukan' ? Number(t.nominal) : -Number(t.nominal);
    }
  });

  transfersList.forEach((tf) => {
    if (tf.dari_user_id === userId && tf.dari_bank_id === bankId) saldo -= Number(tf.nominal);
    if (tf.ke_user_id === userId && tf.ke_bank_id === bankId) saldo += Number(tf.nominal);
  });

  return saldo;
}

function calcTotalBalance(userId) {
  return bankList.reduce((sum, bank) => sum + calcBalance(userId, bank.id), 0);
}

// ===== Generate gradient & motif dari warna bank =====
function shadeColor(hex, percent) {
  hex = (hex || '#3DD9FF').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const num = parseInt(hex, 16) || 0x3DD9FF;
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;
  r = Math.max(Math.min(255, r), 0);
  g = Math.max(Math.min(255, g), 0);
  b = Math.max(Math.min(255, b), 0);
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

function bankGradient(hex) {
  const dark = shadeColor(hex, -30);
  const light = shadeColor(hex, 30);
  return `linear-gradient(135deg, ${dark}, ${light})`;
}

const MOTIFS = ['waves', 'lines', 'circles', 'triangles', 'dots'];

function pickMotif(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return MOTIFS[hash % MOTIFS.length];
}

function motifSVG(motif) {
  const c = 'rgba(255,255,255,0.5)';
  if (motif === 'waves') {
    return `<svg class="atm-motif" style="bottom:0;right:0;width:60%;height:50%" viewBox="0 0 200 100" preserveAspectRatio="none"><path d="M0,50 Q50,20 100,50 T200,50" fill="none" stroke="${c}" stroke-width="2"/><path d="M0,70 Q50,40 100,70 T200,70" fill="none" stroke="${c}" stroke-width="2"/><path d="M0,30 Q50,0 100,30 T200,30" fill="none" stroke="${c}" stroke-width="2"/></svg>`;
  }
  if (motif === 'lines') {
    return `<svg class="atm-motif" style="inset:0;width:100%;height:100%" viewBox="0 0 300 160" preserveAspectRatio="none">${Array.from({ length: 10 }, (_, i) => `<line x1="0" y1="${i * 18}" x2="300" y2="${i * 18}" stroke="${c}" stroke-width="1"/>`).join('')}</svg>`;
  }
  if (motif === 'circles') {
    return `<svg class="atm-motif" style="right:-20px;bottom:-20px;width:55%;height:55%" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="${c}" stroke-width="2"/><circle cx="60" cy="60" r="35" fill="none" stroke="${c}" stroke-width="2"/><circle cx="60" cy="60" r="20" fill="none" stroke="${c}" stroke-width="2"/></svg>`;
  }
  if (motif === 'triangles') {
    return `<svg class="atm-motif" style="right:0;top:0;width:50%;height:50%" viewBox="0 0 150 150"><polygon points="75,10 140,130 10,130" fill="none" stroke="${c}" stroke-width="2"/><polygon points="75,40 120,120 30,120" fill="none" stroke="${c}" stroke-width="2"/></svg>`;
  }
  // dots
  return `<svg class="atm-motif" style="inset:0;width:100%;height:100%" viewBox="0 0 300 160" preserveAspectRatio="none">${Array.from({ length: 32 }, (_, i) => `<circle cx="${(i % 8) * 40 + 20}" cy="${Math.floor(i / 8) * 35 + 20}" r="3" fill="${c}"/>`).join('')}</svg>`;
}

function renderMyCards() {
  const container = document.getElementById('myCards');
  const dotsContainer = document.getElementById('myCardsDots');

  if (bankList.length === 0) {
    container.innerHTML = '<p class="empty-state">Belum ada bank. Tambahkan dulu lewat Pengaturan.</p>';
    dotsContainer.innerHTML = '';
    return;
  }

  container.innerHTML = bankList.map((bank, i) => {
    const saldo = calcBalance(user.id, bank.id);
    const gradient = bankGradient(bank.warna);
    const motif = pickMotif(bank.nama || bank.id);

    return `
      <div class="atm-card${i === 0 ? ' active' : ''}" style="background:${gradient}">
        ${motifSVG(motif)}
        <div class="atm-chip"></div>
        <span class="atm-initial">${(bank.inisial || bank.nama || '').slice(0, 3).toUpperCase()}</span>
        <div class="atm-balance">
          <div class="atm-balance-lbl">Saldo</div>
          <div class="atm-balance-val">${formatRupiah(saldo)}</div>
        </div>
        <div class="atm-bank-name">${bank.nama}</div>
      </div>
    `;
  }).join('');

  dotsContainer.innerHTML = bankList.map((_, i) => `<span class="${i === 0 ? 'active' : ''}"></span>`).join('');

  initCarousel();
}

function initCarousel() {
  const carousel = document.getElementById('myCards');
  const dotsEl = document.getElementById('myCardsDots');
  if (!carousel) return;

  const cards = carousel.querySelectorAll('.atm-card');
  const dots = dotsEl.querySelectorAll('span');
  if (cards.length <= 1) return;

  let ticking = false;
  carousel.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const center = carousel.scrollLeft + carousel.clientWidth / 2;
      let closest = 0, minDist = Infinity;
      cards.forEach((c, i) => {
        const dist = Math.abs((c.offsetLeft + c.offsetWidth / 2) - center);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      cards.forEach((c, i) => c.classList.toggle('active', i === closest));
      dots.forEach((d, i) => d.classList.toggle('active', i === closest));
      ticking = false;
    });
  }, { passive: true });
}

function renderOtherWallets() {
  const container = document.getElementById('otherWallets');
  const others = usersList.filter((u) => u.id !== user.id);

  if (others.length === 0) {
    container.innerHTML = '<p class="empty-state">Belum ada anggota lain.</p>';
    return;
  }

  container.innerHTML = others.map((u) => `
    <div class="card other-wallet-item">
      <span class="other-wallet-name">${u.nama}</span>
      <span class="other-wallet-total">${formatRupiah(calcTotalBalance(u.id))}</span>
    </div>
  `).join('');
}

// ===== Transfer Modal =====
const modal = document.getElementById('transferModal');
const form = document.getElementById('transferForm');
const fabTransfer = document.getElementById('fabTransfer');
const cancelTransfer = document.getElementById('cancelTransfer');
const transferNominal = document.getElementById('transferNominal');

function openModal() {
  if (bankList.length === 0) {
    showToast('Belum ada bank untuk transfer', 'danger');
    return;
  }
  modal.hidden = false;
}

function closeModal() {
  modal.hidden = true;
  form.reset();
}

fabTransfer.addEventListener('click', openModal);
cancelTransfer.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

function populateTransferForm() {
  const dariBankEl = document.getElementById('dariBank');
  const keUserEl = document.getElementById('keUser');
  const keBankEl = document.getElementById('keBank');

  dariBankEl.innerHTML = bankList
    .map((b) => `<option value="${b.id}">${b.nama} (${formatRupiah(calcBalance(user.id, b.id))})</option>`)
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
  if (!nominal) { showToast('Nominal belum diisi', 'danger'); return; }

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
  if (!result) { showToast('Gagal transfer', 'danger'); return; }

  showToast('Transfer berhasil');
  closeModal();

  transfersList = await fetchAll('transfers');
  renderMyCards();
  renderOtherWallets();
  populateTransferForm();
});
