// ═══ BANK THEMES ═══
const BANK_THEMES={
  'Jago':      {grad:'linear-gradient(135deg,#d97706,#fbbf24)',motif:'waves',    logo:'jago.png'},
  'Cash':      {grad:'linear-gradient(135deg,#059669,#34d399)',motif:'cash',     logo:'cash.png'},
  'BCA':       {grad:'linear-gradient(135deg,#1e40af,#3b82f6)',motif:'lines',    logo:'bca.png'},
  'Seabank':   {grad:'linear-gradient(135deg,#ea580c,#f97316)',motif:'triangles',logo:'seabank.png'},
  'Dana':      {grad:'linear-gradient(135deg,#1d4ed8,#60a5fa)',motif:'wavesthick',logo:'dana.png'},
  'Shopeepay': {grad:'linear-gradient(135deg,#dc2626,#f97316)',motif:'dots',     logo:'shopeepay.png'},
  'GoPay':     {grad:'linear-gradient(135deg,#047857,#10b981)',motif:'waves',    logo:'gopay.png'},
  'OVO':       {grad:'linear-gradient(135deg,#6d28d9,#8b5cf6)',motif:'circles',  logo:'ovo.png'},
  'Mandiri':   {grad:'linear-gradient(135deg,#b45309,#f59e0b)',motif:'lines',    logo:'mandiri.png'},
  'BNI':       {grad:'linear-gradient(135deg,#1d4ed8,#3b82f6)',motif:'dots',     logo:'bni.png'},
  'BRI':       {grad:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',motif:'wavesthick',logo:'bri.png'},
  'default':   {grad:'linear-gradient(135deg,#0ea5e9,#f472b6)',motif:'dots',     logo:null},
};

function getBankTheme(name){
  // Warna custom yang dipilih user (color picker di Settings > Rekening) selalu diprioritaskan
  const customColor=typeof getBankColor==='function'?getBankColor(name):null;
  if(customColor){
    const light=typeof lightenColor==='function'?lightenColor(customColor,22):customColor;
    return{grad:`linear-gradient(135deg,${customColor},${light})`,motif:'dots',logo:null};
  }
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
      el.innerHTML=`<div class="empty-state"><div class="empty-ico"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"/></svg></div><div class="empty-title">Belum ada rekening</div><div class="empty-sub">Tambahkan transaksi dengan memilih rekening bank</div></div>`;
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
        <button onclick="openPiutangList()" class="btn-cx" style="flex:1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/></svg>Piutang</button>
        <button onclick="openHutangList()" class="btn-cx" style="flex:1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>Hutang</button>
      </div>
      <div class="sec-lbl" id="mutasiLabel">Mutasi — ${banks[0]}</div>
      <div id="transferList">${renderMutasi(banks[0])}</div>
    `;

    initATMCarousel(banks,renderMutasi);
  }catch(e){
    el.innerHTML=`<div class="empty-state"><div class="empty-ico"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg></div><div class="empty-title">Gagal memuat dompet</div></div>`;
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
  const btn=document.querySelector('#ovSett .modal-ft .btn-ok');
  setBtnBusy(btn,true);
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
  finally{unlockBusy('transfer');setBtnBusy(btn,false);}
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
  const btn=document.querySelector('#ovSett .modal-ft .btn-ok');
  setBtnBusy(btn,true);
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
  finally{unlockBusy('editTransfer');setBtnBusy(btn,false);}
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
      ${list.map(p=>`<div class="bmon-item" style="margin-bottom:8px;cursor:pointer" onclick="openPiutangDetail(${p.id},'${String(p.nama).replace(/'/g,"\\'")}',${p.nominal},'${p.tanggal||''}','${String(p.catatan||'').replace(/'/g,"\\'")}')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><div style="font-weight:600;font-size:0.88rem">${p.nama}</div><div style="font-size:0.7rem;color:var(--tx3)">${p.tanggal||''}${p.catatan?' · '+p.catatan:''}</div></div>
          <div style="font-weight:700;color:var(--red)">${rp(p.nominal)}</div>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn-sm-sec" onclick="event.stopPropagation();tandaiLunas(${p.id},${p.nominal},'${String(p.nama).replace(/'/g,"\\'")}')">✓ Lunas</button>
          <button class="btn-sm-del" onclick="event.stopPropagation();hapusPiutang(${p.id})">Hapus</button>
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
  const btn=document.querySelector('#bsBody .btn-ok');
  setBtnBusy(btn,true);
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=append-piutang`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({household_id:hid,nama,nominal:nom,tanggal:tgl,catatan:cat})
    });
    const json=await res.json().catch(()=>({success:false,error:'Response tidak valid'}));
    if(!res.ok||!json.success){toast('Gagal simpan piutang: '+(json.error||`HTTP ${res.status}`),'err');return}
    const piutangId=json.data?.id;
    let transaksi_id=null;
    if(sumber){
      const txJson=await sheetsAppend({
        tanggal:tgl||getLocalDate(),bulan:MOS[new Date(tgl||Date.now()).getMonth()],
        kategori:'Piutang',nominal:nom,pembayaran:sumber,
        detail:`Piutang: ${nama}`,metode:'Transfer',jenis:'Pengeluaran'
      });
      transaksi_id=txJson?.data?.id||null;
      allRows=[];loadDashboard();
    }
    if(piutangId){
      await fetch(`${API_URL}/api/sheets?action=append-piutang-history`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({household_id:hid,piutang_id:piutangId,nominal:nom,tipe:'tambah',tanggal:tgl||getLocalDate(),keterangan:'Piutang awal',transaksi_id})
      });
    }
    toast('Piutang ditambahkan ✓','ok');openPiutangList();
  }catch(e){toast('Gagal simpan piutang: '+e.message,'err')}
  finally{unlockBusy('addPiutang');setBtnBusy(btn,false);}
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
  const btn=document.querySelector('#bsBody .btn-ok');
  setBtnBusy(btn,true);
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=update-piutang`,{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id,household_id:hid,lunas:true})
    });
    const json=await res.json().catch(()=>({success:false,error:'Response tidak valid'}));
    if(!res.ok||!json.success){toast('Gagal update piutang: '+(json.error||`HTTP ${res.status}`),'err');return}
    const txJson=await sheetsAppend({
      tanggal:getLocalDate(),bulan:MOS[new Date().getMonth()],
      kategori:'Piutang',nominal,pembayaran:tujuan,
      detail:`Piutang lunas: ${nama}`,metode:'Transfer',jenis:'Pemasukan'
    });
    const transaksi_id=txJson?.data?.id||null;
    await fetch(`${API_URL}/api/sheets?action=append-piutang-history`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({household_id:hid,piutang_id:id,nominal,tipe:'bayar',tanggal:getLocalDate(),keterangan:'Pelunasan',transaksi_id})
    });
    allRows=[];
    toast('Piutang lunas ✓','ok');openPiutangList();loadDashboard();
  }catch(e){toast('Gagal update: '+e.message,'err')}
  finally{unlockBusy('tandaiLunas');setBtnBusy(btn,false);}
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

