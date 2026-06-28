// ═══ SUBMIT INPUT TRANSAKSI ═══
async function submitInput(){
  const tgl   = document.getElementById('inTgl').value;
  const jenis = document.getElementById('inJenis').value;
  const kat   = document.getElementById('inKat').value;
  const nom   = getNomVal('inNom');
  const met   = document.getElementById('inMetode').value;
  const bank  = document.getElementById('inBank').value;
  const ket   = document.getElementById('inKet').value.trim();

  if(!tgl||!jenis||!kat||!nom){toast('Lengkapi data transaksi','err');return}

  const bulan = MOS[new Date(tgl).getMonth()];
  const session = getSession();

  const btn = document.querySelector('#ovInput .btn-ok');
  if(btn){btn.disabled=true;btn.textContent='Menyimpan...';}

  try{
    await sheetsAppend({
      tanggal: tgl,
      bulan,
      kategori: kat,
      nominal: nom,
      pembayaran: bank||'Cash',
      detail: ket,
      metode: met,
      jenis,
      recorded_by: session?.username||''
    });
    closeOv(null,'ovInput');
    toast(`${IC.ok} Transaksi disimpan!`,'ok');
    allRows=[];
    await fetchDBOptions();
    await loadDashboard();
    if(document.getElementById('pg-data')?.classList.contains('on'))loadData();
  }catch(e){
    toast('Gagal simpan: '+e.message,'err');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='Simpan';}
  }
}

// ═══ OPEN EDIT ═══
function openEdit(id){
  const r=allRows.find(x=>x.id===id||x.rowIndex===id);
  if(!r)return;
  document.getElementById('eId').value=r.id||r.rowIndex;
  document.getElementById('eTgl').value=r.tanggal;
  syncBulan('e');
  document.getElementById('eJenis').value=r.jenis;
  fillKat('eJenis','eKat');
  setTimeout(()=>{document.getElementById('eKat').value=r.kategori},80);
  document.getElementById('eNom').value=Number(r.nominal).toLocaleString('id-ID');
  document.getElementById('eMetode').value=r.metode||'';
  fillBank('eBank',r.pembayaran||'');
  syncMetodeBank('eMetode','eBank');
  document.getElementById('eBank').value=r.pembayaran||'';
  document.getElementById('eKet').value=r.detail||'';
  closeBs();
  openOv('ovEdit');
}

// ═══ SUBMIT EDIT ═══
async function submitEdit(){
  const id    = document.getElementById('eId').value;
  const tgl   = document.getElementById('eTgl').value;
  const jenis = document.getElementById('eJenis').value;
  const kat   = document.getElementById('eKat').value;
  const nom   = getNomVal('eNom');
  const met   = document.getElementById('eMetode').value;
  const bank  = document.getElementById('eBank').value;
  const ket   = document.getElementById('eKet').value.trim();

  if(!id||!tgl||!jenis||!kat||!nom){toast('Lengkapi data','err');return}

  const bulan = MOS[new Date(tgl).getMonth()];
  const btn   = document.querySelector('#ovEdit .btn-ok');
  if(btn){btn.disabled=true;btn.textContent='Menyimpan...';}

  try{
    await sheetsUpdate(id,{tanggal:tgl,bulan,kategori:kat,nominal:nom,pembayaran:bank||'Cash',detail:ket,metode:met,jenis});

    // Sinkron tabungan_history jika kategori Tabungan dan nominal berubah
    if(kat==='Tabungan'){
      const hid=getHouseholdId();
      try{
        await fetch(`${API_URL}/api/sheets?action=update-tabungan-history-by-transaksi`,{
          method:'PUT',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({transaksi_id:String(id),household_id:hid,nominal:nom})
        });
      }catch(e2){console.warn('Sinkron tabungan gagal:',e2);}
    }

    closeOv(null,'ovEdit');
    toast(`${IC.ok} Transaksi diperbarui!`,'ok');
    allRows=[];
    await fetchDBOptions();
    await loadDashboard();
    if(document.getElementById('pg-data')?.classList.contains('on'))loadData();
  }catch(e){
    toast('Gagal update: '+e.message,'err');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='Simpan';}
  }
}

