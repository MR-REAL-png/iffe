// ============================================
// IFFE — statistik.js
// ============================================

import { requireSession, fetchAll } from './supabase.js';
import { formatRupiah, applySessionTheme, renderBottomNav } from './global.js';

applySessionTheme();
const user = requireSession();

let chartAnggota;
let chartKategori;

if (user) {
  renderBottomNav('statistik');
  init();
}

async function init() {
  const filterBulan = document.getElementById('filterBulan');
  filterBulan.value = new Date().toISOString().slice(0, 7);
  filterBulan.addEventListener('change', loadStats);

  await loadStats();
}

async function loadStats() {
  const bulan = document.getElementById('filterBulan').value;

  const [transaksi, usersList, kategoriList] = await Promise.all([
    fetchAll('transaksi'),
    fetchAll('users'),
    fetchAll('kategori'),
  ]);

  const filtered = bulan ? transaksi.filter((t) => t.tanggal?.startsWith(bulan)) : transaksi;

  const totalPemasukan = filtered
    .filter((t) => t.jenis === 'pemasukan')
    .reduce((sum, t) => sum + Number(t.nominal), 0);

  const totalPengeluaran = filtered
    .filter((t) => t.jenis === 'pengeluaran')
    .reduce((sum, t) => sum + Number(t.nominal), 0);

  document.getElementById('totalPemasukan').textContent = formatRupiah(totalPemasukan);
  document.getElementById('totalPengeluaran').textContent = formatRupiah(totalPengeluaran);

  renderChartAnggota(filtered, usersList);
  renderChartKategori(filtered, kategoriList);
}

function renderChartAnggota(filtered, usersList) {
  const totals = usersList.map((u) =>
    filtered
      .filter((t) => t.user_id === u.id && t.jenis === 'pengeluaran')
      .reduce((sum, t) => sum + Number(t.nominal), 0)
  );

  const ctx = document.getElementById('chartAnggota');
  if (chartAnggota) chartAnggota.destroy();

  chartAnggota = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: usersList.map((u) => u.nama),
      datasets: [
        {
          label: 'Pengeluaran',
          data: totals,
          backgroundColor: '#3B82F6',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

function renderChartKategori(filtered, kategoriList) {
  const pengeluaran = filtered.filter((t) => t.jenis === 'pengeluaran');
  const kategoriMap = Object.fromEntries(kategoriList.map((k) => [k.id, k.nama]));

  const totals = {};
  pengeluaran.forEach((t) => {
    const nama = kategoriMap[t.kategori_id] || 'Tanpa kategori';
    totals[nama] = (totals[nama] || 0) + Number(t.nominal);
  });

  const ctx = document.getElementById('chartKategori');
  if (chartKategori) chartKategori.destroy();

  chartKategori = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(totals),
      datasets: [
        {
          data: Object.values(totals),
          backgroundColor: ['#3B82F6', '#60A5FA', '#93C5FD', '#F59E0B', '#EF4444', '#10B981', '#A78BFA'],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}