// ═══ DETAIL PIUTANG + RIWAYAT CICILAN ═══
async function openPiutangDetail(id,nama,nominal,tanggal,catatan){
  openBs('Piutang',`<div class="ldrow"><div class="spin"></div>Memuat riwayat...</div>`);
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=get-piutang-history&household_id=${hid}&piutang_id=${id}`);
    const json=await res.json();
    const hist=json.data||[];
    const html=`
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:0.78rem;color:var(--tx3)">Piutang dari</div>
        <div style="font-size:1rem;font-weight:700">${nama}</div>
        <div style="font-size:1.3rem;font-weight:700;color:var(--red);margin-top:4px">${rp(nominal)}</div>
        <div style="font-size:0.68rem;color:var(--tx3);margin-top:2px">${tanggal||''}${catatan?' · '+catatan:''}</div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:12px">
        <button class="btn-sm-sec" style="flex:1" onclick="openTambahPiutang(${id},'${String(nama).replace(/'/g,"\\'")}',${nominal},'${tanggal||''}','${String(catatan||'').replace(/'/g,"\\'")}')">+ Tambah Nominal</button>
        <button class="btn-ok" style="flex:1;padding:9px" onclick="openBayarPiutang(${id},'${String(nama).replace(/'/g,"\\'")}',${nominal})">− Bayar Sebagian</button>
      </div>
      <div style="font-size:0.72rem;color:var(--tx3);margin-bottom:6px">Riwayat (${hist.length})</div>
      ${!hist.length?`<div style="text-align:center;color:var(--tx3);padding:12px;font-size:0.78rem">Belum ada riwayat</div>`:
        hist.map(h=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--bdr2)">
          <div><div style="font-size:0.8rem">${h.keterangan||(h.tipe==='bayar'?'Bayar sebagian':'Tambah piutang')}</div><div style="font-size:0.65rem;color:var(--tx3)">${h.tanggal||''}</div></div>
          <div style="font-weight:700;font-size:0.85rem;color:${h.tipe==='bayar'?'var(--grn)':'var(--red)'}">${h.tipe==='bayar'?'−':'+'}${rp(h.nominal)}</div>
        </div>`).join('')
      }
      <div style="display:flex;gap:6px;margin-top:14px">
        <button class="btn-sm-sec" style="flex:1" onclick="tandaiLunas(${id},${nominal},'${String(nama).replace(/'/g,"\\'")}')">✓ Lunas Semua</button>
        <button class="btn-sm-del" style="flex:1" onclick="hapusPiutang(${id})">Hapus</button>
      </div>
      <button class="btn-cx" style="width:100%;margin-top:8px" onclick="openPiutangList()">← Kembali</button>
    `;
    document.getElementById('bsBody').innerHTML=html;
  }catch(e){document.getElementById('bsBody').innerHTML=`<div class="empty">${IC.warn}<p>Gagal memuat riwayat piutang</p></div>`;}
}

