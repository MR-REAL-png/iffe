// ═══ BANK THEMES ═══
const BANK_THEMES = {
  'Jago':      { grad:'linear-gradient(135deg,#d97706,#fbbf24)', motif:'waves',     logo:'jago.png' },
  'Cash':      { grad:'linear-gradient(135deg,#059669,#34d399)', motif:'cash',      logo:null },
  'BCA':       { grad:'linear-gradient(135deg,#1e40af,#3b82f6)', motif:'lines',     logo:'bca.png' },
  'Seabank':   { grad:'linear-gradient(135deg,#ea580c,#f97316)', motif:'triangles', logo:'seabank.png' },
  'Dana':      { grad:'linear-gradient(135deg,#2563eb,#7c3aed)', motif:'circles',   logo:'dana.png' },
  'Shopeepay': { grad:'linear-gradient(135deg,#dc2626,#f97316)', motif:'dots',      logo:'shopeepay.png' },
  'GoPay':     { grad:'linear-gradient(135deg,#047857,#10b981)', motif:'waves',     logo:'gopay.png' },
  'OVO':       { grad:'linear-gradient(135deg,#6d28d9,#8b5cf6)', motif:'circles',   logo:'ovo.png' },
  'Mandiri':   { grad:'linear-gradient(135deg,#b45309,#f59e0b)', motif:'lines',     logo:'mandiri.png' },
  'BNI':       { grad:'linear-gradient(135deg,#1d4ed8,#3b82f6)', motif:'dots',      logo:'bni.png' },
  'BRI':       { grad:'linear-gradient(135deg,#991b1b,#dc2626)', motif:'waves',     logo:'bri.png' },
  'default':   { grad:'linear-gradient(135deg,#0ea5e9,#f472b6)', motif:'dots',      logo:null },
};

function getBankTheme(name){
  const key=Object.keys(BANK_THEMES).find(k=>name&&name.toLowerCase().includes(k.toLowerCase()));
  return BANK_THEMES[key]||BANK_THEMES.default;
}

function getBankMotifSVG(motif){
  const c='rgba(255,255,255,0.15)';
  if(motif==='waves')return`<svg style="position:absolute;bottom:0;right:0;width:60%;opacity:0.3" viewBox="0 0 200 100"><path d="M0,50 Q50,20 100,50 T200,50 T300,50" fill="none" stroke="${c}" stroke-width="2"/><path d="M0,70 Q50,40 100,70 T200,70 T300,70" fill="none" stroke="${c}" stroke-width="2"/><path d="M0,30 Q50,0 100,30 T200,30 T300,30" fill="none" stroke="${c}" stroke-width="2"/></svg>`;
  if(motif==='lines')return`<svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.15" viewBox="0 0 300 160">${Array.from({length:12},(_,i)=>`<line x1="0" y1="${i*15}" x2="300" y2="${i*15}" stroke="white" stroke-width="1"/>`).join('')}</svg>`;
  if(motif==='circles')return`<svg style="position:absolute;right:-20px;bottom:-20px;width:55%;opacity:0.2" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="white" stroke-width="2"/><circle cx="60" cy="60" r="35" fill="none" stroke="white" stroke-width="2"/><circle cx="60" cy="60" r="20" fill="none" stroke="white" stroke-width="2"/></svg>`;
  if(motif==='triangles')return`<svg style="position:absolute;right:0;top:0;width:50%;opacity:0.15" viewBox="0 0 150 150"><polygon points="75,10 140,130 10,130" fill="none" stroke="white" stroke-width="2"/><polygon points="75,40 120,120 30,120" fill="none" stroke="white" stroke-width="2"/></svg>`;
  if(motif==='cash')return`<svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.1" viewBox="0 0 300 160">${Array.from({length:8},(_,i)=>`<line x1="${i*40}" y1="0" x2="${i*40}" y2="160" stroke="white" stroke-width="1"/>`).join('')}${Array.from({length:6},(_,i)=>`<line x1="0" y1="${i*30}" x2="300" y2="${i*30}" stroke="white" stroke-width="1"/>`).join('')}</svg>`;
  return`<svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.15" viewBox="0 0 300 160">${Array.from({length:40},(_,i)=>`<circle cx="${(i%8)*40+20}" cy="${Math.floor(i/8)*35+20}" r="3" fill="white"/>`).join('')}</svg>`;
}

