// ═══ FORMAT & UTILS ═══
function rp(v){if(v===undefined||v===null||v==='')return'Rp 0';return'Rp '+Number(v).toLocaleString('id-ID')}
function rpShort(v){v=Number(v)||0;if(v>=1e9)return(v/1e9).toFixed(1).replace(/\.0$/,'')+'M';if(v>=1e6)return(v/1e6).toFixed(2).replace(/\.?0+$/,'')+'jt';if(v>=1e3)return(v/1e3).toFixed(0)+'rb';return String(v)}
function formatTgl(s){if(!s)return'—';const p=s.split('-');if(p.length!==3||Number(p[0])<1990)return'—';return`${p[2]}/${p[1]}/${p[0]}`}
function pad(n){return String(n).padStart(2,'0')}
function getLocalDate(){const d=new Date();return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function groupBy(arr,key){return arr.reduce((g,r)=>{(g[r[key]]=g[r[key]]||[]).push(r);return g},{})}
function safeHTML(s){if(typeof s==='string'&&s.includes('<svg'))return s;const d=document.createElement('div');d.textContent=s;return d.innerHTML;}

function fmtNom(el){
  const raw=el.value.replace(/\./g,'').replace(/[^0-9]/g,'');
  if(raw===''){el.value='';return;}
  el.value=Number(raw).toLocaleString('id-ID');
}
function getNomVal(id){
  return Number((document.getElementById(id).value||'0').replace(/\./g,'').replace(/[^0-9]/g,''))||0;
}

function countUp(id,target,prefix=''){
  const el=document.getElementById(id);if(!el)return;
  const steps=40,step=900/steps;let cur=0;
  const timer=setInterval(()=>{cur+=target/steps;if(cur>=target){cur=target;clearInterval(timer)}el.textContent=prefix+rp(Math.round(cur))},step);
}

// ═══ TOAST ═══
function toast(msg,type=''){
  const el=document.getElementById('toast');
  el.innerHTML=safeHTML(msg);el.className='toast show '+type;
  clearTimeout(toastT);toastT=setTimeout(()=>{el.className='toast'},3200);
}

// ═══ DATE PARSING ═══
function parseTanggal(raw){
  if(!raw)return'';
  if(!isNaN(Number(raw))&&Number(raw)>40000){
    const d=new Date((Number(raw)-25569)*86400*1000);
    return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  if(typeof raw==='string'&&raw.includes('/')){
    const p=raw.split('/');
    if(p.length===3){const d=p[0].padStart(2,'0'),m=p[1].padStart(2,'0');const y=p[2].length===2?'20'+p[2]:p[2];return`${y}-${m}-${d}`;}
  }
  if(typeof raw==='string'&&raw.includes('-')&&raw.length>=8)return raw.substring(0,10);
  return'';
}

// ═══ PERIODE ═══
// Mode: otomatis per bulan kalender, atau manual via Settings
// dashActiveBulan & dashActiveYear: state bulan yang sedang ditampilkan di dashboard
let dashActiveBulan = new Date().getMonth();   // 0-11
let dashActiveYear  = new Date().getFullYear();

function fmtDateShort(d){return`${d.getDate()} ${MOS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`}

// Cek apakah pakai periode manual
function isManualPeriode(){
  const p=JSON.parse(localStorage.getItem('mm_periode')||'{}');
  return !!(p.startDate&&p.endDate&&p.isManual);
}

// Ambil periode yang aktif:
// - Manual: pakai custom dari localStorage
// - Otomatis: bulan kalender yang sedang dipilih di dashboard
function getActivePeriodResolved(){
  const p=JSON.parse(localStorage.getItem('mm_periode')||'{}');
  if(p.startDate&&p.endDate&&p.isManual)
    return{startDate:new Date(p.startDate),endDate:new Date(p.endDate),isManual:true};
  // Otomatis: awal hingga akhir bulan yang dipilih
  const y=dashActiveYear,m=dashActiveBulan;
  const startDate=new Date(y,m,1);
  const endDate=new Date(y,m+1,0); // hari terakhir bulan
  return{startDate,endDate,isManual:false};
}

function getSisaHari(endDate){
  const today=new Date();today.setHours(0,0,0,0);
  const end=new Date(endDate);end.setHours(0,0,0,0);
  if(end<today)return{total:0,weekday:0,weekend:0};
  let total=0,weekday=0,weekend=0,cur=new Date(today);
  while(cur<=end){const dow=cur.getDay();if(dow===0||dow===6)weekend++;else weekday++;total++;cur.setDate(cur.getDate()+1);}
  return{total,weekday,weekend};
}

function updatePeriodUI(){
  const{startDate,endDate,isManual}=getActivePeriodResolved();
  const ps=isManual
    ?`${fmtDateShort(startDate)} – ${fmtDateShort(endDate)}`
    :`${MOS[dashActiveBulan]} ${dashActiveYear}`;
  const sisa=getSisaHari(endDate);
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
  set('drawerPeriodVal',ps);
  set('drawerSub',`Sisa ${sisa.total} hari`);
  set('dashPeriodVal',ps);
  set('dashPeriodDays',isManual?`${sisa.total} hari lagi`:`${sisa.total} hari lagi`);
  set('hk-period-text',ps);
  set('sisaTotal',sisa.total);set('sisaWeekday',sisa.weekday);set('sisaWeekend',sisa.weekend);
  // Update label manual/otomatis
  const modeLbl=document.getElementById('periodeModeLabel');
  if(modeLbl)modeLbl.textContent=isManual?'Manual':'Otomatis';
}

// Navigasi bulan (mode otomatis)
function resetCharts(){
  // Destroy instance Chart.js saja — JANGAN hapus innerHTML container,
  // karena canvas #chartKat/#chartHarian dipakai lagi oleh renderChartKat/renderChartHarian
  // (mereka sudah punya logic sendiri untuk reset & bikin ulang canvas-nya).
  if(typeof chartKat!=='undefined'&&chartKat){try{chartKat.destroy()}catch(e){}chartKat=null;}
  if(typeof chartHarian!=='undefined'&&chartHarian){try{chartHarian.destroy()}catch(e){}chartHarian=null;}
}

function prevBulan(){
  if(isManualPeriode())return;
  dashUserNavigated=true;
  resetCharts();
  if(dashActiveBulan===0){dashActiveBulan=11;dashActiveYear--;}
  else dashActiveBulan--;
  allRows=[];loadDashboard();
}
function nextBulan(){
  if(isManualPeriode())return;
  const now=new Date();
  if(dashActiveYear===now.getFullYear()&&dashActiveBulan===now.getMonth())return;
  dashUserNavigated=true;
  resetCharts();
  if(dashActiveBulan===11){dashActiveBulan=0;dashActiveYear++;}
  else dashActiveBulan++;
  allRows=[];loadDashboard();
}

// ── Auto-sync bulan aktif ke "hari ini" tiap kali app kembali aktif ──
// (PWA di iOS sering di-resume dari background tanpa full reload,
// jadi dashActiveBulan yang di-set sekali saat load pertama bisa nyangkut ke bulan lama)
let dashUserNavigated=false;
function syncDashBulanKeHariIni(){
  if(dashUserNavigated)return; // user sengaja lihat bulan lain, jangan timpa
  const now=new Date();
  if(dashActiveYear!==now.getFullYear()||dashActiveBulan!==now.getMonth()){
    dashActiveYear=now.getFullYear();
    dashActiveBulan=now.getMonth();
    const pg=document.getElementById('pg-dashboard');
    if(pg&&pg.classList.contains('on')){allRows=[];loadDashboard();}
  }
}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible')syncDashBulanKeHariIni();
});
window.addEventListener('pageshow',()=>syncDashBulanKeHariIni());