function openTambahPiutang(id,nama,nominal,tanggal,catatan){
  document.getElementById('bsBody').innerHTML=`
    <div style="text-align:center;margin-bottom:14px">
      <div style="font-size:0.78rem;color:var(--tx3)">Tambah piutang untuk</div>
      <div style="font-size:1rem;font-weight:700">${nama}</div>
    </div>
    <div class="inp-row"><label class="inp-lbl">Jumlah tambahan</label><input type="text" id="tambahPiutNom" class="inp" inputmode="numeric" oninput="fmtNom(this)" placeholder="0"></div>
    <div class="inp-row"><label class="inp-lbl">Tanggal</label><input type="date" id="tambahPiutTgl" class="inp" value="${getLocalDate()}"></div>
    <div class="inp-row"><label class="inp-lbl">Sumber Dana (opsional)</label><select id="tambahPiutSumber" class="inp"></select>
      <p style="font-size:0.68rem;color:var(--tx3);margin-top:4px">Kalau dipilih, jumlah ini otomatis tercatat sebagai pengeluaran kategori "Piutang" dari rekening ini.</p>
    </div>
    <button class="btn-ok" style="width:100%;margin-top:8px" onclick="submitTambahPiutang(${id},'${String(nama).replace(/'/g,"\\'")}',${nominal},'${tanggal||''}','${String(catatan||'').replace(/'/g,"\\'")}')">Tambah</button>
    <button class="btn-cx" style="width:100%;margin-top:6px" onclick="openPiutangDetail(${id},'${String(nama).replace(/'/g,"\\'")}',${nominal},'${tanggal||''}','${String(catatan||'').replace(/'/g,"\\'")}')">← Kembali</button>
  `;
  fillBank('tambahPiutSumber','');
}

async function submitTambahPiutang(id,nama,oldNominal,tglAwal,catatan){
  const tambah=getNomVal('tambahPiutNom');
  const tgl=document.getElementById('tambahPiutTgl')?.value||getLocalDate();
  const sumber=document.getElementById('tambahPiutSumber')?.value;
  if(!tambah){toast('Isi jumlah tambahan','err');return}
  if(!lockBusy('tambahPiutang'))return;
  const btn=document.querySelector('#bsBody .btn-ok');
  setBtnBusy(btn,true);
  try{
    const hid=getHouseholdId();
    const newNominal=Number(oldNominal)+tambah;
    const upd=await fetch(`${API_URL}/api/sheets?action=update-piutang`,{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id,household_id:hid,nominal:newNominal})
    });
    const updJson=await upd.json().catch(()=>({success:false}));
    if(!upd.ok||!updJson.success){toast('Gagal update piutang','err');return}
    let transaksi_id=null;
    if(sumber){
      const txJson=await sheetsAppend({
        tanggal:tgl,bulan:MOS[new Date(tgl).getMonth()],
        kategori:'Piutang',nominal:tambah,pembayaran:sumber,
        detail:`Piutang: ${nama}`,metode:'Transfer',jenis:'Pengeluaran'
      });
      transaksi_id=txJson?.data?.id||null;
      allRows=[];loadDashboard();
    }
    await fetch(`${API_URL}/api/sheets?action=append-piutang-history`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({household_id:hid,piutang_id:id,nominal:tambah,tipe:'tambah',tanggal:tgl,keterangan:'Tambah piutang',transaksi_id})
    });
    toast('Piutang ditambah ✓','ok');
    openPiutangDetail(id,nama,newNominal,tglAwal,catatan);
  }catch(e){toast('Gagal: '+e.message,'err')}
  finally{unlockBusy('tambahPiutang');setBtnBusy(btn,false);}
}