// ═══ RENDER LOGO BANK ═══
// Jika logo tersedia di GitHub → tampilkan img
// Fallback → nama bank styled text
function renderBankLogo(bank, theme) {
  if (theme.logo) {
    const url = `${BANK_LOGO_BASE}${theme.logo}`;
    const fallbackText = bank.slice(0, 2).toUpperCase();
    return `<img src="${url}"
      style="height:28px;max-width:80px;object-fit:contain;filter:brightness(0) invert(1);display:block"
      onerror="this.outerHTML='<span style=\\'font-size:0.75rem;font-weight:800;color:rgba(255,255,255,0.7);letter-spacing:0.1em\\'>${fallbackText}</span>'"
    >`;
  }
  // Cash atau bank tanpa logo → tampilkan nama pendek
  return `<span style="font-size:0.72rem;font-weight:800;color:rgba(255,255,255,0.7);letter-spacing:0.1em">${bank.slice(0,2).toUpperCase()}</span>`;
}

function renderATMCard(bank, saldo, isActive) {
  const theme = getBankTheme(bank);
  const pos = saldo >= 0;
  return `<div class="atm-card${isActive?' active':''}" style="background:${theme.grad}">
    ${getBankMotifSVG(theme.motif)}
    <!-- Chip -->
    <div style="position:absolute;top:18px;left:18px;width:36px;height:26px;border-radius:5px;background:linear-gradient(135deg,#e0e0e0,#a8a8a8);border:1px solid rgba(255,255,255,0.4)">
      <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(0,0,0,0.12);transform:translateY(-50%)"></div>
      <div style="position:absolute;top:0;bottom:0;left:50%;width:1px;background:rgba(0,0,0,0.1);transform:translateX(-50%)"></div>
    </div>
    <!-- Logo bank kanan atas -->
    <div style="position:absolute;top:14px;right:16px;display:flex;align-items:center;min-height:28px">
      ${renderBankLogo(bank, theme)}
    </div>
    <!-- Saldo -->
    <div style="position:absolute;bottom:36px;left:18px">
      <div style="font-size:0.52rem;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.12em;margin-bottom:3px">Saldo</div>
      <div style="font-size:1.2rem;font-weight:800;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.25)">${pos?'':'-'}${rp(Math.abs(saldo))}</div>
    </div>
    <!-- Nama bank kanan bawah -->
    <div style="position:absolute;bottom:16px;right:18px;font-size:1.05rem;font-weight:800;color:rgba(255,255,255,0.95);letter-spacing:0.03em;text-shadow:0 2px 6px rgba(0,0,0,0.2)">${bank}</div>
  </div>`;
}

