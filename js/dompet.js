// ═══ BANK THEMES ═══
const BANK_THEMES={
  'Jago':      {grad:'linear-gradient(135deg,#d97706,#fbbf24)',motif:'waves',    logo:'jago.png'},
  'Cash':      {grad:'linear-gradient(135deg,#059669,#34d399)',motif:'cash',     logo:null},
  'BCA':       {grad:'linear-gradient(135deg,#1e40af,#3b82f6)',motif:'lines',    logo:'bca.png'},
  'Seabank':   {grad:'linear-gradient(135deg,#ea580c,#f97316)',motif:'triangles',logo:'seabank.png'},
  'Dana':      {grad:'linear-gradient(135deg,#1e3a8a,#1e40af)',motif:'grid',     logo:'dana.png'},
  'Shopeepay': {grad:'linear-gradient(135deg,#dc2626,#f97316)',motif:'dots',     logo:'shopeepay.png'},
  'GoPay':     {grad:'linear-gradient(135deg,#047857,#10b981)',motif:'waves',    logo:'gopay.png'},
  'OVO':       {grad:'linear-gradient(135deg,#6d28d9,#8b5cf6)',motif:'circles',  logo:'ovo.png'},
  'Mandiri':   {grad:'linear-gradient(135deg,#b45309,#f59e0b)',motif:'lines',    logo:'mandiri.png'},
  'BNI':       {grad:'linear-gradient(135deg,#1d4ed8,#3b82f6)',motif:'dots',     logo:'bni.png'},
  'BRI':       {grad:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',motif:'wavesthick',logo:'bri.png'},
  'default':   {grad:'linear-gradient(135deg,#0ea5e9,#f472b6)',motif:'dots',     logo:null},
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
  if(motif==='grid')return`<svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.15" viewBox="0 0 300 160">${Array.from({length:9},(_,i)=>`<line x1="${i*38}" y1="0" x2="${i*38}" y2="160" stroke="white" stroke-width="1.5"/>`).join('')}${Array.from({length:6},(_,i)=>`<line x1="0" y1="${i*30}" x2="300" y2="${i*30}" stroke="white" stroke-width="1.5"/>`).join('')}</svg>`;
  if(motif==='wavesthick')return`<svg style="position:absolute;bottom:0;left:0;width:100%;opacity:0.25" viewBox="0 0 300 100" preserveAspectRatio="none"><path d="M0,60 Q75,20 150,60 T300,60 T450,60" fill="none" stroke="white" stroke-width="5"/><path d="M0,75 Q75,35 150,75 T300,75 T450,75" fill="none" stroke="white" stroke-width="4"/><path d="M0,45 Q75,5 150,45 T300,45 T450,45" fill="none" stroke="white" stroke-width="3"/></svg>`;
  if(motif==='cash')return`<svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.1" viewBox="0 0 300 160">${Array.from({length:8},(_,i)=>`<line x1="${i*40}" y1="0" x2="${i*40}" y2="160" stroke="white" stroke-width="1"/>`).join('')}${Array.from({length:6},(_,i)=>`<line x1="0" y1="${i*30}" x2="300" y2="${i*30}" stroke="white" stroke-width="1"/>`).join('')}</svg>`;
  return`<svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.15" viewBox="0 0 300 160">${Array.from({length:40},(_,i)=>`<circle cx="${(i%8)*40+20}" cy="${Math.floor(i/8)*35+20}" r="3" fill="white"/>`).join('')}</svg>`;
}

function renderBankLogo(bank,theme){
  if(theme.logo){
    const url=`${BANK_LOGO_BASE}${theme.logo}`;
    const fb=bank.slice(0,2).toUpperCase();
    return`<img src="${url}" style="height:26px;max-width:72px;object-fit:contain;filter:brightness(0) invert(1);display:block" onerror="this.outerHTML='<span style=\\'font-size:0.68rem;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:0.12em\\'>${fb}</span>'">`;
  }
  return`<span style="font-size:0.68rem;font-weight:700;color:rgba(255,255,255,0.55);letter-spacing:0.12em">${bank.slice(0,2).toUpperCase()}</span>`;
}

function renderATMCard(bank,saldo,isActive){
  const theme=getBankTheme(bank);
  const pos=saldo>=0;
  return`<div class="atm-card${isActive?' active':''}" style="background:${theme.grad}">
    ${getBankMotifSVG(theme.motif)}
    <div style="position:absolute;top:18px;left:18px;width:36px;height:26px;border-radius:5px;background:linear-gradient(135deg,#e0e0e0,#a8a8a8);border:1px solid rgba(255,255,255,0.4)">
      <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(0,0,0,0.12);transform:translateY(-50%)"></div>
      <div style="position:absolute;top:0;bottom:0;left:50%;width:1px;background:rgba(0,0,0,0.1);transform:translateX(-50%)"></div>
    </div>
    <div style="position:absolute;top:14px;right:16px;display:flex;align-items:center;min-height:26px">
      ${renderBankLogo(bank,theme)}
    </div>
    <div style="position:absolute;bottom:36px;left:18px">
      <div style="font-size:0.52rem;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.12em;margin-bottom:3px">Saldo</div>
      <div style="font-size:1.2rem;font-weight:800;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.25)">${pos?'':'-'}${rp(Math.abs(saldo))}</div>
    </div>
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

    // Fetch transfers
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
      <!-- Total aset -->
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
      <div class="sec-lbl" id="mutasiLabel">Mutasi — ${banks[0]}</div>
      <div id="transferList">${renderMutasi(banks[0])}</div>
    `;

    initATMCarousel(banks,renderMutasi);
  }catch(e){
    el.innerHTML=`<div class="empty-state"><div class="empty-ico">⚠️</div><div class="empty-title">Gagal memuat dompet</div></div>`;
    console.error(e);
  }
}