// ═══ CONFIRM DELETE ═══
function confirmDelete(id){
  const r=allRows.find(x=>x.id===id||x.rowIndex===id);
  if(!r)return;
  document.getElementById('cfmTitle').textContent='Hapus Transaksi';
  document.getElementById('cfmMsg').textContent=`Hapus transaksi "${r.kategori}" senilai ${rp(r.nominal)}? Tindakan ini tidak dapat diurungkan.`;
  document.getElementById('cfmOk').onclick=()=>doDelete(id);
  closeBs();
  openOv('ovConfirm');
}

async function doDelete(id){
  try{
    // Cek apakah transaksi ini terhubung ke tabungan
    const hid=getHouseholdId();
    const r=allRows.find(x=>x.id===id||x.rowIndex===id);

    await sheetsDelete(id);

    // Sinkron tabungan_history jika kategori Tabungan
    if(r?.kategori==='Tabungan'){
      try{
        await fetch(`${API_URL}/api/sheets?action=delete-tabungan-history-by-transaksi&transaksi_id=${encodeURIComponent(String(id))}&household_id=${hid}`,{
          method:'DELETE'
        });
      }catch(e2){console.warn('Sinkron hapus tabungan gagal:',e2);}
    }

    closeOv(null,'ovConfirm');
    toast('Transaksi dihapus','ok');
    allRows=[];
    await loadDashboard();
    if(document.getElementById('pg-data')?.classList.contains('on'))loadData();
  }catch(e){
    toast('Gagal hapus: '+e.message,'err');
  }
}

// ═══════════════════════════════════════════════════
// AI SCAN STRUK — GEMINI (3 KEY ROTATE + COUNTDOWN)
// ═══════════════════════════════════════════════════

let _scanCountdownInterval = null;

// Dipanggil setiap modal input dibuka — cek & lanjut countdown jika masih aktif
function initAiScanUI() {
  const remaining = getScanCooldownRemaining();
  if (remaining > 0) {
    startScanCountdownUI(remaining, getScanCooldownMsg());
  } else {
    resetScanBtn();
  }
}

