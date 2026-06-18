// ============================================
// IFFE — global.js
// Fungsi shared dipakai di semua [page].js
// ============================================

export function formatRupiah(value) {
  const number = Number(value) || 0;
  return 'Rp ' + number.toLocaleString('id-ID');
}

export function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-show'));

  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 200);
  }, 2500);
}

export function greetingByTime() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export function formatTanggal(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

// ===== Bottom Nav (mobile) / Sidebar (desktop) =====
const NAV_ITEMS = [
  { page: 'home', href: 'home.html', label: 'Home', icon: 'home' },
  { page: 'transaksi', href: 'transaksi.html', label: 'Transaksi', icon: 'cash' },
  { page: 'dompet', href: 'dompet.html', label: 'Dompet', icon: 'card' },
  { page: 'keuangan', href: 'keuangan.html', label: 'Keuangan', icon: 'wallet' },
  { page: 'statistik', href: 'statistik.html', label: 'Statistik', icon: 'chart' },
];

const ICONS = {
  home: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 0 1 2.122 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />',
  cash: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m13.5-6V18a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18V9.75A2.25 2.25 0 0 1 5.25 7.5h13.5A2.25 2.25 0 0 1 21 9.75v.75" />',
  card: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m13.5-6V18a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18V9.75A2.25 2.25 0 0 1 5.25 7.5h13.5A2.25 2.25 0 0 1 21 9.75v.75" />',
  wallet: '<path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9.75A2.25 2.25 0 0 0 18.75 7.5H5.25A2.25 2.25 0 0 0 3 9.75V12" />',
  chart: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.5l3.75-3.75 4.5 4.5 6.75-6.75M3 19.5h18" />',
};

export function renderBottomNav(activePage) {
  const container = document.getElementById('bottomNav');
  if (!container) return;

  container.innerHTML = NAV_ITEMS.map((item) => `
    <a href="${item.href}" class="nav-item ${item.page === activePage ? 'nav-item-active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="nav-icon">
        ${ICONS[item.icon]}
      </svg>
      <span>${item.label}</span>
    </a>
  `).join('');
}