// ═══ ATM CAROUSEL ═══
function initATMCarousel(banks,renderMutasi){
  const carousel=document.getElementById('atmCarousel');if(!carousel)return;
  let cur=0;
  const cards=carousel.querySelectorAll('.atm-card');
  const dots=document.querySelectorAll('#atmDots span');

  const snapTo=(idx,animate=true)=>{
    cur=Math.max(0,Math.min(banks.length-1,idx));
    cards.forEach((c,i)=>c.classList.toggle('active',i===cur));
    dots.forEach((d,i)=>d.classList.toggle('active',i===cur));
    const card=cards[cur];
    if(card){
      const offset=card.offsetLeft-carousel.offsetLeft-(carousel.offsetWidth-card.offsetWidth)/2;
      carousel.style.scrollBehavior=animate?'smooth':'auto';
      carousel.scrollLeft=offset;
      if(animate)setTimeout(()=>{carousel.style.scrollBehavior='auto';},400);
    }
    const lbl=document.getElementById('mutasiLabel');
    const list=document.getElementById('transferList');
    if(lbl)lbl.textContent=`Mutasi — ${banks[cur]}`;
    if(list)list.innerHTML=renderMutasi(banks[cur]);
  };

  snapTo(0,false);
  let startX=0;
  carousel.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;},{passive:true});
  carousel.addEventListener('touchend',e=>{
    const diff=startX-e.changedTouches[0].clientX;
    if(Math.abs(diff)>40)snapTo(diff>0?cur+1:cur-1,true);
  },{passive:true});
}

// ═══ FETCH TRANSFERS ═══
async function fetchTransfers(){
  try{
    const hid=getHouseholdId();if(!hid)return[];
    const res=await fetch(`${API_URL}/api/sheets?action=get-transfers&household_id=${hid}`);
    const json=await res.json();
    return json.success?json.data:[];
  }catch(e){return[];}
}

// ═══ TRANSFER MODAL ═══
function openTransferModal(){
  const BUKAN_BANK=['cash','transfer','qris'];
  const banks=[...new Set(allRows.map(r=>r.pembayaran).filter(b=>b&&!BUKAN_BANK.includes(b.trim().toLowerCase())))].sort();
  settModalType='transfer';
  document.getElementById('settModalTitle').textContent='Transfer Saldo';
  document.getElementById('settModalBody').innerHTML=`
    <p style="font-size:0.78rem;color:var(--tx2);margin-bottom:12px">Pindahkan saldo antar rekening bersama.</p>
    <div class="inp-row"><label class="inp-lbl">Dari Rekening</label>
      <select id="trDari" class="inp"><option value="">— Pilih —</option>${banks.map(b=>`<option>${b}</option>`).join('')}</select>
    </div>
    <div class="inp-row"><label class="inp-lbl">Ke Rekening</label>
      <select id="trKe" class="inp"><option value="">— Pilih —</option>${banks.map(b=>`<option>${b}</option>`).join('')}</select>
    </div>
    <div class="inp-row"><label class="inp-lbl">Nominal</label><input type="text" id="trNominal" class="inp" inputmode="numeric" oninput="fmtNom(this)" placeholder="0"></div>
    <div class="inp-row"><label class="inp-lbl">Catatan</label><input type="text" id="trCatatan" class="inp" placeholder="Opsional..."></div>
    <div class="inp-row"><label class="inp-lbl">Tanggal</label><input type="date" id="trTanggal" class="inp" value="${getLocalDate()}"></div>
  `;
  openOv('ovSett');
}