// ═══ LOGO ═══
function initLogo(){
  const fitStyle={
    brandIco:'width:70%;height:70%;object-fit:contain;display:block;margin:auto;border-radius:inherit;', // logo di header, dibuat lebih kecil & proporsional
    settAvatar:'width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;',            // avatar di Settings, penuh isi lingkaran
    pinLogo:'width:80%;height:80%;object-fit:contain;display:block;margin:auto;'                          // logo di halaman PIN/menu awal
  };
  ['brandIco','settAvatar','pinLogo'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    const img=document.createElement('img');
    img.alt='logo';
    img.style.cssText=fitStyle[id]||'width:100%;height:100%;object-fit:contain;display:block;';
    img.onerror=()=>{el.innerHTML=IC.chart;};
    img.src=LOGO_URL;
    el.style.display='flex';el.style.alignItems='center';el.style.justifyContent='center';
    el.innerHTML='';el.appendChild(img);
  });
}

// ═══ PARTICLES ═══
function initParticles(){
  const c=document.getElementById('particles');if(!c)return;
  for(let i=0;i<18;i++){const p=document.createElement('div');p.className='particle';p.style.cssText=`left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*15+10}s;animation-delay:${Math.random()*10}s;opacity:${Math.random()*0.6+0.2}`;c.appendChild(p)}
}
function initOceanParticles(){
  const c=document.getElementById('oceanParticles');if(!c)return;
  for(let i=0;i<14;i++){const p=document.createElement('div');p.className='ocean-particle';p.style.cssText=`left:${Math.random()*100}%;width:${Math.random()*4+1}px;height:${Math.random()*4+1}px;animation-duration:${Math.random()*18+8}s;animation-delay:${Math.random()*12}s;opacity:${Math.random()*0.5+0.15}`;c.appendChild(p)}
}