function openBayarPiutang(id,nama,nominal){
  document.getElementById('bsBody').innerHTML=`
    <div style="text-align:center;margin-bottom:14px">
      <div style="font-size:0.78rem;color:var(--tx3)">Bayar sebagian piutang</div>
      <div style="font-size:1rem;font-weight:700">${nama}</div>
      <div style="font-size:0.7rem;color:var(--tx3);margin-top:2px">Sisa: ${rp(nominal)}</div>
    </div>
    <div class="inp-row"><label class="inp-lbl">Jumlah dibayar</label><input type="text" id="bayarPiutNom" class="inp" inputmode="numeric" oninput="fmtNom(this)" placeholder="0"></div>
    <div class="inp-row"><label class="inp-lbl">Tanggal</label><input type="date" id="bayarPiutTgl" class="inp" value="${getLocalDate()}"></div>
    <div class="inp-row"><label class="inp-lbl">Uang masuk ke rekening</label><select id="bayarPiutTujuan" class="inp"></select></div>
    <button class="btn-ok" style="width:100%;margin-top:8px" onclick="submitBayarPiutang(${id},'${String(nama).replace(/'/g,"\\'")}',${nominal})">Konfirmasi Bayar</button>
    <button class="btn-cx" style="width:100%;margin-top:6px" onclick="openPiutangDetail(${id},'${String(nama).replace(/'/g,"\\'")}',${nominal},'','')">← Kembali</button>
  `;
  fillBank('bayarPiutTujuan','Cash');
}

async function submitBayarPiutang(id,nama,oldNominal){
  const bayar=getNomVal('bayarPiutNom');
  const tgl=document.getElementById('bayarPiutTgl')?.value||getLocalDate();
  const tujuan=document.getElementById('bayarPiutTujuan')?.value||'Cash';
  if(!bayar){toast('Isi jumlah yang dibayar','err');return}
  if(bayar>oldNominal){toast('Jumlah bayar melebihi sisa piutang','err');return}
  if(!lockBusy('bayarPiutang'))return;
  const btn=document.querySelector('#bsBody .btn-ok');
  setBtnBusy(btn,true);
  try{
    const hid=getHouseholdId();
    const sisa=Number(oldNominal)-bayar;
    const lunas=sisa<=0;
    const upd=await fetch(`${API_URL}/api/sheets?action=update-piutang`,{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id,household_id:hid,nominal:sisa,...(lunas?{lunas:true}:{})})
    });
    const updJson=await upd.json().catch(()=>({success:false}));
    if(!upd.ok||!updJson.success){toast('Gagal update piutang','err');return}
    const txJson=await sheetsAppend({
      tanggal:tgl,bulan:MOS[new Date(tgl).getMonth()],
      kategori:'Piutang',nominal:bayar,pembayaran:tujuan,
      detail:`${lunas?'Piutang lunas':'Cicilan piutang'}: ${nama}`,metode:'Transfer',jenis:'Pemasukan'
    });
    const transaksi_id=txJson?.data?.id||null;
    await fetch(`${API_URL}/api/sheets?action=append-piutang-history`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({household_id:hid,piutang_id:id,nominal:bayar,tipe:'bayar',tanggal:tgl,keterangan:lunas?'Pelunasan':'Bayar sebagian',transaksi_id})
    });
    allRows=[];loadDashboard();
    toast(lunas?'Piutang lunas ✓':'Cicilan tercatat ✓','ok');
    openPiutangList();
  }catch(e){toast('Gagal: '+e.message,'err')}
  finally{unlockBusy('bayarPiutang');setBtnBusy(btn,false);}
}