// saveSettModal handler untuk transfer - diinisialisasi setelah semua script load
function initDompetModalHandler(){
  const _orig=window.saveSettModal;
  window.saveSettModal=function(){
    if(settModalType==='transfer'){submitTransfer();return;}
    if(settModalType==='edit-transfer'){submitEditTransfer();return;}
    if(_orig)_orig();
  };
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(initDompetModalHandler,100));

async function submitTransfer(){
  const dari=document.getElementById('trDari')?.value;
  const ke  =document.getElementById('trKe')?.value;
  const nom =getNomVal('trNominal');
  const cat =document.getElementById('trCatatan')?.value.trim();
  const tgl =document.getElementById('trTanggal')?.value;
  if(!dari||!ke||!nom){toast('Lengkapi data transfer','err');return}
  if(dari===ke){toast('Rekening sama!','err');return}
  if(!lockBusy('transfer'))return;
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=append-transfer`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({household_id:hid,dari,ke,nominal:nom,catatan:cat,tanggal:tgl})
    });
    const json=await res.json().catch(()=>({success:false,error:'Response tidak valid'}));
    if(!res.ok||!json.success){
      toast('Gagal transfer: '+(json.error||`HTTP ${res.status}`),'err');
      return;
    }
    closeOv(null,'ovSett');toast('Transfer disimpan ✓','ok');loadDompet();
  }catch(e){toast('Gagal transfer: '+e.message,'err')}
  finally{unlockBusy('transfer')}
}

function openEditTransfer(encodedT){
  const t=JSON.parse(decodeURIComponent(encodedT));
  const BUKAN_BANK=['cash','transfer','qris'];
  const banks=[...new Set(allRows.map(r=>r.pembayaran).filter(b=>b&&!BUKAN_BANK.includes(b.trim().toLowerCase())))].sort();
  settModalType='edit-transfer';
  window._editTransferData=t;
  document.getElementById('settModalTitle').textContent='Edit Transfer';
  document.getElementById('settModalBody').innerHTML=`
    <div class="inp-row"><label class="inp-lbl">Dari</label>
      <select id="etDari" class="inp">${banks.map(b=>`<option${b===t.dari?' selected':''}>${b}</option>`).join('')}</select>
    </div>
    <div class="inp-row"><label class="inp-lbl">Ke</label>
      <select id="etKe" class="inp">${banks.map(b=>`<option${b===t.ke?' selected':''}>${b}</option>`).join('')}</select>
    </div>
    <div class="inp-row"><label class="inp-lbl">Nominal</label><input type="text" id="etNominal" class="inp" inputmode="numeric" value="${Number(t.nominal).toLocaleString('id-ID')}" oninput="fmtNom(this)"></div>
    <div class="inp-row"><label class="inp-lbl">Catatan</label><input type="text" id="etCatatan" class="inp" value="${t.catatan||''}"></div>
    <div class="inp-row"><label class="inp-lbl">Tanggal</label><input type="date" id="etTanggal" class="inp" value="${t.tanggal}"></div>
    <button class="btn-del" style="width:100%;margin-top:8px" onclick="deleteTransfer(${t.id})">Hapus Transfer</button>
  `;
  openOv('ovSett');
}

async function submitEditTransfer(){
  const t=window._editTransferData;if(!t)return;
  const dari=document.getElementById('etDari')?.value;
  const ke  =document.getElementById('etKe')?.value;
  const nom =getNomVal('etNominal');
  const cat =document.getElementById('etCatatan')?.value.trim();
  const tgl =document.getElementById('etTanggal')?.value;
  if(!lockBusy('editTransfer'))return;
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=update-transfer`,{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id:t.id,household_id:hid,dari,ke,nominal:nom,catatan:cat,tanggal:tgl})
    });
    const json=await res.json().catch(()=>({success:false,error:'Response tidak valid'}));
    if(!res.ok||!json.success){
      toast('Gagal update transfer: '+(json.error||`HTTP ${res.status}`),'err');
      return;
    }
    closeOv(null,'ovSett');toast('Transfer diperbarui ✓','ok');loadDompet();
  }catch(e){toast('Gagal update transfer: '+e.message,'err')}
  finally{unlockBusy('editTransfer')}
}