// ═══ DRAWER ═══
function openDrawer(){document.getElementById('drawer').classList.add('open');document.getElementById('drawerOverlay').classList.add('open')}
function closeDrawer(){document.getElementById('drawer').classList.remove('open');document.getElementById('drawerOverlay').classList.remove('open')}

// ═══ MODAL OVERLAY ═══
function closeOv(e,id){
  if(e&&e.target!==document.getElementById(id))return;
  document.getElementById(id)?.classList.remove('open');
}
function openOv(id){document.getElementById(id)?.classList.add('open')}

// ═══ BOTTOM SHEET ═══
// ═══ ANTI DOUBLE-SUBMIT LOCK ═══
// Mencegah fungsi yang sama jalan dobel kalau tombol di-tap 2x cepat
const _busyActions=new Set();
function lockBusy(key){
  if(_busyActions.has(key))return false;
  _busyActions.add(key);return true;
}
function unlockBusy(key){_busyActions.delete(key);}

function openBs(title,html){
  document.getElementById('bsTitle').textContent=title;
  document.getElementById('bsBody').innerHTML=html;
  document.getElementById('bsOverlay').classList.add('open');
}
function closeBs(){document.getElementById('bsOverlay')?.classList.remove('open')}

// ═══ INPUT MODAL ═══
function openInputModal(){
  document.getElementById('inTgl').value=getLocalDate();
  syncBulan('in');
  document.getElementById('inJenis').value='';
  document.getElementById('inKat').innerHTML='<option value="">— Pilih Jenis dulu —</option>';
  document.getElementById('inNom').value='';
  document.getElementById('inMetode').value='';
  fillBank('inBank','');
  document.getElementById('inKet').value='';
  renderQuickKat();
  // Tampilkan label "dicatat oleh"
  const session=getSession();
  const recBy=document.getElementById('inputRecBy');
  if(recBy&&session){
    recBy.innerHTML=`<span class="rec-by-badge" style="background:${session.color}20;color:${session.color}">✏️ Dicatat oleh: ${session.username}</span>`;
  }
  openOv('ovInput');
}

function syncBulan(prefix){
  const tgl=document.getElementById(prefix+'Tgl')?.value;
  if(!tgl)return;
  const d=new Date(tgl);
  const bulan=MOS[d.getMonth()];
  const el=document.getElementById(prefix+'Bulan');
  if(el)el.value=bulan;
}

// ═══ API ═══
async function apiPost(action,body){
  const res=await fetch(`${API_URL}/api/sheets?action=${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!res.ok){const e=await res.json();throw new Error(e.error||'Gagal simpan')}
  return await res.json();
}
async function apiPut(action,body){
  const res=await fetch(`${API_URL}/api/sheets?action=${action}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!res.ok){const e=await res.json();throw new Error(e.error||'Gagal update')}
  return await res.json();
}
async function apiDelete(action,params){
  const qs=new URLSearchParams(params).toString();
  const res=await fetch(`${API_URL}/api/sheets?action=${action}&${qs}`,{method:'DELETE'});
  if(!res.ok){const e=await res.json();throw new Error(e.error||'Gagal hapus')}
  return await res.json();
}

