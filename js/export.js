// ═══════════════════════════════════════════════════════
// export_shif.js — Export Laporan SHIF
// CSV, Excel (.xlsx via SheetJS), Ringkasan Visual
// ═══════════════════════════════════════════════════════

// ── STORAGE KEY RIWAYAT EXPORT ──
const EXPORT_HISTORY_KEY = 'shif_export_history';

function getExportHistory() {
  try { return JSON.parse(localStorage.getItem(EXPORT_HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function saveExportHistory(type, bulan, tahun, jumlahBaris) {
  const history = getExportHistory();
  history.unshift({
    type,
    bulan,
    tahun,
    jumlahBaris,
    waktu: new Date().toISOString(),
    label: bulan === 'semua' ? `Semua data (${tahun||'all'})` : `${bulan} ${tahun}`
  });
  // Simpan max 10 riwayat
  localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
}

function fmtWaktu(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MOS[d.getMonth()].slice(0,3)} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ── FILTER ROWS UNTUK EXPORT ──
function getExportRows(bulan, tahun, jenis) {
  let rows = [...allRows];
  if (bulan && bulan !== 'semua') rows = rows.filter(r => r.bulan === bulan);
  if (tahun && tahun !== 'semua') rows = rows.filter(r => r.tanggal?.startsWith(tahun));
  if (jenis && jenis !== 'semua') rows = rows.filter(r => r.jenis === jenis);
  return rows.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}

// ═══════════════════════════════════
// MODAL EXPORT — buka
// ═══════════════════════════════════
function openExportModal() {
  // Build opsi bulan dari allRows
  const bulanList = [...new Set(allRows.map(r => r.bulan).filter(Boolean))];
  const tahunList = [...new Set(allRows.map(r => r.tanggal?.slice(0,4)).filter(Boolean))].sort().reverse();
  const bulanUrut = MOS.filter(m => bulanList.includes(m));

  // Hitung default rows (bulan aktif)
  const now = new Date();
  const bulanDefault = MOS[now.getMonth()];
  const tahunDefault = String(now.getFullYear());
  const defaultRows = getExportRows(bulanDefault, tahunDefault, '').length;

  const history = getExportHistory();
  const historyHtml = history.length
    ? history.map(h => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--glass);border:1px solid var(--glass-bdr);border-radius:8px;margin-bottom:4px">
          <div>
            <div style="font-size:0.75rem;font-weight:600;color:var(--tx)">${h.label} · ${h.type.toUpperCase()}</div>
            <div style="font-size:0.62rem;color:var(--tx3)">${fmtWaktu(h.waktu)} · ${h.jumlahBaris} baris</div>
          </div>
          <div style="font-size:0.65rem;padding:2px 8px;border-radius:50px;background:rgba(56,189,248,0.1);color:var(--ac);font-weight:600">${h.type}</div>
        </div>`).join('')
    : `<div style="text-align:center;color:var(--tx3);font-size:0.75rem;padding:12px">Belum ada riwayat export</div>`;

  openBs('Export Laporan', `
    <!-- Pilih Periode -->
    <div style="margin-bottom:14px">
      <div class="inp-lbl" style="margin-bottom:6px">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/></svg>
        Periode
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <select id="expBulan" class="inp" onchange="updateExportCount()">
          <option value="semua">Semua Bulan</option>
          ${bulanUrut.map(b => `<option value="${b}" ${b===bulanDefault?'selected':''}>${b}</option>`).join('')}
        </select>
        <select id="expTahun" class="inp" onchange="updateExportCount()">
          <option value="semua">Semua Tahun</option>
          ${tahunList.map(t => `<option value="${t}" ${t===tahunDefault?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <select id="expJenis" class="inp" onchange="updateExportCount()">
        <option value="semua">Semua Jenis</option>
        <option value="Pemasukan">Pemasukan saja</option>
        <option value="Pengeluaran">Pengeluaran saja</option>
      </select>
    </div>

    <!-- Info jumlah baris -->
    <div id="expCountInfo" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.2);border-radius:10px;margin-bottom:16px">
      <span style="font-size:0.78rem;color:var(--tx2)">Data yang akan diekspor</span>
      <span id="expCount" style="font-size:0.9rem;font-weight:800;color:var(--ac)">${defaultRows} baris</span>
    </div>

    <!-- Tombol export -->
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">
      <button onclick="doExportCSV()" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--glass);border:1px solid var(--glass-bdr);border-radius:12px;cursor:pointer;color:var(--tx);font-family:var(--ffb)">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(56,189,248,0.15);display:flex;align-items:center;justify-content:center;font-size:1.1rem">📄</div>
          <div style="text-align:left">
            <div style="font-size:0.85rem;font-weight:700">Download CSV</div>
            <div style="font-size:0.62rem;color:var(--tx3)">Excel, Numbers, Google Sheets</div>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
      </button>

      <button onclick="doExportExcel()" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--glass);border:1px solid var(--glass-bdr);border-radius:12px;cursor:pointer;color:var(--tx);font-family:var(--ffb)">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(52,211,153,0.15);display:flex;align-items:center;justify-content:center;font-size:1.1rem">📊</div>
          <div style="text-align:left">
            <div style="font-size:0.85rem;font-weight:700">Download Excel (.xlsx)</div>
            <div style="font-size:0.62rem;color:var(--tx3)">3 sheet: Transaksi, Ringkasan, Per Member</div>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
      </button>

      <button onclick="doExportRingkasan()" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--glass);border:1px solid var(--glass-bdr);border-radius:12px;cursor:pointer;color:var(--tx);font-family:var(--ffb)">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(244,114,182,0.15);display:flex;align-items:center;justify-content:center;font-size:1.1rem">📋</div>
          <div style="text-align:left">
            <div style="font-size:0.85rem;font-weight:700">Lihat Ringkasan</div>
            <div style="font-size:0.62rem;color:var(--tx3)">Visual, cocok untuk screenshot / share</div>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>

    <!-- Riwayat export -->
    <div style="font-size:0.62rem;color:var(--tx3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;font-weight:700">Riwayat Export</div>
    <div id="expHistoryList">${historyHtml}</div>
  `);
}

// Update jumlah baris saat filter berubah
function updateExportCount() {
  const bulan = document.getElementById('expBulan')?.value || 'semua';
  const tahun = document.getElementById('expTahun')?.value || 'semua';
  const jenis = document.getElementById('expJenis')?.value || 'semua';
  const rows = getExportRows(bulan, tahun, jenis);
  const el = document.getElementById('expCount');
  if (el) {
    el.textContent = `${rows.length} baris`;
    el.style.color = rows.length === 0 ? 'var(--red)' : 'var(--ac)';
  }
}

// ═══════════════════════════════════
// EXPORT CSV
// ═══════════════════════════════════
function doExportCSV() {
  const bulan = document.getElementById('expBulan')?.value || 'semua';
  const tahun = document.getElementById('expTahun')?.value || 'semua';
  const jenis = document.getElementById('expJenis')?.value || 'semua';
  const rows = getExportRows(bulan, tahun, jenis);

  if (!rows.length) { toast('Tidak ada data untuk diekspor', 'err'); return; }

  const headers = ['No','Tanggal','Bulan','Jenis','Kategori','Nominal','Metode','Rekening','Keterangan','Dicatat Oleh'];
  const csvRows = [
    headers.join(','),
    ...rows.map((r, i) => [
      i + 1,
      r.tanggal || '',
      r.bulan || '',
      r.jenis || '',
      `"${(r.kategori || '').replace(/"/g,'""')}"`,
      r.nominal || 0,
      r.metode || '',
      r.pembayaran || '',
      `"${(r.detail || '').replace(/"/g,'""')}"`,
      r.recorded_by || ''
    ].join(','))
  ];

  const csv = '\uFEFF' + csvRows.join('\n'); // BOM untuk Excel agar UTF-8 terbaca
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const periodLabel = bulan === 'semua' ? 'Semua' : `${bulan}_${tahun}`;
  a.href = url;
  a.download = `SHIF_${periodLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  saveExportHistory('CSV', bulan, tahun, rows.length);
  toast(`CSV berhasil diunduh (${rows.length} baris) ✓`, 'ok');
  updateHistoryUI();
}

// ═══════════════════════════════════
// EXPORT EXCEL (.xlsx via SheetJS)
// ═══════════════════════════════════
async function doExportExcel() {
  const bulan = document.getElementById('expBulan')?.value || 'semua';
  const tahun = document.getElementById('expTahun')?.value || 'semua';
  const jenis = document.getElementById('expJenis')?.value || 'semua';
  const rows = getExportRows(bulan, tahun, jenis);

  if (!rows.length) { toast('Tidak ada data untuk diekspor', 'err'); return; }

  // Load SheetJS dari CDN jika belum ada
  if (typeof XLSX === 'undefined') {
    toast('Memuat library Excel...', '');
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Transaksi ──
  const txData = [
    ['No','Tanggal','Bulan','Jenis','Kategori','Nominal','Metode','Rekening','Keterangan','Dicatat Oleh'],
    ...rows.map((r, i) => [
      i + 1, r.tanggal, r.bulan, r.jenis, r.kategori,
      r.nominal, r.metode, r.pembayaran, r.detail, r.recorded_by
    ])
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(txData);
  // Lebar kolom
  ws1['!cols'] = [
    {wch:4},{wch:12},{wch:10},{wch:12},{wch:16},
    {wch:14},{wch:10},{wch:12},{wch:24},{wch:12}
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Transaksi');

  // ── Sheet 2: Ringkasan ──
  const totM = rows.filter(r=>r.jenis==='Pemasukan').reduce((s,r)=>s+r.nominal,0);
  const totK = rows.filter(r=>r.jenis==='Pengeluaran').reduce((s,r)=>s+r.nominal,0);
  const byKat = {};
  rows.filter(r=>r.jenis==='Pengeluaran').forEach(r=>{
    byKat[r.kategori]=(byKat[r.kategori]||0)+r.nominal;
  });
  const katArr = Object.entries(byKat).sort((a,b)=>b[1]-a[1]);
  const periodLabel = bulan==='semua'?'Semua Periode':`${bulan} ${tahun}`;

  const rsData = [
    ['LAPORAN KEUANGAN SHIF'],
    [periodLabel],
    [''],
    ['RINGKASAN'],
    ['Total Pemasukan', totM],
    ['Total Pengeluaran', totK],
    ['Arus Kas', totM - totK],
    ['Jumlah Transaksi', rows.length],
    [''],
    ['PENGELUARAN PER KATEGORI'],
    ['Kategori', 'Nominal', 'Persen'],
    ...katArr.map(([k,v])=>[k, v, totK>0?`${Math.round(v/totK*100)}%`:'0%'])
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(rsData);
  ws2['!cols'] = [{wch:24},{wch:16},{wch:10}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan');

  // ── Sheet 3: Per Member ──
  const members = [...new Set(rows.map(r=>r.recorded_by).filter(Boolean))];
  const memberData = [
    ['Member','Pemasukan','Pengeluaran','Arus Kas','Jumlah Transaksi'],
    ...members.map(m => {
      const mRows = rows.filter(r=>r.recorded_by===m);
      const mMasuk = mRows.filter(r=>r.jenis==='Pemasukan').reduce((s,r)=>s+r.nominal,0);
      const mKeluar = mRows.filter(r=>r.jenis==='Pengeluaran').reduce((s,r)=>s+r.nominal,0);
      return [m, mMasuk, mKeluar, mMasuk-mKeluar, mRows.length];
    })
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(memberData);
  ws3['!cols'] = [{wch:16},{wch:14},{wch:14},{wch:14},{wch:18}];
  XLSX.utils.book_append_sheet(wb, ws3, 'Per Member');

  // Download
  const fname = `SHIF_${bulan==='semua'?'Semua':bulan}_${tahun==='semua'?'':tahun}.xlsx`;
  XLSX.writeFile(wb, fname);

  saveExportHistory('Excel', bulan, tahun, rows.length);
  toast(`Excel berhasil diunduh (${rows.length} baris) ✓`, 'ok');
  updateHistoryUI();
}

// ═══════════════════════════════════
// EXPORT RINGKASAN VISUAL
// ═══════════════════════════════════
function doExportRingkasan() {
  const bulan = document.getElementById('expBulan')?.value || 'semua';
  const tahun = document.getElementById('expTahun')?.value || 'semua';
  const jenis = document.getElementById('expJenis')?.value || 'semua';
  const rows = getExportRows(bulan, tahun, jenis);

  if (!rows.length) { toast('Tidak ada data untuk ditampilkan', 'err'); return; }

  const totM = rows.filter(r=>r.jenis==='Pemasukan').reduce((s,r)=>s+r.nominal,0);
  const totK = rows.filter(r=>r.jenis==='Pengeluaran').reduce((s,r)=>s+r.nominal,0);
  const kas = totM - totK;

  // Top kategori
  const byKat = {};
  rows.filter(r=>r.jenis==='Pengeluaran').forEach(r=>{
    byKat[r.kategori]=(byKat[r.kategori]||0)+r.nominal;
  });
  const topKat = Object.entries(byKat).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxKat = topKat[0]?.[1] || 1;

  // Top transaksi terbesar
  const topTx = [...rows].sort((a,b)=>b.nominal-a.nominal).slice(0,4);

  // Per member
  const members = [...new Set(rows.map(r=>r.recorded_by).filter(Boolean))];
  const memberStats = members.map(m => {
    const mr = rows.filter(r=>r.recorded_by===m);
    return {
      name: m,
      masuk: mr.filter(r=>r.jenis==='Pemasukan').reduce((s,r)=>s+r.nominal,0),
      keluar: mr.filter(r=>r.jenis==='Pengeluaran').reduce((s,r)=>s+r.nominal,0),
      count: mr.length,
    };
  });

  const periodLabel = bulan==='semua'?'Semua Periode':`${bulan} ${tahun}`;
  const COLORS = ['#f472b6','#a78bfa','#60a5fa','#34d399','#fbbf24'];

  const html = `
    <div style="background:var(--bg);padding:20px;border-radius:16px;max-width:380px;margin:0 auto">
      <!-- Header -->
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:0.65rem;color:var(--tx3);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:4px">Laporan Keuangan</div>
        <div style="font-size:1.4rem;font-weight:900;letter-spacing:0.1em;background:linear-gradient(135deg,#38bdf8,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">SHIF</div>
        <div style="font-size:0.78rem;color:var(--tx2);margin-top:2px">${periodLabel} · ${rows.length} transaksi</div>
      </div>

      <!-- Stat 3 kolom -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
        <div style="background:var(--glass);border:1px solid var(--glass-bdr);border-radius:12px;padding:10px 6px;text-align:center">
          <div style="font-size:0.52rem;color:var(--tx3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Masuk</div>
          <div style="font-size:0.82rem;font-weight:800;color:#34d399">${rpShort(totM)}</div>
        </div>
        <div style="background:var(--glass);border:1px solid var(--glass-bdr);border-radius:12px;padding:10px 6px;text-align:center">
          <div style="font-size:0.52rem;color:var(--tx3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Keluar</div>
          <div style="font-size:0.82rem;font-weight:800;color:#f87171">${rpShort(totK)}</div>
        </div>
        <div style="background:var(--glass);border:1px solid var(--glass-bdr);border-radius:12px;padding:10px 6px;text-align:center">
          <div style="font-size:0.52rem;color:var(--tx3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Kas</div>
          <div style="font-size:0.82rem;font-weight:800;color:${kas>=0?'#38bdf8':'#f87171'}">${kas>=0?'+':'−'}${rpShort(Math.abs(kas))}</div>
        </div>
      </div>

      <!-- Top Kategori -->
      ${topKat.length ? `
      <div style="font-size:0.6rem;color:var(--tx3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:8px">Top Pengeluaran</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
        ${topKat.map(([k,v],i)=>`
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:80px;font-size:0.7rem;color:var(--tx2);flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${k}</div>
            <div style="flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden">
              <div style="height:100%;width:${Math.round(v/maxKat*100)}%;background:${COLORS[i]};border-radius:99px;transition:width .8s"></div>
            </div>
            <div style="font-size:0.68rem;font-weight:700;color:${COLORS[i]};width:52px;text-align:right;flex-shrink:0">${rpShort(v)}</div>
          </div>`).join('')}
      </div>` : ''}

      <!-- Per Member -->
      ${memberStats.length > 1 ? `
      <div style="font-size:0.6rem;color:var(--tx3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:8px">Per Member</div>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        ${memberStats.map((m,i)=>`
          <div style="flex:1;background:var(--glass);border:1px solid var(--glass-bdr);border-radius:12px;padding:10px 8px;text-align:center">
            <div style="font-size:0.8rem;font-weight:700;color:var(--tx);margin-bottom:6px">${m.name}</div>
            <div style="font-size:0.62rem;color:#34d399;margin-bottom:2px">+${rpShort(m.masuk)}</div>
            <div style="font-size:0.62rem;color:#f87171;margin-bottom:4px">-${rpShort(m.keluar)}</div>
            <div style="font-size:0.55rem;color:var(--tx3)">${m.count} transaksi</div>
          </div>`).join('')}
      </div>` : ''}

      <!-- Transaksi terbesar -->
      <div style="font-size:0.6rem;color:var(--tx3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:8px">Transaksi Terbesar</div>
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:16px">
        ${topTx.map(r=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--glass);border:1px solid var(--glass-bdr);border-radius:8px">
            <div>
              <div style="font-size:0.75rem;font-weight:600;color:var(--tx)">${r.kategori||'—'}</div>
              <div style="font-size:0.6rem;color:var(--tx3)">${r.tanggal||''} · ${r.recorded_by||''}</div>
            </div>
            <div style="font-size:0.8rem;font-weight:700;color:${r.jenis==='Pemasukan'?'#34d399':'#f87171'}">${r.jenis==='Pemasukan'?'+':'−'}${rp(r.nominal)}</div>
          </div>`).join('')}
      </div>

      <!-- Footer -->
      <div style="text-align:center;font-size:0.58rem;color:var(--tx3);border-top:1px solid var(--bdr);padding-top:12px">
        Dibuat ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})} · SHIF App
      </div>
    </div>
  `;

  // Tampilkan di bottom sheet baru
  closeBs();
  setTimeout(() => {
    openBs('Ringkasan Laporan', `
      <div id="ringkasanCard">${html}</div>
      <div style="display:flex;gap:8px;padding:4px 0 8px">
        <button onclick="shareRingkasan()" style="flex:1;height:44px;border-radius:12px;background:linear-gradient(135deg,#38bdf8,#f472b6);border:none;color:#fff;font-size:0.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:var(--ffb)">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Z"/></svg>
          Share
        </button>
        <button onclick="simpanRingkasan()" style="flex:1;height:44px;border-radius:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);color:var(--tx);font-size:0.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:var(--ffb)">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
          Simpan Gambar
        </button>
      </div>
    `);
    saveExportHistory('Ringkasan', bulan, tahun, rows.length);
    updateHistoryUI();
  }, 300);
}

// ── SHARE RINGKASAN ──
async function shareRingkasan() {
  const card = document.getElementById('ringkasanCard');
  if (!card) return;

  // Coba Web Share API dulu (native share sheet iOS/Android)
  if (navigator.share) {
    try {
      const canvas = await renderToCanvas(card);
      canvas.toBlob(async blob => {
        const file = new File([blob], 'SHIF_Ringkasan.png', { type: 'image/png' });
        await navigator.share({
          title: 'Laporan Keuangan SHIF',
          files: [file],
        });
      }, 'image/png');
      return;
    } catch(e) {
      if (e.name !== 'AbortError') console.warn('Share gagal:', e);
    }
  }
  // Fallback ke simpan gambar
  simpanRingkasan();
}

// ── SIMPAN GAMBAR ──
async function simpanRingkasan() {
  const card = document.getElementById('ringkasanCard');
  if (!card) { toast('Konten tidak ditemukan', 'err'); return; }

  toast('Membuat gambar...', '');

  try {
    const canvas = await renderToCanvas(card);
    const a = document.createElement('a');
    a.download = `SHIF_Ringkasan_${new Date().toLocaleDateString('id-ID').replace(/\//g,'-')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    toast('Gambar berhasil disimpan ✓', 'ok');
  } catch(e) {
    toast('Gagal buat gambar: ' + e.message, 'err');
  }
}

// ── RENDER HTML KE CANVAS ──
async function renderToCanvas(el) {
  // Load html2canvas jika belum ada
  if (typeof html2canvas === 'undefined') {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const canvas = await html2canvas(el, {
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0d1b3e',
    scale: 2, // retina quality
    useCORS: true,
    logging: false,
    width: el.offsetWidth,
    height: el.offsetHeight,
  });

  return canvas;
}

// Update history di UI tanpa close modal
function updateHistoryUI() {
  const el = document.getElementById('expHistoryList');
  if (!el) return;
  const history = getExportHistory();
  el.innerHTML = history.length
    ? history.map(h => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--glass);border:1px solid var(--glass-bdr);border-radius:8px;margin-bottom:4px">
          <div>
            <div style="font-size:0.75rem;font-weight:600;color:var(--tx)">${h.label} · ${h.type.toUpperCase()}</div>
            <div style="font-size:0.62rem;color:var(--tx3)">${fmtWaktu(h.waktu)} · ${h.jumlahBaris} baris</div>
          </div>
          <div style="font-size:0.65rem;padding:2px 8px;border-radius:50px;background:rgba(56,189,248,0.1);color:var(--ac);font-weight:600">${h.type}</div>
        </div>`).join('')
    : `<div style="text-align:center;color:var(--tx3);font-size:0.75rem;padding:12px">Belum ada riwayat export</div>`;
}