function resetScanBtn() {
  const btn = document.getElementById('btnAiScan');
  const info = document.getElementById('aiScanCooldownInfo');
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></svg>Scan Struk`;
  }
  if (info) info.style.display = 'none';
  if (_scanCountdownInterval) { clearInterval(_scanCountdownInterval); _scanCountdownInterval = null; }
}

function startScanCountdownUI(seconds, msg) {
  const btn = document.getElementById('btnAiScan');
  const info = document.getElementById('aiScanCooldownInfo');
  if (!btn) return;

  btn.disabled = true;
  if (info) { info.style.display = 'block'; info.textContent = msg; }

  if (_scanCountdownInterval) clearInterval(_scanCountdownInterval);

  const tick = () => {
    const rem = getScanCooldownRemaining();
    if (rem <= 0) {
      clearScanCooldown();
      resetScanBtn();
      return;
    }
    const m = Math.floor(rem / 60);
    const s = rem % 60;
    const label = m > 0 ? `${m}m ${s}s` : `${s}s`;
    btn.innerHTML = `⏳ Tunggu ${label}`;
  };

  tick(); // langsung update sekali
  _scanCountdownInterval = setInterval(tick, 1000);
}

function triggerAiScan() {
  // Cek cooldown dulu
  if (getScanCooldownRemaining() > 0) return;
  document.getElementById('aiImgInput')?.click();
}

async function handleAiScanImg(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  event.target.value = '';

  if (getScanCooldownRemaining() > 0) {
    startScanCountdownUI(getScanCooldownRemaining(), getScanCooldownMsg());
    return;
  }

  const ov       = document.getElementById('aiScanOv');
  const preview  = document.getElementById('aiScanPreview');
  const lbl      = document.getElementById('aiScanLbl');
  const cancelBtn= document.getElementById('aiScanCancel');

  if (ov) ov.style.display = 'flex';
  if (cancelBtn) cancelBtn.style.display = 'none';

  // Compress & resize sebelum kirim
  if (lbl) lbl.textContent = 'Memproses gambar...';
  let base64, mimeOut = 'image/jpeg';
  try {
    base64 = await resizeAndCompress(file);
  } catch {
    base64 = await new Promise(res => {
      const reader = new FileReader();
      reader.onload = e => res(e.target.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    mimeOut = file.type || 'image/jpeg';
  }

  if (preview) preview.src = URL.createObjectURL(file);

  aiScanAbort = false;
  if (cancelBtn) cancelBtn.style.display = 'block';
  if (lbl) lbl.textContent = 'Menganalisis struk...';

  // Ambil kategori & bank yang aktif dari dbOpts
  const categories = dbOpts?.kategoris || [];
  const banks = dbOpts?.banks || [];

  try {
    const result = await callParseImage(base64, mimeOut, categories, banks);
    if (aiScanAbort) return;
    if (ov) ov.style.display = 'none';
    applyAIResult(result);
    toast('Struk berhasil dibaca ✓', 'ok');
  } catch (e) {
    if (ov) ov.style.display = 'none';
    if (aiScanAbort) return;

    const status = e.status || 0;
    let cooldownSec, errMsg;

    if (status === 429) {
      cooldownSec = 60;
      errMsg = `⚠️ API sedang rate-limited. Tunggu 1 menit`;
    } else if (status === 422) {
      cooldownSec = 10;
      errMsg = `⚠️ Gambar tidak terbaca. Coba foto lebih jelas`;
    } else if (status >= 500) {
      cooldownSec = 30;
      errMsg = `⚠️ Server error. Tunggu 30 detik`;
    } else {
      cooldownSec = 15;
      errMsg = `⚠️ Gagal: ${e.message || 'Unknown error'}`;
    }

    setScanCooldown(cooldownSec, errMsg);
    startScanCountdownUI(cooldownSec, errMsg);
    toast(errMsg, 'err');
  }
}

// Panggil /api/parse-image — key dirotasi di server dengan retry & delay
async function callParseImage(base64Data, mimeType, categories = [], banks = []) {
  const res = await fetch(`${API_URL}/api/parse-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: base64Data,
      mimeType,
      categories,
      banks,
    })
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(json.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  // Response langsung berupa object hasil parse (bukan {success, data})
  if (typeof json !== 'object' || !json) throw new Error('Respons server tidak valid');
  return json;
}

function applyAIResult(data) {
  if (!data) return;

  // Tanggal — support YYYY-MM-DD dan DD/MM/YYYY
  if (data.tanggal) {
    let tglVal = data.tanggal;
    // Konversi DD/MM/YYYY → YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(tglVal)) {
      const [d,m,y] = tglVal.split('/');
      tglVal = `${y}-${m}-${d}`;
    }
    const tglEl = document.getElementById('inTgl');
    if (tglEl && tglVal) { tglEl.value = tglVal; syncBulan('in'); }
  }

  // Jenis
  if (data.jenis) {
    const jenisEl = document.getElementById('inJenis');
    if (jenisEl) {
      jenisEl.value = data.jenis;
      fillKat('inJenis', 'inKat');
      if (typeof renderQuickKat === 'function') renderQuickKat();
    }
  }

  // Kategori (setelah fillKat)
  if (data.kategori) {
    setTimeout(() => {
      const katEl = document.getElementById('inKat');
      if (katEl) {
        const opts = [...katEl.options];
        const match = opts.find(o => o.value.toLowerCase() === (data.kategori||'').toLowerCase());
        if (match) {
          katEl.value = match.value;
        } else {
          const opt = document.createElement('option');
          opt.value = data.kategori;
          opt.textContent = data.kategori;
          katEl.appendChild(opt);
          katEl.value = data.kategori;
        }
      }
    }, 120);
  }

  // Nominal
  if (data.nominal) {
    const nomEl = document.getElementById('inNom');
    if (nomEl) nomEl.value = Number(data.nominal).toLocaleString('id-ID');
  }

  // Metode
  if (data.metode) {
    const metEl = document.getElementById('inMetode');
    if (metEl) {
      metEl.value = data.metode;
      syncMetodeBank('inMetode', 'inBank');
    }
  }

  // Bank — dari field 'bank' (SE_REAL format)
  const bankVal = data.bank || data.pembayaran || '';
  if (bankVal) {
    setTimeout(() => {
      const bankEl = document.getElementById('inBank');
      if (bankEl) {
        const opts = [...bankEl.options];
        const match = opts.find(o =>
          o.value.toLowerCase() === bankVal.toLowerCase() ||
          bankVal.toLowerCase().includes(o.value.toLowerCase())
        );
        if (match) bankEl.value = match.value;
      }
    }, 150);
  }

  // Keterangan
  if (data.keterangan) {
    const ketEl = document.getElementById('inKet');
    if (ketEl) ketEl.value = data.keterangan;
  }
}