// ═══ FETCH DATA (pakai household_id) ═══
async function fetchAllData(){
  const hid=getHouseholdId();
  if(!hid)throw new Error('Belum login');
  const res=await fetch(`${API_URL}/api/sheets?action=get&household_id=${hid}`);
  if(!res.ok)throw new Error('Gagal ambil data: '+res.status);
  const json=await res.json();
  if(!json.success)throw new Error(json.error||'Gagal ambil data');
  return(json.data||[]).map(r=>({
    id:r.id,rowIndex:r.id,
    tanggal:r.tanggal||'',bulan:r.bulan||'',kategori:r.kategori||'',
    nominal:Number(r.nominal)||0,pembayaran:r.pembayaran||'',
    detail:r.detail||'',metode:r.metode||'',jenis:r.jenis||'',
    recorded_by:r.recorded_by||''
  })).filter(r=>r.tanggal);
}

async function sheetsAppend(values){
  const hid=getHouseholdId();
  const session=getSession();
  return apiPost('append',{
    household_id:hid,
    recorded_by:session?.username||'',
    ...values
  });
}

async function sheetsUpdate(id,values){
  const hid=getHouseholdId();
  return apiPut('update',{id,household_id:hid,...values});
}

async function sheetsDelete(id){
  const hid=getHouseholdId();
  return apiDelete('delete',{id,household_id:hid});
}

async function fetchDBOptions(){
  try{
    if(!allRows.length)allRows=await fetchAllData();
    const banks=[],kategoris=[];
    allRows.forEach(r=>{
      if(r.pembayaran&&!['cash','transfer','qris'].includes(r.pembayaran.toLowerCase()))banks.push(r.pembayaran);
      if(r.kategori)kategoris.push(r.kategori);
    });
    const customKatsRaw=JSON.parse(localStorage.getItem('mm_custom_kats')||'[]');
    const customBanksRaw=JSON.parse(localStorage.getItem('mm_custom_banks')||'[]');
    const customKatNames=normalizeKatList(customKatsRaw).map(k=>k.name);
    const customBankNames=normalizeBankList(customBanksRaw).map(b=>b.name);
    // Rebuild map ikon kategori & warna bank supaya getKatIconSVG/getBankColor up-to-date
    rebuildKatIconMap();rebuildBankColorMap();
    // kategoris hanya pengeluaran — pemasukan sudah hardcode di KAT_PEMASUKAN
    const KAT_PMS=typeof KAT_PEMASUKAN!=='undefined'?KAT_PEMASUKAN:['Gaji','Bonus','Freelance','Transfer Masuk','Investasi','Lainnya'];
    const katPengeluaran=[...new Set([
      ...kategoris.filter(k=>!KAT_PMS.includes(k)),
      ...customKatNames.filter(k=>!KAT_PMS.includes(k))
    ])].sort();
    dbOpts={
      banks:[...new Set([...banks,...customBankNames])],
      kategoris:katPengeluaran,
      metodes:['Cash','Transfer','QRIS'],
      jenis:['Pemasukan','Pengeluaran']
    };
    fillBank('inBank','');fillBank('eBank','');
    return dbOpts;
  }catch(e){console.error('fetchDBOptions:',e)}
}

// ═══ FILL BANK & KATEGORI (custom dropdown / csel) ═══
function fillBank(id,val,excludeCash){
  const banks=dbOpts.banks||[];
  const list=excludeCash?banks:['Cash',...banks];
  const opts=list.map(b=>({value:b,label:b,color:getBankDisplayColor(b)}));
  // Elemen "csel" (inBank/eBank dkk) punya panel sibling #idPanel — pakai cselSetOptions.
  // Elemen <select> native biasa (piutSumber/lunasTujuan dkk) — isi <option> langsung.
  const panel=document.getElementById(id+'Panel');
  if(panel){
    cselSetOptions(id,opts,val,'— Pilih Rekening —');
  }else{
    const el=document.getElementById(id);
    if(!el)return;
    el.innerHTML=list.map(b=>`<option value="${b.replace(/"/g,'&quot;')}">${b}</option>`).join('');
    el.value=val||'';
  }
}