async function deleteTransfer(id){
  if(!confirm('Hapus transfer ini?'))return;
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=delete-transfer&id=${id}&household_id=${hid}`,{method:'DELETE'});
    const json=await res.json().catch(()=>({success:false,error:'Response tidak valid'}));
    if(!res.ok||!json.success){
      toast('Gagal hapus transfer: '+(json.error||`HTTP ${res.status}`),'err');
      return;
    }
    closeOv(null,'ovSett');toast('Transfer dihapus','ok');loadDompet();
  }catch(e){toast('Gagal hapus','err')}
}

// ═══ PIUTANG ═══
async function openPiutangList(){
  openBs('Piutang','<div class="ldrow"><div class="spin"></div>Memuat...</div>');
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=get-piutang&household_id=${hid}`);
    const json=await res.json();
    const list=(json.data||[]).filter(p=>!p.lunas);
    const lunas=(json.data||[]).filter(p=>p.lunas);
    const total=list.reduce((s,p)=>s+Number(p.nominal),0);
    const html=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:0.75rem;color:var(--tx3)">Total belum lunas: <b style="color:var(--ac)">${rp(total)}</b></div>
        <button class="btn-ok" style="padding:8px 14px;font-size:0.75rem" onclick="openAddPiutang()">+ Tambah</button>
      </div>
      ${!list.length?`<div style="text-align:center;color:var(--tx3);padding:16px;font-size:0.8rem"><div style="margin-bottom:4px">${IC.ok}</div>Tidak ada piutang aktif</div>`:''}
      ${list.map(p=>`<div class="bmon-item" style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><div style="font-weight:600;font-size:0.88rem">${p.nama}</div><div style="font-size:0.7rem;color:var(--tx3)">${p.tanggal||''}${p.catatan?' · '+p.catatan:''}</div></div>
          <div style="font-weight:700;color:var(--red)">${rp(p.nominal)}</div>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn-sm-sec" onclick="tandaiLunas(${p.id},${p.nominal},'${String(p.nama).replace(/'/g,"\\'")}')">✓ Lunas</button>
          <button class="btn-sm-del" onclick="hapusPiutang(${p.id})">Hapus</button>
        </div>
      </div>`).join('')}
      ${lunas.length?`<div style="font-size:0.72rem;color:var(--tx3);margin-top:12px;margin-bottom:6px">Sudah lunas (${lunas.length})</div>
      ${lunas.map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--bdr2)">
        <span style="font-size:0.82rem;opacity:0.5">${p.nama}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:var(--grn);font-size:0.82rem;opacity:0.5">${rp(p.nominal)}</span>
          <button onclick="hapusPiutang(${p.id})" style="background:none;border:none;color:var(--red);cursor:pointer;padding:4px;display:flex;align-items:center" title="Hapus"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg></button>
        </div>
      </div>`).join('')}`:''}
    `;
    document.getElementById('bsBody').innerHTML=html;
  }catch(e){document.getElementById('bsBody').innerHTML=`<div class="empty">${IC.warn}<p>Gagal memuat piutang</p></div>`;}
}

function openAddPiutang(){
  document.getElementById('bsBody').innerHTML=`
    <div class="inp-row"><label class="inp-lbl">Nama</label><input type="text" id="piutNama" class="inp" placeholder="Nama orang/toko..."></div>
    <div class="inp-row"><label class="inp-lbl">Nominal</label><input type="text" id="piutNom" class="inp" inputmode="numeric" oninput="fmtNom(this)" placeholder="0"></div>
    <div class="inp-row"><label class="inp-lbl">Tanggal</label><input type="date" id="piutTgl" class="inp" value="${getLocalDate()}"></div>
    <div class="inp-row"><label class="inp-lbl">Catatan</label><input type="text" id="piutCat" class="inp" placeholder="Opsional..."></div>
    <div class="inp-row"><label class="inp-lbl">Sumber Dana (opsional)</label><select id="piutSumber" class="inp"></select>
      <p style="font-size:0.68rem;color:var(--tx3);margin-top:4px">Kalau dipilih, nominal ini otomatis tercatat sebagai pengeluaran kategori "Piutang" dari rekening ini.</p>
    </div>
    <button class="btn-ok" style="width:100%;margin-top:8px" onclick="submitAddPiutang()">Simpan</button>
    <button class="btn-cx" style="width:100%;margin-top:6px" onclick="openPiutangList()">← Kembali</button>
  `;
  fillBank('piutSumber','');
}