function cancelAiScan() {
  aiScanAbort = true;
  const ov = document.getElementById('aiScanOv');
  if (ov) ov.style.display = 'none';
}

// ═══ SETTINGS MODAL ═══
function openSettModal(type){
  settModalType=type;
  const title=document.getElementById('settModalTitle');
  const body =document.getElementById('settModalBody');
  const ft   =document.querySelector('#ovSett .modal-ft');

  const hideFt=()=>{if(ft)ft.style.display='none'};
  const showFt=()=>{if(ft)ft.style.display='flex'};
  showFt();

  if(type==='anggaran'){
    title.textContent='Anggaran per Kategori';
    const now=new Date();
    anggaranModalYear=now.getFullYear();anggaranModalMonth=now.getMonth();
    renderAnggaranModal(body);
    hideFt();
  }
  else if(type==='kategori'){
    title.textContent='Kelola Kategori';
    const customKats=JSON.parse(localStorage.getItem('mm_custom_kats')||'[]');
    const allKats=[...new Set([...allRows.map(r=>r.kategori).filter(Boolean),...customKats])].sort();
    body.innerHTML=`
      <div style="margin-bottom:10px;display:flex;gap:8px">
        <input type="text" id="newKatInput" class="inp" placeholder="Tambah kategori baru..." style="flex:1">
        <button class="btn-ok" style="padding:10px 14px" onclick="addCustomKat()">+</button>
      </div>
      <div id="katList">${allKats.map(k=>`<div class="sett-tag-item"><span>${k}</span><button onclick="removeKat('${k.replace(/'/g,"\\'")}')">×</button></div>`).join('')}</div>
    `;
    hideFt();
  }
  else if(type==='rekening'){
    title.textContent='Kelola Rekening';
    const customBanks=JSON.parse(localStorage.getItem('mm_custom_banks')||'[]');
    const BUKAN_BANK=['cash','transfer','qris'];
    const allBanks=[...new Set([...allRows.map(r=>r.pembayaran).filter(b=>b&&!BUKAN_BANK.includes(b.toLowerCase())),...customBanks])].sort();
    body.innerHTML=`
      <div style="margin-bottom:10px;display:flex;gap:8px">
        <input type="text" id="newBankInput" class="inp" placeholder="Tambah rekening baru..." style="flex:1">
        <button class="btn-ok" style="padding:10px 14px" onclick="addCustomBank()">+</button>
      </div>
      <div id="bankList">${allBanks.map(b=>`<div class="sett-tag-item"><span>${b}</span><button onclick="removeBank('${b.replace(/'/g,"\\'")}')">×</button></div>`).join('')}</div>
    `;
    hideFt();
  }
  else if(type==='periode'){
    title.textContent='Periode Keuangan';
    const cur=JSON.parse(localStorage.getItem('mm_periode')||'{}');
    const isManual=!!(cur.startDate&&cur.endDate&&cur.isManual);
    const{startDate,endDate}=getActivePeriodResolved();
    body.innerHTML=`
      <p style="font-size:0.78rem;color:var(--tx2);margin-bottom:14px;line-height:1.6">
        Default: <b>per bulan kalender</b> — navigasi ‹ › di dashboard.<br>
        Mode manual: set tanggal mulai & selesai sendiri.
      </p>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:10px 12px;background:var(--glass);border:1px solid var(--bdr2);border-radius:12px">
        <div>
          <div style="font-size:0.82rem;font-weight:700;color:var(--tx)">Mode Manual</div>
          <div style="font-size:0.65rem;color:var(--tx3)">Set tanggal periode sendiri</div>
        </div>
        <button class="sett-toggle ${isManual?'on':''}" id="periodeManualToggle" onclick="togglePeriodeManual()"></button>
      </div>
      <div id="periodeInputs" style="display:${isManual?'block':'none'}">
        <div class="inp-row"><label class="inp-lbl">Mulai</label><input type="date" id="periodeStart" class="inp" value="${cur.startDate?cur.startDate.slice(0,10):startDate.toISOString().slice(0,10)}"></div>
        <div class="inp-row"><label class="inp-lbl">Selesai</label><input type="date" id="periodeEnd" class="inp" value="${cur.endDate?cur.endDate.slice(0,10):endDate.toISOString().slice(0,10)}"></div>
      </div>
      <div id="periodeOtoInfo" style="display:${isManual?'none':'block'};text-align:center;padding:16px;color:var(--tx3);font-size:0.8rem">
        ✓ Mode otomatis aktif — gunakan ‹ › di dashboard untuk pindah bulan
      </div>
    `;
  }
  else if(type==='alertpct'){
    title.textContent='Batas Peringatan';
    body.innerHTML=`
      <p style="font-size:0.78rem;color:var(--tx2);margin-bottom:12px">Notifikasi muncul saat pengeluaran mencapai persentase ini dari anggaran.</p>
      <div class="inp-row"><label class="inp-lbl">Persentase (%)</label><input type="number" id="alertPctInput" class="inp" min="1" max="100" value="${alertPct}"></div>
    `;
  }
  else if(type==='katrata'){
    title.textContent='Kategori Rata-rata Harian';
    const fixedCats=JSON.parse(localStorage.getItem('mm_fixed_cats')||'["Tabungan","Piutang","Kos","Tf Rumah","Listrik Rumah","Internet","Listrik"]');
    // Hanya tampilkan kategori Pengeluaran — bukan Pemasukan
    const KAT_PMS=typeof KAT_PEMASUKAN!=='undefined'?KAT_PEMASUKAN:['Gaji','Bonus','Freelance','Transfer Masuk','Investasi','Lainnya'];
    const allKats=[...new Set(
      allRows
        .filter(r=>r.jenis==='Pengeluaran')
        .map(r=>r.kategori)
        .filter(k=>k&&!KAT_PMS.includes(k))
    )].sort();
    body.innerHTML=`
      <p style="font-size:0.78rem;color:var(--tx2);margin-bottom:12px">Kategori yang dicentang akan <b>dikecualikan</b> dari perhitungan rata-rata harian (pengeluaran tetap).</p>
      <div id="fixedCatList">${allKats.map(k=>`<label class="sett-check-item"><input type="checkbox" value="${k}" ${fixedCats.includes(k)?'checked':''}> ${k}</label>`).join('')}</div>
    `;
  }
  else if(type==='fixedcat'){
    title.textContent='Pengeluaran Tetap';
    openSettModal('katrata');return;
  }

  openOv('ovSett');
}

function renderAnggaranModal(body){
  const key=getBudgetMonthKey(anggaranModalYear,anggaranModalMonth);
  const budgets=getBudgetsForMonth(key);
  const allKats=[...new Set([...allRows.map(r=>r.kategori).filter(Boolean),...JSON.parse(localStorage.getItem('mm_custom_kats')||'[]')])].sort();
  body.innerHTML=`
    <div class="ang-nav">
      <button class="kal-nav-btn" onclick="changeAnggaranMonth(-1)">‹</button>
      <span style="font-weight:600;font-size:0.88rem">${MOS[anggaranModalMonth]} ${anggaranModalYear}</span>
      <button class="kal-nav-btn" onclick="changeAnggaranMonth(1)">›</button>
    </div>
    ${allKats.map(k=>`
      <div class="ang-row">
        <label class="ang-lbl">${k}</label>
        <input type="text" class="ang-inp inp" data-kat="${k}" inputmode="numeric" oninput="fmtNom(this)" value="${budgets[k]?Number(budgets[k]).toLocaleString('id-ID'):''}">
      </div>
    `).join('')}
    <button class="btn-ok" style="width:100%;margin-top:12px" onclick="saveAnggaran()">Simpan Anggaran</button>
  `;
}

function changeAnggaranMonth(d){
  anggaranModalMonth+=d;
  if(anggaranModalMonth>11){anggaranModalMonth=0;anggaranModalYear++;}
  else if(anggaranModalMonth<0){anggaranModalMonth=11;anggaranModalYear--;}
  renderAnggaranModal(document.getElementById('settModalBody'));
}

function saveAnggaran(){
  const key=getBudgetMonthKey(anggaranModalYear,anggaranModalMonth);
  const budgets={};
  document.querySelectorAll('.ang-inp').forEach(el=>{
    const nom=Number(el.value.replace(/\./g,'').replace(/[^0-9]/g,''))||0;
    if(nom>0)budgets[el.dataset.kat]=nom;
  });
  saveBudget(key,budgets);
  closeOv(null,'ovSett');
  toast('Anggaran disimpan ✓','ok');
  loadDashboard();
}

function saveSettModal(){
  if(settModalType==='periode'){
    const isManual=document.getElementById('periodeManualToggle')?.classList.contains('on');
    if(isManual){
      const start=document.getElementById('periodeStart')?.value;
      const end  =document.getElementById('periodeEnd')?.value;
      if(!start||!end){toast('Isi tanggal periode','err');return}
      localStorage.setItem('mm_periode',JSON.stringify({startDate:start,endDate:end,isManual:true}));
      updatePeriodUI();
      toast('Periode manual disimpan ✓','ok');
      pushSettings();
      closeOv(null,'ovSett');
      allRows=[];loadDashboard();
    } else {
      resetPeriode();
    }
  }
  else if(settModalType==='alertpct'){
    const v=parseInt(document.getElementById('alertPctInput')?.value)||80;
    alertPct=Math.min(100,Math.max(1,v));
    const s=JSON.parse(localStorage.getItem('mm_settings')||'{}');
    s.alertPct=alertPct;localStorage.setItem('mm_settings',JSON.stringify(s));
    document.getElementById('alertPctLabel').textContent=`${alertPct}% dari anggaran`;
    toast('Batas diperbarui ✓','ok');pushSettings();closeOv(null,'ovSett');
  }
  else if(settModalType==='katrata'||settModalType==='fixedcat'){
    const checked=[...document.querySelectorAll('#fixedCatList input:checked')].map(el=>el.value);
    localStorage.setItem('mm_fixed_cats',JSON.stringify(checked));
    const lbl=document.getElementById('katRataLabel');
    if(lbl)lbl.textContent=checked.length?`${checked.length} kategori dikecualikan`:'Pilih kategori yang dihitung';
    toast('Pengaturan disimpan ✓','ok');pushSettings();closeOv(null,'ovSett');loadDashboard();
  }
  else{closeOv(null,'ovSett');}
}

function resetPeriode(){
  localStorage.removeItem('mm_periode');
  updatePeriodUI();
  toast('Periode direset ke otomatis','ok');
  pushSettings();
  closeOv(null,'ovSett');
  allRows=[];loadDashboard();
}

function togglePeriodeManual(){
  const toggle=document.getElementById('periodeManualToggle');
  const inputs=document.getElementById('periodeInputs');
  const otoInfo=document.getElementById('periodeOtoInfo');
  if(!toggle)return;
  const nowOn=toggle.classList.toggle('on');
  if(inputs)inputs.style.display=nowOn?'block':'none';
  if(otoInfo)otoInfo.style.display=nowOn?'none':'block';
  if(!nowOn){
    // Reset ke otomatis langsung
    resetPeriode();
  }
}

// ═══ KELOLA KATEGORI ═══
function addCustomKat(){
  const v=document.getElementById('newKatInput')?.value.trim();
  if(!v)return;
  const kats=JSON.parse(localStorage.getItem('mm_custom_kats')||'[]');
  if(!kats.includes(v)){kats.push(v);localStorage.setItem('mm_custom_kats',JSON.stringify(kats));}
  fetchDBOptions();
  openSettModal('kategori');
  toast('Kategori ditambahkan ✓','ok');
  pushSettings();
}

function removeKat(k){
  const kats=JSON.parse(localStorage.getItem('mm_custom_kats')||'[]');
  localStorage.setItem('mm_custom_kats',JSON.stringify(kats.filter(x=>x!==k)));
  fetchDBOptions();openSettModal('kategori');pushSettings();
}

// ═══ KELOLA REKENING ═══
function addCustomBank(){
  const v=document.getElementById('newBankInput')?.value.trim();
  if(!v)return;
  const banks=JSON.parse(localStorage.getItem('mm_custom_banks')||'[]');
  if(!banks.includes(v)){banks.push(v);localStorage.setItem('mm_custom_banks',JSON.stringify(banks));}
  fetchDBOptions();openSettModal('rekening');
  toast('Rekening ditambahkan ✓','ok');pushSettings();
}

function removeBank(b){
  const banks=JSON.parse(localStorage.getItem('mm_custom_banks')||'[]');
  localStorage.setItem('mm_custom_banks',JSON.stringify(banks.filter(x=>x!==b)));
  fetchDBOptions();openSettModal('rekening');pushSettings();
}

// ═══ TOGGLE NOTIF ═══
function toggleNotif(){
  notifEnabled=!notifEnabled;
  const btn=document.getElementById('notifToggle');if(btn)btn.classList.toggle('on',notifEnabled);
  const s=JSON.parse(localStorage.getItem('mm_settings')||'{}');
  s.notifEnabled=notifEnabled;localStorage.setItem('mm_settings',JSON.stringify(s));
  toast(`Notifikasi ${notifEnabled?'aktif':'nonaktif'}`,notifEnabled?'ok':'');
  pushSettings();
}

// ═══ LOAD SETTINGS KE UI ═══
function loadSettings(){
  const s=JSON.parse(localStorage.getItem('mm_settings')||'{}');
  if(s.notifEnabled!==undefined)notifEnabled=s.notifEnabled;
  if(s.alertPct)alertPct=s.alertPct;

  const notifBtn=document.getElementById('notifToggle');
  if(notifBtn)notifBtn.classList.toggle('on',notifEnabled);
  const pctLbl=document.getElementById('alertPctLabel');
  if(pctLbl)pctLbl.textContent=`${alertPct}% dari anggaran`;

  const fixedCats=JSON.parse(localStorage.getItem('mm_fixed_cats')||'[]');
  const katLbl=document.getElementById('katRataLabel');
  if(katLbl)katLbl.textContent=fixedCats.length?`${fixedCats.length} kategori dikecualikan`:'Pilih kategori yang dihitung';

  const session=getSession();
  if(session){
    const av=document.getElementById('settAvatar');
    if(av){
      av.style.cssText=`width:64px;height:64px;border-radius:20px;background:${session.color}20;border:2px solid ${session.color};display:flex;align-items:center;justify-content:center;margin:0 auto 8px`;
      av.innerHTML=`<span style="color:${session.color};font-size:1.8rem;font-weight:800">${session.username.charAt(0).toUpperCase()}</span>`;
    }
    const unEl=document.getElementById('settUsername');if(unEl)unEl.textContent=session.username;
    const ulEl=document.getElementById('settUserLogin');if(ulEl){ulEl.textContent='SHIF';ulEl.style.color=session.color;}
  }
  updateSettAvatar();
}

// ═══ LOAD THEME ═══
function loadTheme(){
  const t=localStorage.getItem('mm_t')||'cosmic';
  setTheme(t,false);
}

// ═══ EDIT MODE TOGGLE ═══
function toggleEditMode(){
  editMode=!editMode;
  toast(editMode?'Edit mode aktif':'Edit mode nonaktif',editMode?'ok':'');
  if(document.getElementById('pg-data')?.classList.contains('on'))renderCards(getFilteredRows());
}

// ═══ DRAWER MEMBERS ═══
function renderDrawerMembers(){
  const el=document.getElementById('drawerMembers');if(!el)return;
  const members=getHouseholdMembers();
  if(members.length<2){el.innerHTML='';return;}
  el.innerHTML=`<div class="drawer-members-row">${members.map(m=>`
    <div class="drawer-member-item">
      <div class="hdr-member-av" style="width:32px;height:32px;border-radius:10px;background:${m.color}20;border:1.5px solid ${m.color}">
        <span style="color:${m.color};font-size:0.75rem;font-weight:700">${m.username.charAt(0).toUpperCase()}</span>
      </div>
      <span style="font-size:0.72rem;color:var(--tx2)">${m.username}</span>
    </div>
  `).join('')}</div>`;
}

// ═══ ONCHANGE HELPERS ═══
function onJenisChange(prefix){
  fillKat(prefix+'Jenis',prefix+'Kat');
  if(prefix==='in')renderQuickKat();
}

function onMetodeChange(prefix){
  const met=document.getElementById(prefix+'Metode')?.value;
  const bankRow=document.getElementById(prefix+'Bank')?.closest('.inp-row');
  if(bankRow)bankRow.style.display=met==='Cash'?'none':'';
}

// ═══ INIT ═══
document.addEventListener('DOMContentLoaded',()=>{
  loadTheme();
  loadSettings();
  renderDrawerMembers();
  initFilterWho();
  document.getElementById('filterBulan')?.addEventListener('change',loadData);
  document.getElementById('filterJenis')?.addEventListener('change',loadData);
  // Filter search di halaman data
  document.getElementById('dataSearch')?.addEventListener('input',renderFilteredData);
});

// Hook: setiap input modal dibuka, init AI scan UI
function openInputModal(){
  // Set tanggal hari ini
  const tgl=document.getElementById('inTgl');
  if(tgl&&!tgl.value)tgl.value=new Date().toISOString().slice(0,10);
  syncBulan('in');
  fillKat('inJenis','inKat');
  renderQuickKat();
  fillBank('inBank','');
  // Label recorded by
  const recBy=document.getElementById('inputRecBy');
  const session=getSession();
  if(recBy&&session){
    recBy.innerHTML=`<span style="color:${session.color}">${IC.users} Dicatat oleh: <b>${session.username}</b></span>`;
  }
  openOv('ovInput');
  // Init AI scan countdown (lanjut jika modal dibuka lagi saat countdown masih jalan)
  initAiScanUI();
}

// ═══════════════════════════════════════════
// FILTER PENCARIAN HALAMAN DATA
// ═══════════════════════════════════════════

// Cache rows terfilter untuk search
let _filteredForSearch = [];

// Dipanggil dari loadData di dashboard.js setelah renderCards
// Kita override renderCards supaya juga update _filteredForSearch
const _origRenderCards = typeof renderCards === 'function' ? renderCards : null;

function renderFilteredData() {
  const q = (document.getElementById('dataSearch')?.value || '').toLowerCase().trim();
  if (!q) {
    renderCards(_filteredForSearch.length ? _filteredForSearch : getFilteredRows());
    return;
  }
  const rows = (_filteredForSearch.length ? _filteredForSearch : getFilteredRows()).filter(r => {
    return (
      (r.kategori||'').toLowerCase().includes(q) ||
      (r.detail||'').toLowerCase().includes(q) ||
      (r.pembayaran||'').toLowerCase().includes(q) ||
      (r.jenis||'').toLowerCase().includes(q) ||
      String(r.nominal).includes(q) ||
      (r.tanggal||'').includes(q) ||
      (r.bulan||'').toLowerCase().includes(q) ||
      (r.recorded_by||'').toLowerCase().includes(q)
    );
  });
  renderCards(rows);
}

// Expose supaya dashboard.js bisa set _filteredForSearch setelah filter bulan/jenis
function setFilteredForSearch(rows) {
  _filteredForSearch = rows;
  // Re-render dengan search query saat ini
  renderFilteredData();
}

// ═══ RESIZE & COMPRESS GAMBAR (sebelum kirim ke Gemini) ═══
// Resize max 1024px, compress jadi JPEG 0.85
// Otomatis handle HEIC dari iPhone karena canvas output selalu JPEG
async function resizeAndCompress(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        // Turunkan resolusi lebih agresif — target ~600px, quality 0.7
        // Vercel free tier timeout 10s, base64 harus kecil
        const MAX = 600;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        // Output selalu JPEG, quality 0.7 — cukup untuk Gemini baca teks
        const dataUrl = canvas.toDataURL('image/jpeg', 0.70);
        resolve(dataUrl.split(',')[1]);
      } catch(e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal load gambar'));
    };
    img.src = url;
  });
}