// ═══ SYNC METODE → REKENING ═══
// Cash: rekening otomatis terisi "Cash" & terkunci
// Transfer/QRIS: opsi "Cash" disembunyikan dari pilihan rekening
function syncMetodeBank(metodeId,bankId){
  const metode=document.getElementById(metodeId)?.value;
  const bankSel=document.getElementById(bankId);if(!bankSel)return;
  if(metode==='Cash'){
    fillBank(bankId,'Cash');
    bankSel.disabled=true;
  }else if(metode==='Transfer'||metode==='QRIS'){
    const cur=bankSel.value==='Cash'?'':bankSel.value;
    fillBank(bankId,cur,true);
    bankSel.disabled=false;
  }else{
    fillBank(bankId,'');
    bankSel.disabled=false;
  }
}

// Kategori Pemasukan — hardcode, tidak campur dengan pengeluaran
const KAT_PEMASUKAN = ['Gaji','Bonus','Freelance','Transfer Masuk','Investasi','Lainnya'];

// Kategori Pengeluaran — dari data + custom, tidak include kategori pemasukan
function getKatPengeluaran(){
  const customKats=normalizeKatList(JSON.parse(localStorage.getItem('mm_custom_kats')||'[]')).map(k=>k.name);
  const fromData=[...new Set(
    allRows
      .filter(r=>r.jenis==='Pengeluaran')
      .map(r=>r.kategori)
      .filter(k=>k&&!KAT_PEMASUKAN.includes(k))
  )];
  return [...new Set([...fromData,...customKats.filter(k=>!KAT_PEMASUKAN.includes(k))])].sort();
}

function fillKat(jenisId,katId){
  const jenis=document.getElementById(jenisId)?.value;
  if(!jenis){cselSetOptions(katId,[],'','— Pilih Jenis dulu —');return;}
  if(jenis==='Pemasukan'){
    const opts=KAT_PEMASUKAN.map(k=>({value:k,label:k,icon:getKatIconSVG(k)}));
    cselSetOptions(katId,opts,document.getElementById(katId)?.value||'','— Pilih Kategori —');
  } else {
    const kats=getKatPengeluaran();
    const opts=kats.map(k=>({value:k,label:k,icon:getKatIconSVG(k)}));
    cselSetOptions(katId,opts,document.getElementById(katId)?.value||'',kats.length?'— Pilih Kategori —':'— Belum ada kategori —');
  }
}

function renderQuickKat(){
  const el=document.getElementById('quickKat');if(!el)return;
  const jenis=document.getElementById('inJenis')?.value;
  if(!jenis){el.innerHTML='';return;}
  const KAT_PMS=typeof KAT_PEMASUKAN!=='undefined'?KAT_PEMASUKAN:['Gaji','Bonus','Freelance','Transfer Masuk','Investasi','Lainnya'];
  const recent=[...new Set(
    allRows
      .filter(r=>r.jenis===jenis)
      .slice(0,50)
      .map(r=>r.kategori)
      .filter(k=>k&&(jenis==='Pemasukan'?KAT_PMS.includes(k):!KAT_PMS.includes(k)))
  )].slice(0,6);
  el.innerHTML=recent.map(k=>`<button class="qk-btn" onclick="document.getElementById('inKat').value='${k.replace(/'/g,"\\'")}'">${katIconInline(k,14)}${k}</button>`).join('');
}

// ═══ FILTER BY WHO (siapa yang catat) ═══
let currentFilterWho = 'all';
function filterByWho(who){
  currentFilterWho=who;
  document.querySelectorAll('.fw-btn').forEach(b=>b.classList.toggle('on',b.dataset.who===who));
  renderCards(getFilteredRows());
}
function getFilteredRows(){
  if(currentFilterWho==='all')return allRows;
  return allRows.filter(r=>r.recorded_by===currentFilterWho);
}
function initFilterWho(){
  const members=getHouseholdMembers();
  const b1=document.getElementById('fw-btn-1');
  const b2=document.getElementById('fw-btn-2');
  if(b1&&members[0]){b1.textContent=members[0].username;b1.dataset.who=members[0].username;b1.style.color=members[0].color;b1.style.borderColor=members[0].color+'60';}
  if(b2&&members[1]){b2.textContent=members[1].username;b2.dataset.who=members[1].username;b2.style.color=members[1].color;b2.style.borderColor=members[1].color+'60';}
}

// ═══ BUDGET HELPERS ═══
function getBudgetMonthKey(year,month){return`${year}-${pad(month+1)}`}
function getBudgetsForMonth(key){
  const all=JSON.parse(localStorage.getItem('mm_budgets_v2')||'{}');
  return all[key]||{};
}
function saveBudget(key,budgets){
  const all=JSON.parse(localStorage.getItem('mm_budgets_v2')||'{}');
  all[key]=budgets;localStorage.setItem('mm_budgets_v2',JSON.stringify(all));
  pushSettings();
}