async function submitAddPiutang(){
  const nama=document.getElementById('piutNama')?.value.trim();
  const nom =getNomVal('piutNom');
  const tgl =document.getElementById('piutTgl')?.value;
  const cat =document.getElementById('piutCat')?.value.trim();
  const sumber=document.getElementById('piutSumber')?.value;
  if(!nama||!nom){toast('Lengkapi data piutang','err');return}
  if(!lockBusy('addPiutang'))return;
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=append-piutang`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({household_id:hid,nama,nominal:nom,tanggal:tgl,catatan:cat})
    });
    const json=await res.json().catch(()=>({success:false,error:'Response tidak valid'}));
    if(!res.ok||!json.success){toast('Gagal simpan piutang: '+(json.error||`HTTP ${res.status}`),'err');return}
    if(sumber){
      await sheetsAppend({
        tanggal:tgl||getLocalDate(),bulan:MOS[new Date(tgl||Date.now()).getMonth()],
        kategori:'Piutang',nominal:nom,pembayaran:sumber,
        detail:`Piutang: ${nama}`,metode:'Transfer',jenis:'Pengeluaran'
      });
      allRows=[];loadDashboard();
    }
    toast('Piutang ditambahkan ✓','ok');openPiutangList();
  }catch(e){toast('Gagal simpan piutang: '+e.message,'err')}
  finally{unlockBusy('addPiutang')}
}

function tandaiLunas(id,nominal,nama){
  document.getElementById('bsBody').innerHTML=`
    <div style="text-align:center;margin-bottom:14px">
      <div style="font-size:0.78rem;color:var(--tx3)">Piutang dari</div>
      <div style="font-size:1rem;font-weight:700">${nama}</div>
      <div style="font-size:1.3rem;font-weight:700;color:var(--grn);margin-top:4px">${rp(nominal)}</div>
    </div>
    <div class="inp-row"><label class="inp-lbl">Uang masuk ke rekening</label><select id="lunasTujuan" class="inp"></select></div>
    <button class="btn-ok" style="width:100%;margin-top:8px" onclick="submitTandaiLunas(${id},${nominal},'${String(nama).replace(/'/g,"\\'")}')">Konfirmasi Lunas</button>
    <button class="btn-cx" style="width:100%;margin-top:6px" onclick="openPiutangList()">← Kembali</button>
  `;
  fillBank('lunasTujuan','Cash');
}

async function submitTandaiLunas(id,nominal,nama){
  const tujuan=document.getElementById('lunasTujuan')?.value||'Cash';
  if(!lockBusy('tandaiLunas'))return;
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=update-piutang`,{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id,household_id:hid,lunas:true})
    });
    const json=await res.json().catch(()=>({success:false,error:'Response tidak valid'}));
    if(!res.ok||!json.success){toast('Gagal update piutang: '+(json.error||`HTTP ${res.status}`),'err');return}
    await sheetsAppend({
      tanggal:getLocalDate(),bulan:MOS[new Date().getMonth()],
      kategori:'Piutang',nominal,pembayaran:tujuan,
      detail:`Piutang lunas: ${nama}`,metode:'Transfer',jenis:'Pemasukan'
    });
    allRows=[];
    toast('Piutang lunas ✓','ok');openPiutangList();loadDashboard();
  }catch(e){toast('Gagal update: '+e.message,'err')}
  finally{unlockBusy('tandaiLunas')}
}

async function hapusPiutang(id){
  if(!confirm('Hapus piutang ini?'))return;
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=delete-piutang&id=${id}&household_id=${hid}`,{method:'DELETE'});
    const json=await res.json().catch(()=>({success:false,error:'Response tidak valid'}));
    if(!res.ok||!json.success){toast('Gagal hapus piutang: '+(json.error||`HTTP ${res.status}`),'err');return}
    toast('Piutang dihapus','ok');openPiutangList();
  }catch(e){toast('Gagal hapus: '+e.message,'err')}
}