// ═══════════════════════════════════════════════════
// HUTANG — kebalikan Piutang: KITA yang berutang ke orang lain
// Tambah hutang -> uang MASUK (Pemasukan). Bayar/lunas -> uang KELUAR (Pengeluaran).
// ═══════════════════════════════════════════════════
async function openHutangList(){
  openBs('Hutang','<div class="ldrow"><div class="spin"></div>Memuat...</div>');
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=get-hutang&household_id=${hid}`);
    const json=await res.json();
    const list=(json.data||[]).filter(h=>!h.lunas);
    const lunas=(json.data||[]).filter(h=>h.lunas);
    const total=list.reduce((s,h)=>s+Number(h.nominal),0);
    const html=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:0.75rem;color:var(--tx3)">Total belum lunas: <b style="color:var(--red)">${rp(total)}</b></div>
        <button class="btn-ok" style="padding:8px 14px;font-size:0.75rem" onclick="openAddHutang()">+ Tambah</button>
      </div>
      ${!list.length?`<div style="text-align:center;color:var(--tx3);padding:16px;font-size:0.8rem"><div style="margin-bottom:4px">${IC.ok}</div>Tidak ada hutang aktif</div>`:''}
      ${list.map(h=>`<div class="bmon-item" style="margin-bottom:8px;cursor:pointer" onclick="openHutangDetail(${h.id},'${String(h.nama).replace(/'/g,"\\'")}',${h.nominal},'${h.tanggal||''}','${String(h.catatan||'').replace(/'/g,"\\'")}')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><div style="font-weight:600;font-size:0.88rem">${h.nama}</div><div style="font-size:0.7rem;color:var(--tx3)">${h.tanggal||''}${h.catatan?' · '+h.catatan:''}</div></div>
          <div style="font-weight:700;color:var(--red)">${rp(h.nominal)}</div>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn-sm-sec" onclick="event.stopPropagation();tandaiLunasHutang(${h.id},${h.nominal},'${String(h.nama).replace(/'/g,"\\'")}')">✓ Lunas</button>
          <button class="btn-sm-del" onclick="event.stopPropagation();hapusHutang(${h.id})">Hapus</button>
        </div>
      </div>`).join('')}
      ${lunas.length?`<div style="font-size:0.72rem;color:var(--tx3);margin-top:12px;margin-bottom:6px">Sudah lunas (${lunas.length})</div>
      ${lunas.map(h=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--bdr2)">
        <span style="font-size:0.82rem;opacity:0.5">${h.nama}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:var(--grn);font-size:0.82rem;opacity:0.5">${rp(h.nominal)}</span>
          <button onclick="hapusHutang(${h.id})" style="background:none;border:none;color:var(--red);cursor:pointer;padding:4px;display:flex;align-items:center" title="Hapus"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg></button>
        </div>
      </div>`).join('')}`:''}
    `;
    document.getElementById('bsBody').innerHTML=html;
  }catch(e){document.getElementById('bsBody').innerHTML=`<div class="empty">${IC.warn}<p>Gagal memuat hutang</p></div>`;}
}

function openAddHutang(){
  document.getElementById('bsBody').innerHTML=`
    <div class="inp-row"><label class="inp-lbl">Nama</label><input type="text" id="hutNama" class="inp" placeholder="Nama orang/toko..."></div>
    <div class="inp-row"><label class="inp-lbl">Nominal</label><input type="text" id="hutNom" class="inp" inputmode="numeric" oninput="fmtNom(this)" placeholder="0"></div>
    <div class="inp-row"><label class="inp-lbl">Tanggal</label><input type="date" id="hutTgl" class="inp" value="${getLocalDate()}"></div>
    <div class="inp-row"><label class="inp-lbl">Catatan</label><input type="text" id="hutCat" class="inp" placeholder="Opsional..."></div>
    <div class="inp-row"><label class="inp-lbl">Masuk ke rekening (opsional)</label><select id="hutTujuan" class="inp"></select>
      <p style="font-size:0.68rem;color:var(--tx3);margin-top:4px">Kalau dipilih, nominal ini otomatis tercatat sebagai pemasukan kategori "Hutang" ke rekening ini.</p>
    </div>
    <button class="btn-ok" style="width:100%;margin-top:8px" onclick="submitAddHutang()">Simpan</button>
    <button class="btn-cx" style="width:100%;margin-top:6px" onclick="openHutangList()">← Kembali</button>
  `;
  fillBank('hutTujuan','');
}

async function submitAddHutang(){
  const nama=document.getElementById('hutNama')?.value.trim();
  const nom =getNomVal('hutNom');
  const tgl =document.getElementById('hutTgl')?.value;
  const cat =document.getElementById('hutCat')?.value.trim();
  const tujuan=document.getElementById('hutTujuan')?.value;
  if(!nama||!nom){toast('Lengkapi data hutang','err');return}
  if(!lockBusy('addHutang'))return;
  const btn=document.querySelector('#bsBody .btn-ok');
  setBtnBusy(btn,true);
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=append-hutang`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({household_id:hid,nama,nominal:nom,tanggal:tgl,catatan:cat})
    });
    const json=await res.json().catch(()=>({success:false,error:'Response tidak valid'}));
    if(!res.ok||!json.success){toast('Gagal simpan hutang: '+(json.error||`HTTP ${res.status}`),'err');return}
    const hutangId=json.data?.id;
    let transaksi_id=null;
    if(tujuan){
      const txJson=await sheetsAppend({
        tanggal:tgl||getLocalDate(),bulan:MOS[new Date(tgl||Date.now()).getMonth()],
        kategori:'Hutang',nominal:nom,pembayaran:tujuan,
        detail:`Hutang: ${nama}`,metode:'Transfer',jenis:'Pemasukan'
      });
      transaksi_id=txJson?.data?.id||null;
      allRows=[];loadDashboard();
    }
    if(hutangId){
      await fetch(`${API_URL}/api/sheets?action=append-hutang-history`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({household_id:hid,hutang_id:hutangId,nominal:nom,tipe:'tambah',tanggal:tgl||getLocalDate(),keterangan:'Hutang awal',transaksi_id})
      });
    }
    toast('Hutang ditambahkan ✓','ok');openHutangList();
  }catch(e){toast('Gagal simpan hutang: '+e.message,'err')}
  finally{unlockBusy('addHutang');setBtnBusy(btn,false);}
}

