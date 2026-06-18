// ============================================
// IFFE — keuangan.js
// ============================================

import { requireSession, fetchAll } from './supabase.js';
import { formatRupiah, renderBottomNav } from './global.js';

const user = requireSession();

if (user) {
  renderBottomNav('keuangan');
  loadSummary();
}

async function loadSummary() {
  const [tabungan, target, piutang] = await Promise.all([
    fetchAll('tabungan', { eq: { user_id: user.id } }),
    fetchAll('target', { eq: { user_id: user.id } }),
    fetchAll('piutang', { eq: { user_id: user.id } }),
  ]);

  const totalTabungan = tabungan.reduce((sum, t) => sum + Number(t.saldo || 0), 0);
  document.getElementById('tabunganSummary').textContent = formatRupiah(totalTabungan);

  document.getElementById('targetSummary').textContent = `${target.length} target`;

  const totalPiutang = piutang
    .filter((p) => p.jenis === 'piutang' && p.status === 'belum')
    .reduce((sum, p) => sum + Number(p.nominal), 0);

  const totalHutang = piutang
    .filter((p) => p.jenis === 'hutang' && p.status === 'belum')
    .reduce((sum, p) => sum + Number(p.nominal), 0);

  document.getElementById('piutangSummary').textContent =
    `Piutang ${formatRupiah(totalPiutang)} · Hutang ${formatRupiah(totalHutang)}`;
}