// ═══ LOAD DOMPET ═══
async function loadDompet(){
  const el=document.getElementById('dompetContent');if(!el)return;
  el.innerHTML='<div class="ldrow"><div class="spin"></div>Memuat...</div>';
  try{
    if(!allRows.length)allRows=await fetchAllData();
    const BUKAN_BANK=['transfer','qris'];
    const banks=[...new Set(allRows.map(r=>r.pembayaran).filter(b=>b&&!BUKAN_BANK.includes(b.trim().toLowerCase())))].sort();
    const saldoMap={};
    banks.forEach(b=>saldoMap[b]=0);
    allRows.forEach(r=>{
      if(!r.pembayaran||BUKAN_BANK.includes(r.pembayaran.trim().toLowerCase()))return;
      if(r.jenis==='Pemasukan')saldoMap[r.pembayaran]=(saldoMap[r.pembayaran]||0)+r.nominal;
      else if(r.jenis==='Pengeluaran')saldoMap[r.pembayaran]=(saldoMap[r.pembayaran]||0)-r.nominal;
    });

    const transfers=await fetchTransfers();
    transfers.forEach(t=>{
      if(saldoMap.hasOwnProperty(t.dari))saldoMap[t.dari]-=Number(t.nominal);
      if(saldoMap.hasOwnProperty(t.ke))saldoMap[t.ke]+=Number(t.nominal);
    });

    if(!banks.length){
      el.innerHTML=`<div class="empty-state"><div class="empty-ico">💳</div><div class="empty-title">Belum ada rekening</div><div class="empty-sub">Tambahkan transaksi dengan memilih rekening bank</div></div>`;
      return;
    }

    const totalAset=banks.reduce((s,b)=>s+(saldoMap[b]||0),0);
    const icTransfer=`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"/></svg>`;

    const renderMutasi=(bank)=>{
      const filtered=transfers.filter(t=>t.dari===bank||t.ke===bank);
      if(!filtered.length)return`<div style="text-align:center;padding:24px;color:var(--tx3);font-size:0.8rem">Belum ada transfer untuk rekening ini</div>`;
      return filtered.slice(0,20).map(t=>{
        const isMasuk=t.ke===bank;
        const warna=isMasuk?'var(--grn)':'var(--red)';
        const arah=isMasuk?'↓ dari':'↑ ke';
        const pihak=isMasuk?t.dari:t.ke;
        return`<div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--glass);border:1px solid var(--bdr2);border-radius:12px;margin-bottom:8px;cursor:pointer" onclick="openEditTransfer('${encodeURIComponent(JSON.stringify(t))}')">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:50%;background:${isMasuk?'rgba(52,211,153,0.15)':'rgba(248,113,113,0.15)'};display:flex;align-items:center;justify-content:center;color:${warna}">${icTransfer}</div>
            <div>
              <div style="font-size:0.82rem;font-weight:600;color:var(--tx)">${arah} <span style="color:var(--ac)">${pihak}</span></div>
              <div style="font-size:0.65rem;color:var(--tx3)">${t.tanggal}${t.catatan?` · ${t.catatan}`:''}</div>
            </div>
          </div>
          <div style="font-size:0.9rem;font-weight:700;color:${warna}">${isMasuk?'+':'-'}${rp(t.nominal)}</div>
        </div>`;
      }).join('');
    };

    el.innerHTML=`
      <div style="margin-bottom:8px">
        <div class="atm-carousel" id="atmCarousel">
          ${banks.map((b,i)=>renderATMCard(b,saldoMap[b]||0,i===0)).join('')}
        </div>
        <div class="atm-dots" id="atmDots">
          ${banks.map((_,i)=>`<span class="${i===0?'active':''}"></span>`).join('')}
        </div>
      </div>
      <div class="dompet-total">
        <span style="font-size:0.72rem;color:var(--tx3)">Total Aset</span>
        <span style="font-weight:700;color:${totalAset>=0?'var(--grn)':'var(--red)'}">${totalAset>=0?'':'-'}${rp(Math.abs(totalAset))}</span>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button onclick="openTransferModal()" class="btn-ok" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px">
          ${icTransfer} Transfer
        </button>
        <button onclick="openPiutangList()" class="btn-cx" style="flex:1">📋 Piutang</button>
      </div>
      <div class="sec-lbl">Rincian Rekening</div>
      <div id="bankDetailList">
        ${banks.map((b,i)=>{
          const s=saldoMap[b]||0;
          const th=getBankTheme(b);
          return`<div class="bank-detail-card" style="border-left:3px solid ${th.grad.match(/#[0-9a-f]{6}/i)?.[0]||'var(--ac)'}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:0.85rem;font-weight:700;color:var(--tx)">${b}</span>
              <span style="font-size:0.9rem;font-weight:800;color:${s>=0?'var(--grn)':'var(--red)'}">${s>=0?'':'-'}${rp(Math.abs(s))}</span>
            </div>
            <div class="bank-mutasi-list" id="mutasi-${i}" style="display:none">
              ${renderMutasi(b)}
            </div>
            <button onclick="toggleMutasi(${i})" class="toggle-view-btn" id="mutasi-toggle-${i}">Lihat Mutasi</button>
          </div>`;
        }).join('')}
      </div>`;

    // Carousel dots
    const carousel=document.getElementById('atmCarousel');
    const dots=document.getElementById('atmDots')?.querySelectorAll('span');
    if(carousel&&dots){
      carousel.addEventListener('scroll',()=>{
        const idx=Math.round(carousel.scrollLeft/(carousel.offsetWidth));
        dots.forEach((d,i)=>d.classList.toggle('active',i===idx));
        document.querySelectorAll('.atm-card').forEach((c,i)=>c.classList.toggle('active',i===idx));
      },{passive:true});
    }
  }catch(e){
    document.getElementById('dompetContent').innerHTML=`<div class="empty-state"><div class="empty-ico">⚠️</div><div class="empty-title">Gagal memuat</div><div class="empty-sub">${e.message}</div></div>`;
  }
}

function toggleMutasi(i){
  const el=document.getElementById(`mutasi-${i}`);
  const btn=document.getElementById(`mutasi-toggle-${i}`);
  if(!el||!btn)return;
  const show=el.style.display==='none';
  el.style.display=show?'block':'none';
  btn.textContent=show?'Sembunyikan':'Lihat Mutasi';
  btn.classList.toggle('on',show);
}

// ═══ PIUTANG ═══
async function fetchPiutang(){
  const hid=getHouseholdId();
  const res=await fetch(`${API_URL}/api/sheets?action=get-piutang&household_id=${hid}`);
  if(!res.ok)throw new Error('Gagal ambil piutang');
  const json=await res.json();
  return json.data||[];
}