function tandaiLunasHutang(id,nominal,nama){
  document.getElementById('bsBody').innerHTML=`
    <div style="text-align:center;margin-bottom:14px">
      <div style="font-size:0.78rem;color:var(--tx3)">Hutang ke</div>
      <div style="font-size:1rem;font-weight:700">${nama}</div>
      <div style="font-size:1.3rem;font-weight:700;color:var(--red);margin-top:4px">${rp(nominal)}</div>
    </div>
    <div class="inp-row"><label class="inp-lbl">Bayar dari rekening</label><select id="lunasHutTujuan" class="inp"></select></div>
    <button class="btn-ok" style="width:100%;margin-top:8px" onclick="submitTandaiLunasHutang(${id},${nominal},'${String(nama).replace(/'/g,"\\'")}')">Konfirmasi Lunas</button>
    <button class="btn-cx" style="width:100%;margin-top:6px" onclick="openHutangList()">← Kembali</button>
  `;
  fillBank('lunasHutTujuan','Cash');
}

async function submitTandaiLunasHutang(id,nominal,nama){
  const sumber=document.getElementById('lunasHutTujuan')?.value||'Cash';
  if(!lockBusy('tandaiLunasHutang'))return;
  const btn=document.querySelector('#bsBody .btn-ok');
  setBtnBusy(btn,true);
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=update-hutang`,{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id,household_id:hid,lunas:true})
    });
    const json=await res.json().catch(()=>({success:false,error:'Response tidak valid'}));
    if(!res.ok||!json.success){toast('Gagal update hutang: '+(json.error||`HTTP ${res.status}`),'err');return}
    const txJson=await sheetsAppend({
      tanggal:getLocalDate(),bulan:MOS[new Date().getMonth()],
      kategori:'Hutang',nominal,pembayaran:sumber,
      detail:`Hutang lunas: ${nama}`,metode:'Transfer',jenis:'Pengeluaran'
    });
    const transaksi_id=txJson?.data?.id||null;
    await fetch(`${API_URL}/api/sheets?action=append-hutang-history`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({household_id:hid,hutang_id:id,nominal,tipe:'bayar',tanggal:getLocalDate(),keterangan:'Pelunasan',transaksi_id})
    });
    allRows=[];
    toast('Hutang lunas ✓','ok');openHutangList();loadDashboard();
  }catch(e){toast('Gagal update: '+e.message,'err')}
  finally{unlockBusy('tandaiLunasHutang');setBtnBusy(btn,false);}
}

async function hapusHutang(id){
  if(!confirm('Hapus hutang ini? Riwayat terkait juga akan terhapus.'))return;
  try{
    const hid=getHouseholdId();
    await fetch(`${API_URL}/api/sheets?action=delete-hutang&id=${id}&household_id=${hid}`,{method:'DELETE'});
    toast('Hutang dihapus','ok');openHutangList();
  }catch(e){toast('Gagal hapus: '+e.message,'err')}
}

async function openHutangDetail(id,nama,nominal,tanggal,catatan){
  openBs(`Detail: ${nama}`,'<div class="ldrow"><div class="spin"></div>Memuat...</div>');
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=get-hutang-history&household_id=${hid}&hutang_id=${id}&_t=${Date.now()}`);
    const json=await res.json();
    const hist=json.data||[];
    const html=`
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:0.78rem;color:var(--tx3)">Hutang ke</div>
        <div style="font-size:1.1rem;font-weight:700">${nama}</div>
        <div style="font-size:1.4rem;font-weight:700;color:var(--red);margin-top:4px">${rp(nominal)}</div>
        ${catatan?`<div style="font-size:0.7rem;color:var(--tx3);margin-top:2px">${catatan}</div>`:''}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <button class="btn-ok" style="flex:1;padding:9px" onclick="openTambahHutang(${id},'${String(nama).replace(/'/g,"\\'")}',${nominal},'${tanggal||''}','${String(catatan||'').replace(/'/g,"\\'")}')">+ Tambah</button>
        <button class="btn-ok" style="flex:1;padding:9px" onclick="openBayarHutang(${id},'${String(nama).replace(/'/g,"\\'")}',${nominal})">− Bayar Sebagian</button>
      </div>
      <div style="font-size:0.72rem;color:var(--tx3);margin-bottom:6px">Riwayat (${hist.length})</div>
      ${!hist.length?`<div style="text-align:center;color:var(--tx3);padding:12px;font-size:0.78rem">Belum ada riwayat</div>`:
        hist.map(h=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--bdr2)">
          <div><div style="font-size:0.8rem">${h.keterangan||(h.tipe==='bayar'?'Bayar sebagian':'Tambah hutang')}</div><div style="font-size:0.65rem;color:var(--tx3)">${h.tanggal||''}</div></div>
          <div style="font-weight:700;font-size:0.85rem;color:${h.tipe==='bayar'?'var(--grn)':'var(--red)'}">${h.tipe==='bayar'?'−':'+'}${rp(h.nominal)}</div>
        </div>`).join('')
      }
      <div style="display:flex;gap:6px;margin-top:14px">
        <button class="btn-sm-sec" style="flex:1" onclick="tandaiLunasHutang(${id},${nominal},'${String(nama).replace(/'/g,"\\'")}')">✓ Lunas Semua</button>
        <button class="btn-sm-del" style="flex:1" onclick="hapusHutang(${id})">Hapus</button>
      </div>
      <button class="btn-cx" style="width:100%;margin-top:8px" onclick="openHutangList()">← Kembali</button>
    `;
    document.getElementById('bsBody').innerHTML=html;
  }catch(e){document.getElementById('bsBody').innerHTML=`<div class="empty">${IC.warn}<p>Gagal memuat riwayat hutang</p></div>`;}
}

function openTambahHutang(id,nama,nominal,tanggal,catatan){
  document.getElementById('bsBody').innerHTML=`
    <div style="text-align:center;margin-bottom:14px">
      <div style="font-size:0.78rem;color:var(--tx3)">Tambah hutang ke</div>
      <div style="font-size:1rem;font-weight:700">${nama}</div>
    </div>
    <div class="inp-row"><label class="inp-lbl">Jumlah tambahan</label><input type="text" id="tambahHutNom" class="inp" inputmode="numeric" oninput="fmtNom(this)" placeholder="0"></div>
    <div class="inp-row"><label class="inp-lbl">Tanggal</label><input type="date" id="tambahHutTgl" class="inp" value="${getLocalDate()}"></div>
    <div class="inp-row"><label class="inp-lbl">Masuk ke rekening (opsional)</label><select id="tambahHutTujuan" class="inp"></select>
      <p style="font-size:0.68rem;color:var(--tx3);margin-top:4px">Kalau dipilih, jumlah ini otomatis tercatat sebagai pemasukan kategori "Hutang" ke rekening ini.</p>
    </div>
    <button class="btn-ok" style="width:100%;margin-top:8px" onclick="submitTambahHutang(${id},'${String(nama).replace(/'/g,"\\'")}',${nominal},'${tanggal||''}','${String(catatan||'').replace(/'/g,"\\'")}')">Tambah</button>
    <button class="btn-cx" style="width:100%;margin-top:6px" onclick="openHutangDetail(${id},'${String(nama).replace(/'/g,"\\'")}',${nominal},'${tanggal||''}','${String(catatan||'').replace(/'/g,"\\'")}')">← Kembali</button>
  `;
  fillBank('tambahHutTujuan','');
}

async function submitTambahHutang(id,nama,oldNominal,tglAwal,catatan){
  const tambah=getNomVal('tambahHutNom');
  const tgl=document.getElementById('tambahHutTgl')?.value||getLocalDate();
  const tujuan=document.getElementById('tambahHutTujuan')?.value;
  if(!tambah){toast('Isi jumlah tambahan','err');return}
  if(!lockBusy('tambahHutang'))return;
  const btn=document.querySelector('#bsBody .btn-ok');
  setBtnBusy(btn,true);
  try{
    const hid=getHouseholdId();
    const newNominal=Number(oldNominal)+tambah;
    const upd=await fetch(`${API_URL}/api/sheets?action=update-hutang`,{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id,household_id:hid,nominal:newNominal})
    });
    const updJson=await upd.json().catch(()=>({success:false}));
    if(!upd.ok||!updJson.success){toast('Gagal update hutang','err');return}
    let transaksi_id=null;
    if(tujuan){
      const txJson=await sheetsAppend({
        tanggal:tgl,bulan:MOS[new Date(tgl).getMonth()],
        kategori:'Hutang',nominal:tambah,pembayaran:tujuan,
        detail:`Hutang: ${nama}`,metode:'Transfer',jenis:'Pemasukan'
      });
      transaksi_id=txJson?.data?.id||null;
      allRows=[];loadDashboard();
    }
    await fetch(`${API_URL}/api/sheets?action=append-hutang-history`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({household_id:hid,hutang_id:id,nominal:tambah,tipe:'tambah',tanggal:tgl,keterangan:'Tambah hutang',transaksi_id})
    });
    toast('Hutang ditambah ✓','ok');
    openHutangDetail(id,nama,newNominal,tglAwal,catatan);
  }catch(e){toast('Gagal: '+e.message,'err')}
  finally{unlockBusy('tambahHutang');setBtnBusy(btn,false);}
}

function openBayarHutang(id,nama,nominal){
  document.getElementById('bsBody').innerHTML=`
    <div style="text-align:center;margin-bottom:14px">
      <div style="font-size:0.78rem;color:var(--tx3)">Bayar sebagian hutang</div>
      <div style="font-size:1rem;font-weight:700">${nama}</div>
      <div style="font-size:0.7rem;color:var(--tx3);margin-top:2px">Sisa: ${rp(nominal)}</div>
    </div>
    <div class="inp-row"><label class="inp-lbl">Jumlah dibayar</label><input type="text" id="bayarHutNom" class="inp" inputmode="numeric" oninput="fmtNom(this)" placeholder="0"></div>
    <div class="inp-row"><label class="inp-lbl">Tanggal</label><input type="date" id="bayarHutTgl" class="inp" value="${getLocalDate()}"></div>
    <div class="inp-row"><label class="inp-lbl">Bayar dari rekening</label><select id="bayarHutSumber" class="inp"></select></div>
    <button class="btn-ok" style="width:100%;margin-top:8px" onclick="submitBayarHutang(${id},'${String(nama).replace(/'/g,"\\'")}',${nominal})">Konfirmasi Bayar</button>
    <button class="btn-cx" style="width:100%;margin-top:6px" onclick="openHutangDetail(${id},'${String(nama).replace(/'/g,"\\'")}',${nominal},'','')">← Kembali</button>
  `;
  fillBank('bayarHutSumber','Cash');
}

async function submitBayarHutang(id,nama,oldNominal){
  const bayar=getNomVal('bayarHutNom');
  const tgl=document.getElementById('bayarHutTgl')?.value||getLocalDate();
  const sumber=document.getElementById('bayarHutSumber')?.value||'Cash';
  if(!bayar){toast('Isi jumlah yang dibayar','err');return}
  if(bayar>oldNominal){toast('Jumlah bayar melebihi sisa hutang','err');return}
  if(!lockBusy('bayarHutang'))return;
  const btn=document.querySelector('#bsBody .btn-ok');
  setBtnBusy(btn,true);
  try{
    const hid=getHouseholdId();
    const sisa=Number(oldNominal)-bayar;
    const lunas=sisa<=0;
    const upd=await fetch(`${API_URL}/api/sheets?action=update-hutang`,{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id,household_id:hid,nominal:sisa,...(lunas?{lunas:true}:{})})
    });
    const updJson=await upd.json().catch(()=>({success:false}));
    if(!upd.ok||!updJson.success){toast('Gagal update hutang','err');return}
    const txJson=await sheetsAppend({
      tanggal:tgl,bulan:MOS[new Date(tgl).getMonth()],
      kategori:'Hutang',nominal:bayar,pembayaran:sumber,
      detail:`${lunas?'Hutang lunas':'Cicilan hutang'}: ${nama}`,metode:'Transfer',jenis:'Pengeluaran'
    });
    const transaksi_id=txJson?.data?.id||null;
    await fetch(`${API_URL}/api/sheets?action=append-hutang-history`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({household_id:hid,hutang_id:id,nominal:bayar,tipe:'bayar',tanggal:tgl,keterangan:lunas?'Pelunasan':'Bayar sebagian',transaksi_id})
    });
    allRows=[];loadDashboard();
    toast(lunas?'Hutang lunas ✓':'Cicilan tercatat ✓','ok');
    openHutangList();
  }catch(e){toast('Gagal: '+e.message,'err')}
  finally{unlockBusy('bayarHutang');setBtnBusy(btn,false);}
}
