// ============================================
// IFFE — home.js
// ============================================

import { requireSession, fetchAll } from './supabase.js';
import { formatRupiah, applySessionTheme, renderBottomNav, greetingByTime, formatTanggal } from './global.js';

applySessionTheme();
const user = requireSession();

if (user) {
  document.getElementById('greetingText').textContent = `${greetingByTime()},`;
  document.getElementById('userName').textContent = user.nama;
  renderBottomNav('home');
  loadSummary();
}

async function loadSummary() {
  const transaksi = await fetchAll('transaksi', {
    order: { column: 'tanggal', ascending: false },
  });

  const totalSaldo = transaksi.reduce((sum, t) => {
    return t.jenis === 'pemasukan' ? sum + Number(t.nominal) : sum - Number(t.nominal);
  }, 0);

  document.getElementById('totalBalance').textContent = formatRupiah(totalSaldo);

  await renderRecentTransactions(transaksi.slice(0, 5));
}

async function renderRecentTransactions(items) {
  const container = document.getElementById('recentTransactions');

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="text-secondary empty-state">Belum ada transaksi.</p>';
    return;
  }

  const kategoriList = await fetchAll('kategori');
  const kategoriMap = Object.fromEntries(kategoriList.map((k) => [k.id, k.nama]));

  container.innerHTML = items.map((t) => `
    <div class="card transaction-item">
      <div class="transaction-info">
        <span class="transaction-category">${kategoriMap[t.kategori_id] || 'Tanpa kategori'}</span>
        <span class="transaction-meta">${formatTanggal(t.tanggal)}</span>
      </div>
      <span class="transaction-amount ${t.jenis === 'pemasukan' ? 'amount-in' : 'amount-out'}">
        ${t.jenis === 'pemasukan' ? '+' : '-'} ${formatRupiah(t.nominal)}
      </span>
    </div>
  `).join('');
}