// ═══ HOUSEHOLD INFO MODAL ═══
async function showHouseholdInfo(){
  const hid=getHouseholdId();
  if(!hid)return;
  // Refresh members
  await refreshMembers(hid);
  const members=getHouseholdMembers();
  // Ambil invite code dari localStorage (disimpan saat register)
  const inviteCode=localStorage.getItem('shifa_invite_code')||'——';
  const membersHtml=members.map(m=>`
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr2)">
      <div style="width:36px;height:36px;border-radius:12px;background:${m.color}20;border:2px solid ${m.color};display:flex;align-items:center;justify-content:center">
        <span style="color:${m.color};font-weight:700">${m.username.charAt(0).toUpperCase()}</span>
      </div>
      <div>
        <div style="font-weight:600;font-size:0.88rem">${m.username}</div>
        <div style="font-size:0.7rem;color:var(--tx3)">Anggota keluarga</div>
      </div>
    </div>
  `).join('');
  openBs('Info Keluarga',`
    <div style="margin-bottom:16px">
      <div style="font-size:0.75rem;color:var(--tx3);margin-bottom:8px">Anggota (${members.length}/2)</div>
      ${membersHtml}
    </div>
    ${members.length<2?`
    <div style="background:var(--glass);border:1px solid var(--bdr2);border-radius:14px;padding:16px;text-align:center;margin-top:8px">
      <div style="font-size:0.75rem;color:var(--tx3);margin-bottom:8px">Kode undangan untuk pasangan:</div>
      <div style="font-size:1.8rem;font-weight:800;color:var(--ac);letter-spacing:0.3em">${inviteCode}</div>
      <div style="font-size:0.7rem;color:var(--tx3);margin-top:6px">Bagikan kode ini ke pasangan</div>
    </div>
    `:`<div style="text-align:center;font-size:0.8rem;color:var(--tx3);padding:8px"><div style="margin-bottom:4px;color:var(--ac)">${IC.heart}</div>Keluarga sudah lengkap</div>`}
  `);
}

// ═══ NOTIF HELPERS ═══
function checkBudgetAlerts(byCat){
  if(!notifEnabled)return;
  notifications=[];
  const now=new Date();
  const bKey=getBudgetMonthKey(now.getFullYear(),now.getMonth());
  const budgets=getBudgetsForMonth(bKey);
  byCat.forEach(k=>{
    const budget=Number(budgets[k.kategori])||0;
    if(!budget)return;
    const pct=Math.round(k.nominal/budget*100);
    if(pct>=alertPct){
      notifications.push({kategori:k.kategori,pct,nominal:k.nominal,budget,over:pct>=100});
    }
  });
  const badge=document.getElementById('notifBadge');
  if(badge)badge.style.display=notifications.length?'flex':'none';
}

function loadNotif(){
  const el=document.getElementById('notifList');if(!el)return;
  if(!notifications.length){el.innerHTML=`<div class="empty"><div class="ei">${IC.ok}</div><p>Tidak ada peringatan</p></div>`;return;}
  el.innerHTML=notifications.map(n=>`
    <div class="notif-card ${n.over?'over':'warn'}">
      <div class="nc-ico">${n.over?IC.warn:IC.notif}</div>
      <div class="nc-body">
        <div class="nc-title">${n.over?'Budget Jebol!':'Mendekati Batas'} — ${n.kategori}</div>
        <div class="nc-sub">${rp(n.nominal)} dari ${rp(n.budget)} (${n.pct}%)</div>
      </div>
    </div>
  `).join('');
}

// ═══ AI SCAN ═══
function triggerAiScan(){document.getElementById('aiImgInput')?.click()}
function updateAiScanBtn(){}
function cancelAiScan(){
  aiScanAbort=true;
  document.getElementById('aiScanOv').style.display='none';
}