async function openPiutangList(){
  openBs('Piutang','<div class="ldrow"><div class="spin"></div>Memuat...</div>');
  try{
    const list=await fetchPiutang();
    if(!list.length){document.getElementById('bsBody').innerHTML='<div class="empty-state"><div class="empty-ico">📋</div><div class="empty-title">Belum ada piutang</div></div>';return;}
    document.getElementById('bsBody').innerHTML=list.map(p=>`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--glass);border:1px solid var(--bdr2);border-radius:12px;margin-bottom:8px">
        <div>
          <div style="font-size:0.85rem;font-weight:700">${p.nama||'—'}</div>
          <div style="font-size:0.65rem;color:var(--tx3)">${p.tanggal||''}${p.catatan?' · '+p.catatan:''}</div>
        </div>
        <div style="font-size:0.9rem;font-weight:800;color:${p.jenis==='Piutang'?'var(--grn)':'var(--red)'}">
          ${p.jenis==='Piutang'?'+':'-'}${rp(Number(p.nominal)||0)}
        </div>
      </div>`).join('');
  }catch(e){document.getElementById('bsBody').innerHTML=`<div style="color:var(--red);font-size:0.85rem">${e.message}</div>`;}
}

// ═══ TRANSFER ═══
async function fetchTransfers(){
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=get-transfers&household_id=${hid}`);
    if(!res.ok)return[];
    const json=await res.json();
    return json.data||[];
  }catch{return[];}
}

function openTransferModal(){
  const banks=dbOpts.banks||[];
  const opts=banks.map(b=>`<option value="${b}">${b}</option>`).join('');
  openBs('Transfer Antar Rekening',`
    <div class="inp-row"><label class="inp-lbl">Tanggal</label><input type="date" id="tfTgl" class="inp" value="${new Date().toISOString().slice(0,10)}"></div>
    <div class="inp-row"><label class="inp-lbl">Dari</label><select id="tfDari" class="inp"><option value="">— Pilih —</option>${opts}</select></div>
    <div class="inp-row"><label class="inp-lbl">Ke</label><select id="tfKe" class="inp"><option value="">— Pilih —</option>${opts}</select></div>
    <div class="inp-row"><label class="inp-lbl">Nominal</label><input type="text" id="tfNom" class="inp" inputmode="numeric" placeholder="0" oninput="fmtNom(this)"></div>
    <div class="inp-row"><label class="inp-lbl">Catatan</label><input type="text" id="tfCat" class="inp" placeholder="Opsional..."></div>
    <button class="btn-ok" style="width:100%;margin-top:8px" onclick="submitTransfer()">Transfer</button>
  `);
}

async function submitTransfer(){
  const tgl=document.getElementById('tfTgl')?.value;
  const dari=document.getElementById('tfDari')?.value;
  const ke=document.getElementById('tfKe')?.value;
  const nom=getNomVal('tfNom');
  const cat=document.getElementById('tfCat')?.value.trim();
  if(!tgl||!dari||!ke||!nom){toast('Lengkapi data transfer','err');return;}
  if(dari===ke){toast('Rekening asal dan tujuan sama','err');return;}
  try{
    const hid=getHouseholdId();
    const session=getSession();
    await apiPost('append-transfer',{household_id:hid,tanggal:tgl,dari,ke,nominal:nom,catatan:cat,recorded_by:session?.username||''});
    closeBs();toast('Transfer dicatat ✓','ok');
    allRows=[];await loadDompet();
  }catch(e){toast('Gagal: '+e.message,'err');}
}

async function openEditTransfer(encoded){
  let t;try{t=JSON.parse(decodeURIComponent(encoded));}catch{return;}
  openBs('Edit Transfer',`
    <div class="inp-row"><label class="inp-lbl">Tanggal</label><input type="date" id="etfTgl" class="inp" value="${t.tanggal||''}"></div>
    <div class="inp-row"><label class="inp-lbl">Nominal</label><input type="text" id="etfNom" class="inp" inputmode="numeric" value="${Number(t.nominal).toLocaleString('id-ID')}" oninput="fmtNom(this)"></div>
    <div class="inp-row"><label class="inp-lbl">Catatan</label><input type="text" id="etfCat" class="inp" value="${t.catatan||''}"></div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn-del" style="flex:1" onclick="deleteTransfer('${t.id}')">Hapus</button>
      <button class="btn-ok" style="flex:1" onclick="updateTransfer('${t.id}')">Simpan</button>
    </div>
  `);
}

async function updateTransfer(id){
  const tgl=document.getElementById('etfTgl')?.value;
  const nom=getNomVal('etfNom');
  const cat=document.getElementById('etfCat')?.value.trim();
  try{
    const hid=getHouseholdId();
    await apiPut('update-transfer',{id,household_id:hid,tanggal:tgl,nominal:nom,catatan:cat});
    closeBs();toast('Transfer diperbarui ✓','ok');
    allRows=[];await loadDompet();
  }catch(e){toast('Gagal: '+e.message,'err');}
}

async function deleteTransfer(id){
  try{
    const hid=getHouseholdId();
    await apiDelete('delete-transfer',{id,household_id:hid});
    closeBs();toast('Transfer dihapus','ok');
    allRows=[];await loadDompet();
  }catch(e){toast('Gagal: '+e.message,'err');}
}