async function handleAiScanImg(e){
  const file=e.target.files?.[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=async(ev)=>{
    const base64=ev.target.result.split(',')[1];
    document.getElementById('aiScanPreview').src=ev.target.result;
    document.getElementById('aiScanOv').style.display='flex';
    document.getElementById('aiScanLbl').textContent='Menganalisis struk...';
    document.getElementById('aiScanCancel').style.display='block';
    aiScanAbort=false;
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':window.ANTHROPIC_KEY||'','anthropic-version':'2023-06-01'},
        body:JSON.stringify({
          model:'claude-sonnet-4-6',max_tokens:500,
          messages:[{role:'user',content:[
            {type:'image',source:{type:'base64',media_type:file.type,data:base64}},
            {type:'text',text:'Analisis struk ini dan ekstrak: jenis (Pemasukan/Pengeluaran), kategori, nominal (angka saja), metode bayar, keterangan singkat. Jawab dalam format JSON: {"jenis":"...","kategori":"...","nominal":0,"metode":"...","detail":"..."}'}
          ]}]
        })
      });
      if(aiScanAbort){document.getElementById('aiScanOv').style.display='none';return;}
      const data=await res.json();
      const txt=data.content?.[0]?.text||'';
      const match=txt.match(/\{[\s\S]*\}/);
      if(match){
        const obj=JSON.parse(match[0]);
        if(obj.jenis)document.getElementById('inJenis').value=obj.jenis;
        fillKat('inJenis','inKat');renderQuickKat();
        setTimeout(()=>{if(obj.kategori)document.getElementById('inKat').value=obj.kategori;},100);
        if(obj.nominal)document.getElementById('inNom').value=Number(obj.nominal).toLocaleString('id-ID');
        if(obj.metode)document.getElementById('inMetode').value=obj.metode;
        if(obj.detail)document.getElementById('inKet').value=obj.detail;
        toast('Struk berhasil discan! ✓','ok');
      }
    }catch(err){toast('Gagal scan: '+err.message,'err');}
    document.getElementById('aiScanOv').style.display='none';
    e.target.value='';
  };
  reader.readAsDataURL(file);
}

// ═══ CLOCK ═══
function updateClock(){
  const n=new Date();
  const e1=document.getElementById('hdrTime'),e2=document.getElementById('hdrDate');
  if(e1)e1.textContent=`${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
  if(e2)e2.textContent=`${HARI[n.getDay()]}, ${n.getDate()} ${MOS[n.getMonth()]}`;
}
setInterval(updateClock,1000);

// ═══ THEME ═══
function setTheme(t,save=true){
  document.documentElement.setAttribute('data-theme',t);
  if(save)localStorage.setItem('mm_t',t);
  const isOcean=t==='ocean';
  const lbl=document.getElementById('themeLabel');if(lbl)lbl.textContent=isOcean?'Ocean':'Cosmic';
  const drawerLbl=document.getElementById('drawerThemeLbl');
  if(drawerLbl)drawerLbl.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z"/></svg>Tema: ${isOcean?'Ocean':'Cosmic'}`;
  ['themeToggle','drawerThemeToggle'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.toggle('on',isOcean)});
  document.getElementById('cosmicBg').style.display=isOcean?'none':'block';
  document.getElementById('oceanBg').style.display=isOcean?'block':'none';
  if(isOcean)initOceanParticles();
}
function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme')||'cosmic';
  setTheme(cur==='cosmic'?'ocean':'cosmic');
  pushSettings();
}

// ═══ INIT APP ═══
document.addEventListener('DOMContentLoaded',async()=>{
  // Inisialisasi theme
  const savedTheme=localStorage.getItem('mm_t')||'cosmic';
  setTheme(savedTheme,false);
  if(typeof rebuildKatIconMap==='function')rebuildKatIconMap();
  if(typeof rebuildBankColorMap==='function')rebuildBankColorMap();
  initParticles();
  updateClock();
  initLogo();

  // Init PIN overlay — cek session
  initPinOverlay();

  // Kalau sudah login, langsung load
  const session=getSession();
  if(session?.username&&session?.household_id){
    updateProfileUI();
    initFilterWho();
    await fetchDBOptions();
    await loadDashboard();
    initRealtimeSync();
    // Simpan invite code jika baru register
    if(!localStorage.getItem('shifa_invite_code')){
      try{
        const res=await fetch(`${API_URL}/api/sheets?action=get-members&household_id=${session.household_id}`);
        const json=await res.json();
        if(json.success)localStorage.setItem('shifa_members',JSON.stringify(json.data));
      }catch(e){}
    }
  }
});
