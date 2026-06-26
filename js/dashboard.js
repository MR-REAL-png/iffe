// ═══ NAV ═══
function goPage(p){
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('on'));
  document.querySelectorAll('.bnav-btn').forEach(el=>el.classList.remove('on'));
  document.querySelectorAll('.drawer-item').forEach(el=>el.classList.remove('active'));
  const pg=document.getElementById('pg-'+p);if(pg)pg.classList.add('on');
  const nb=document.getElementById('nb-'+p);if(nb)nb.classList.add('on');
  const di=document.getElementById('di-'+p);if(di)di.classList.add('active');
  window.scrollTo(0,0);
  if(p==='settings'){
    loadSettings();
    updateSettAvatar();
  }
  else if(p==='data'){
    const el=document.getElementById('dataList');
    if(el&&!allRows.length)el.innerHTML='<div class="skel skel-card"></div>'.repeat(5);
    initFilterWho();
    loadData();
  }
  else if(p==='dompet')loadDompet();
  else if(p==='rekap')loadRekap();
  else if(p==='metode')loadMetode();
  else if(p==='kalender')renderKalender();
  else if(p==='notif')loadNotif();
  else if(p==='tabungan')loadTabungan();
}

function doRefresh(){
  const p=document.querySelector('.page.on');if(!p)return;
  allRows=[];toast('Memuat ulang...');
  const id=p.id.replace('pg-','');
  if(id==='dashboard')loadDashboard();
  else if(id==='data')loadData();
  else if(id==='dompet')loadDompet();
  else if(id==='rekap')loadRekap();
  else if(id==='metode')loadMetode();
  else if(id==='notif')loadNotif();
  else if(id==='tabungan')loadTabungan();
}

// ═══ DASHBOARD ═══
async function loadDashboard(){
  document.getElementById('d-kas').textContent='...';
  document.getElementById('d-masuk').textContent='...';
  document.getElementById('d-keluar').textContent='...';
  const _bmon=document.getElementById('budgetMonitor');
  const _bmonLbl=document.getElementById('bmonSecLbl');
  if(_bmonLbl)_bmonLbl.style.display='';
  if(_bmon){
    _bmon.style.display='flex';
    if(!_bmon.innerHTML.trim())_bmon.innerHTML='<div class="ldrow"><div class="spin"></div>Memuat...</div>';
  }
  try{
    if(!allRows.length)allRows=await fetchAllData();
    const{startDate,endDate,isManual}=getActivePeriodResolved();
    const sd=new Date(startDate);sd.setHours(0,0,0,0);
    const ed=new Date(endDate);ed.setHours(23,59,59,999);

    // ── Arus kas = AKUMULASI SEMUA transaksi (tidak difilter periode) ──
    const allMasuk=allRows.filter(r=>r.jenis==='Pemasukan').reduce((s,r)=>s+r.nominal,0);
    const allKeluar=allRows.filter(r=>r.jenis==='Pengeluaran').reduce((s,r)=>s+r.nominal,0);
    const kasTotal=allMasuk-allKeluar;

    // ── Stat cards & chart = filter periode/bulan yang dipilih ──
    const rows=allRows.filter(r=>{const d=new Date(r.tanggal);return d>=sd&&d<=ed});
    const masuk=rows.filter(r=>r.jenis==='Pemasukan').reduce((s,r)=>s+r.nominal,0);
    const keluar=rows.filter(r=>r.jenis==='Pengeluaran').reduce((s,r)=>s+r.nominal,0);
    const days=[...new Set(rows.map(r=>r.tanggal))].length;
    const tdim=new Date(dashActiveYear,dashActiveBulan+1,0).getDate();
    const FIXED_CATS=JSON.parse(localStorage.getItem('mm_fixed_cats')||'["Tabungan","Piutang","Kos","Tf Rumah","Listrik Rumah","Internet","Listrik"]');
    const fleks=rows.filter(r=>r.jenis==='Pengeluaran'&&!FIXED_CATS.some(fc=>r.kategori.toLowerCase().includes(fc.toLowerCase())));
    const totalFleks=fleks.reduce((s,r)=>s+r.nominal,0);
    const totalDaysPeriode=Math.max(1,Math.round((ed-sd)/(1000*60*60*24))+1);
    const avgHarian=totalDaysPeriode>0?Math.round(totalFleks/totalDaysPeriode):0;
    const byKat=groupBy(rows.filter(r=>r.jenis==='Pengeluaran'),'kategori');
    const byKatArr=Object.entries(byKat).map(([k,v])=>({kategori:k,nominal:v.reduce((s,r)=>s+r.nominal,0)})).sort((a,b)=>b.nominal-a.nominal);
    const byKatFleks=groupBy(fleks,'kategori');
    const byKatFleksArr=Object.entries(byKatFleks).map(([k,v])=>({kategori:k,nominal:v.reduce((s,r)=>s+r.nominal,0)})).sort((a,b)=>b.nominal-a.nominal);

    // ── Label periode di hero kas ──
    const periodeLabel=isManual
      ?`${fmtDateShort(sd)} – ${fmtDateShort(ed)}`
      :`${MOS[dashActiveBulan]} ${dashActiveYear}`;
    document.getElementById('hk-periode-lbl').textContent=periodeLabel;

    // Update navigasi bulan
    const navLbl=document.getElementById('dashBulanLabel');
    if(navLbl)navLbl.textContent=isManual?`${fmtDateShort(sd)} – ${fmtDateShort(ed)}`:periodeLabel;
    const navPrev=document.getElementById('dashPrevBulan');
    const navNext=document.getElementById('dashNextBulan');
    if(navPrev)navPrev.style.opacity=isManual?'0.3':'1';
    if(navNext){
      const now=new Date();
      const atLatest=dashActiveYear===now.getFullYear()&&dashActiveBulan===now.getMonth();
      navNext.style.opacity=(atLatest||isManual)?'0.3':'1';
    }

    // ── Render nilai ──
    // Arus kas hero = akumulasi total
    countUp('d-kas',Math.abs(kasTotal),kasTotal<0?'−':'');
    // Pills = periode/bulan ini
    document.getElementById('d-masuk').textContent=rpShort(masuk);
    document.getElementById('d-keluar').textContent=rpShort(keluar);
    document.getElementById('d-avg').textContent=rpShort(avgHarian);
    document.getElementById('d-active-days').textContent=`${days} hari`;
    document.getElementById('d-total-days-val').textContent=`${tdim} hari`;

    // Rata² Budget = kas periode ÷ sisa hari
    const sisaHariNow=getSisaHari(endDate).total;
    const avgBudget=sisaHariNow>0?Math.round((masuk-keluar)/sisaHariNow):0;
    const elAvgBudget=document.getElementById('d-avg-budget');
    if(elAvgBudget){
      const kasPerPeriode=masuk-keluar;
      elAvgBudget.textContent=kasPerPeriode<=0?'—':rpShort(avgBudget);
      elAvgBudget.style.color=kasPerPeriode<=0?'var(--red)':'#fbbf24';
    }

    avgDetailData={totalFleksibel:totalFleks,totalDays:totalDaysPeriode,avgHarian,byKategori:byKatFleksArr,kas:kasTotal,masuk,keluar,sisaHari:sisaHariNow,avgBudget,startDate,endDate};

    renderMemberActivity(rows);
    setTimeout(()=>{
      renderChartKat(byKatArr);
      renderChartHarian(rows);
    },100);
    renderBudget(byKatArr);
    updatePeriodUI();
    renderMemberAvatars();
    if(notifEnabled)checkBudgetAlerts(byKatArr);
  }catch(e){toast('Gagal load: '+e.message,'err');console.error(e)}
}

// ═══ MEMBER ACTIVITY ═══
// Tampilkan siapa catat berapa transaksi hari ini
function renderMemberActivity(rows){
  const el=document.getElementById('memberActivity');if(!el)return;
  const members=getHouseholdMembers();if(!members.length)return;
  const today=getLocalDate();
  const todayRows=rows.filter(r=>r.tanggal===today);
  if(!todayRows.length){el.innerHTML='';return;}
  const byWho=groupBy(todayRows,'recorded_by');
  const parts=members.map(m=>{
    const cnt=(byWho[m.username]||[]).length;
    if(!cnt)return null;
    return`<span style="color:${m.color};font-weight:600">${m.username}</span> <span style="color:var(--tx3)">+${cnt}</span>`;
  }).filter(Boolean);
  if(!parts.length){el.innerHTML='';return;}
  el.innerHTML=`<div class="activity-row">${IC.note} Hari ini: ${parts.join(' · ')}</div>`;
}

// ═══ CHART KOMPOSISI ═══
function renderChartKat(byCat){
  const wrap=document.getElementById('chartKat')?.parentElement;if(!wrap)return;
  if(chartKat){try{chartKat.destroy()}catch(e){}chartKat=null;}
  if(!byCat.length){wrap.innerHTML=`<div class="empty"><div class="ei">${IC.chart}</div><p>Belum ada pengeluaran</p></div>`;return}
  wrap.innerHTML='<canvas id="chartKat"></canvas>';
  const ctx=document.getElementById('chartKat').getContext('2d');
  const total=byCat.reduce((s,k)=>s+k.nominal,0);
  const isOcean=document.documentElement.getAttribute('data-theme')==='ocean';
  const bdrCol=isOcean?'rgba(10,74,140,0.6)':'rgba(15,12,41,0.6)';
  const legendColor=isOcean?'#0c2a3d':'#E2D9FF';
  const plugin={id:'rdg',afterDraw(chart){
    const{ctx:c,chartArea:ca}=chart;if(!ca)return;
    const cx=(ca.left+ca.right)/2,cy=(ca.top+ca.bottom)/2;
    c.save();c.textAlign='center';c.textBaseline='middle';
    c.fillStyle=isOcean?'rgba(12,42,61,0.55)':'rgba(226,217,255,0.6)';
    c.font=`500 11px 'DM Sans',sans-serif`;c.fillText('Total',cx,cy-14);
    c.fillStyle=isOcean?'rgba(12,42,61,0.9)':'rgba(255,255,255,0.95)';
    c.font=`bold 20px 'Playfair Display',serif`;
    c.fillText((total/1e6).toFixed(1)+'jt',cx,cy+10);
    c.restore();
  }};
  chartKat=new Chart(ctx,{
    type:'doughnut',plugins:[plugin],
    data:{labels:byCat.map(k=>k.kategori),datasets:[{
      data:byCat.map(k=>k.nominal),
      backgroundColor:CHART_COLORS.slice(0,byCat.length),
      borderWidth:1.5,borderColor:bdrCol,hoverOffset:6,spacing:2
    }]},
    options:{
      responsive:true,cutout:'52%',
      animation:{animateRotate:true,duration:1000,easing:'easeOutQuart'},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${c.label}: ${rp(c.raw)} (${Math.round(c.raw/total*100)}%)`}}}
    }
  });
  // Legend
  const legEl=document.getElementById('chartLegend');
  if(legEl){
    legEl.innerHTML=byCat.map((k,i)=>{
      const pct=Math.round(k.nominal/total*100);
      const lbl=k.kategori.length>12?k.kategori.slice(0,11)+'…':k.kategori;
      const col=CHART_COLORS[i%CHART_COLORS.length];
      return`<div class="cl-item"><div class="cl-dot" style="background:${col}"></div><span class="cl-txt" style="color:${legendColor}">${lbl} ${pct}%</span></div>`;
    }).join('');
  }
}

// ═══ CHART HARIAN ═══
function renderChartHarian(rows){
  const wrap=document.getElementById('chartHarian')?.parentElement;if(!wrap)return;
  if(chartHarian){try{chartHarian.destroy()}catch(e){}chartHarian=null;}
  const byDay={};
  rows.filter(r=>r.jenis==='Pengeluaran').forEach(r=>{byDay[r.tanggal]=(byDay[r.tanggal]||0)+r.nominal});
  const sorted=Object.keys(byDay).sort();
  if(!sorted.length){wrap.innerHTML=`<div class="empty"><div class="ei">${IC.chart}</div><p>Belum ada data harian</p></div>`;return}
  wrap.innerHTML='<canvas id="chartHarian"></canvas>';
  const ctx=document.getElementById('chartHarian').getContext('2d');
  const tc=document.documentElement.getAttribute('data-theme')==='ocean'?'rgba(12,42,61,0.55)':'rgba(255,255,255,0.45)';
  const labels=sorted.map(d=>{const p=d.split('-');return`${p[2]}/${p[1]}`});
  const values=sorted.map(d=>byDay[d]);
  const maxVal=Math.max(...values);
  const gradient=ctx.createLinearGradient(0,0,0,230);
  gradient.addColorStop(0,'rgba(56,189,248,0.35)');
  gradient.addColorStop(0.5,'rgba(244,114,182,0.2)');
  gradient.addColorStop(1,'rgba(244,114,182,0.0)');
  const lineGrad=ctx.createLinearGradient(0,0,ctx.canvas.width||400,0);
  lineGrad.addColorStop(0,'#38bdf8');
  lineGrad.addColorStop(1,'#f472b6');
  const pointColors=values.map(v=>v===maxVal?'#f87171':'rgba(255,255,255,0.2)');
  const pointSizes=values.map(v=>v===maxVal?5:2);
  chartHarian=new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{label:'Pengeluaran',data:values,fill:true,backgroundColor:gradient,borderColor:lineGrad,borderWidth:1.5,pointBackgroundColor:pointColors,pointBorderColor:pointColors,pointRadius:pointSizes,pointHoverRadius:6,pointHoverBackgroundColor:'#f472b6',tension:0.45}]},
    options:{
      responsive:true,animation:{duration:1000,easing:'easeInOutQuart'},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${rp(c.raw)}`,title:t=>t[0].label},backgroundColor:'rgba(15,12,41,0.85)',titleColor:'rgba(255,255,255,0.6)',bodyColor:'#f472b6',borderColor:'rgba(244,114,182,0.4)',borderWidth:1,padding:10,cornerRadius:8}},
      scales:{
        y:{ticks:{callback:v=>rpShort(v),color:tc,font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'},border:{display:false}},
        x:{ticks:{color:tc,font:{size:9},maxRotation:45},grid:{display:false},border:{display:false}}
      }
    }
  });
}

// ═══ BUDGET / KOMPOSISI ═══
function renderBudget(byCat){
  const el=document.getElementById('budgetList');
  if(!el)return;
  const now=new Date();
  const bKey=getBudgetMonthKey(now.getFullYear(),now.getMonth());
  const budgets=getBudgetsForMonth(bKey);
  // Komposisi pengeluaran selalu ditampilkan (tidak lagi disembunyikan saat ada budget)
  if(!byCat.length){el.innerHTML=`<div class="empty"><div class="ei">${IC.ok}</div><p>Belum ada pengeluaran</p></div>`;renderBudgetMonitor([]);return}
  const total=byCat.reduce((s,k)=>s+k.nominal,0);
  let tampil=byCat;
  if(komposisiRingkas&&byCat.length>5){
    const top5=byCat.slice(0,5);
    const lainNom=byCat.slice(5).reduce((s,k)=>s+k.nominal,0);
    tampil=[...top5,{kategori:'Lainnya',nominal:lainNom}];
  }
  el.innerHTML=tampil.map((k,i)=>{
    const pct=total>0?Math.round(k.nominal/total*100):0;
    const cls=pct>=30?'bud-over':pct>=15?'bud-warn':'bud-ok';
    return`<div class="bud-item tap-card" style="animation-delay:${i*0.05}s;cursor:pointer" onclick="openBudItemDetail('${k.kategori.replace(/'/g,"\\'")}')"><div class="bud-top"><span class="bud-name">${k.kategori}</span><span class="bud-pct">${pct}%</span></div><div class="bud-bar"><div class="bud-fill ${cls}" style="width:0%" data-w="${pct}"></div></div><div class="bud-amts"><span>${rpShort(k.nominal)}</span><span>dari ${rpShort(total)}</span></div></div>`;
  }).join('');
  setTimeout(()=>{el.querySelectorAll('.bud-fill').forEach(e=>e.style.width=e.dataset.w+'%')},100);
  renderBudgetMonitor(byCat);
}

function renderBudgetMonitor(byCat){
  const el=document.getElementById('budgetMonitor');
  const secLbl=document.getElementById('bmonSecLbl');
  if(!el||!secLbl)return;
  const now=new Date();
  const bKey=getBudgetMonthKey(now.getFullYear(),now.getMonth());
  const budgets=getBudgetsForMonth(bKey);
  const allItems=byCat.filter(k=>budgets[k.kategori]>0).map(k=>{
    const budget=budgets[k.kategori];
    const pct=Math.min(Math.round(k.nominal/budget*100),999);
    const cls=pct>100?'bmon-over':pct>=alertPct?'bmon-warn':'bmon-ok';
    const barW=Math.min(pct,100);
    const over=pct>100;
    return{k,budget,pct,cls,barW,over};
  });
  if(!allItems.length){
    secLbl.style.display='';el.style.display='flex';
    el.innerHTML=`<div class="empty" style="padding:16px 0"><div class="ei">${IC.tag}</div><p>Belum ada budget diatur untuk kategori ini</p></div>`;
    return;
  }
  let items=bmonRingkas&&allItems.length>5?allItems.slice(0,5):allItems;
  secLbl.style.display='';el.style.display='flex';
  el.innerHTML=items.map(({k,budget,pct,cls,barW,over},i)=>`
    <div class="bmon-item tap-card" style="animation-delay:${i*0.05}s;cursor:pointer" onclick="openBudItemDetail('${k.kategori.replace(/'/g,"\\'")}')">
      <div class="bmon-top"><span class="bmon-name">${k.kategori}</span><span class="bmon-pct" style="color:${pct>100?'var(--red)':pct>=alertPct?'#fbbf24':'var(--grn)'}">${pct}%</span></div>
      <div class="bmon-bar"><div class="bmon-fill ${cls}" style="width:0%" data-w="${barW}"></div></div>
      <div class="bmon-amts"><span class="${over?'over':''}">${rpShort(k.nominal)} terpakai</span><span>dari ${rpShort(budget)}</span></div>
    </div>`).join('');
  if(bmonRingkas&&allItems.length>5)el.innerHTML+=`<div style="text-align:center;font-size:0.72rem;color:var(--tx3);padding:6px 0">+${allItems.length-5} kategori lainnya</div>`;
  setTimeout(()=>{el.querySelectorAll('.bmon-fill').forEach(e=>e.style.width=e.dataset.w+'%')},100);
}

function toggleKomposisiView(){
  komposisiRingkas=!komposisiRingkas;
  const byKat=groupBy(allRows.filter(r=>{
    const{startDate,endDate}=getActivePeriodResolved();
    const sd=new Date(startDate);sd.setHours(0,0,0,0);
    const ed=new Date(endDate);ed.setHours(23,59,59,999);
    const d=new Date(r.tanggal);
    return d>=sd&&d<=ed&&r.jenis==='Pengeluaran';
  }),'kategori');
  const byKatArr=Object.entries(byKat).map(([k,v])=>({kategori:k,nominal:v.reduce((s,r)=>s+r.nominal,0)})).sort((a,b)=>b.nominal-a.nominal);
  renderBudget(byKatArr);
}

function toggleBmonView(){
  bmonRingkas=!bmonRingkas;
  const byKat=groupBy(allRows.filter(r=>{
    const{startDate,endDate}=getActivePeriodResolved();
    const sd=new Date(startDate);sd.setHours(0,0,0,0);
    const ed=new Date(endDate);ed.setHours(23,59,59,999);
    const d=new Date(r.tanggal);
    return d>=sd&&d<=ed&&r.jenis==='Pengeluaran';
  }),'kategori');
  const byKatArr=Object.entries(byKat).map(([k,v])=>({kategori:k,nominal:v.reduce((s,r)=>s+r.nominal,0)})).sort((a,b)=>b.nominal-a.nominal);
  renderBudgetMonitor(byKatArr);
}

// ═══ DATA PAGE ═══
async function loadData(){
  const el=document.getElementById('dataList');
  try{
    el.innerHTML='<div class="skel skel-card"></div>'.repeat(5);
    if(!allRows.length)allRows=await fetchAllData();
    await new Promise(r=>setTimeout(r,120));
    renderCards(getFilteredRows());
    syncFilterBulan();
  }catch(e){
    el.innerHTML=`<div class="empty"><div class="ei">${IC.warn}</div><p>Gagal memuat data</p></div>`;
    toast('Gagal load data: '+e.message,'err');
  }
}

function syncFilterBulan(){
  const sel=document.getElementById('filterBulan');if(!sel)return;
  const{startDate,endDate}=getActivePeriodResolved();
  const sd=new Date(startDate);sd.setHours(0,0,0,0);
  const ed=new Date(endDate);ed.setHours(23,59,59,999);
  const bulanDalamPeriode=new Set();
  allRows.forEach(r=>{const d=new Date(r.tanggal);if(d>=sd&&d<=ed&&r.bulan)bulanDalamPeriode.add(r.bulan)});
  const bulanPeriodeUrut=MOS.filter(m=>bulanDalamPeriode.has(m));
  const bulanLain=[...new Set(allRows.map(r=>r.bulan).filter(b=>b&&!bulanDalamPeriode.has(b)))];
  const curVal=sel.value;
  sel.innerHTML='<option value="">Semua Bulan</option>';
  if(bulanPeriodeUrut.length){
    const grp=document.createElement('optgroup');grp.label='— Periode Aktif —';
    bulanPeriodeUrut.forEach(b=>{const o=document.createElement('option');o.value=b;o.textContent=b;grp.appendChild(o)});
    sel.appendChild(grp);
  }
  if(bulanLain.length){
    const grp2=document.createElement('optgroup');grp2.label='— Lainnya —';
    bulanLain.forEach(b=>{const o=document.createElement('option');o.value=b;o.textContent=b;grp2.appendChild(o)});
    sel.appendChild(grp2);
  }
  if(curVal)sel.value=curVal;
}

// ═══ RENDER CARDS (dengan badge recorded_by) ═══
function renderCards(rows){
  const el=document.getElementById('dataList');
  if(!rows.length){
    el.innerHTML=`<div class="empty-state"><div class="empty-ico">💸</div><div class="empty-title">Belum ada transaksi</div><div class="empty-sub">Tap <b>+</b> untuk menambahkan transaksi pertama</div></div>`;
    return;
  }
  const members=getHouseholdMembers();
  const colorMap={};members.forEach(m=>colorMap[m.username]=m.color);

  const sorted=[...rows].sort((a,b)=>b.tanggal.localeCompare(a.tanggal));
  const totM=rows.filter(r=>r.jenis==='Pemasukan').reduce((s,r)=>s+r.nominal,0);
  const totK=rows.filter(r=>r.jenis==='Pengeluaran').reduce((s,r)=>s+r.nominal,0);
  const kas=totM-totK;
  const strip=`<div class="data-summary">
    <div class="ds-item"><div class="ds-lbl">Masuk</div><div class="ds-val g">${rpShort(totM)}</div></div>
    <div class="ds-sep"></div>
    <div class="ds-item"><div class="ds-lbl">Keluar</div><div class="ds-val r">${rpShort(totK)}</div></div>
    <div class="ds-sep"></div>
    <div class="ds-item"><div class="ds-lbl">Kas</div><div class="ds-val ${kas>=0?'g':'r'}">${kas<0?'−':'+'}${rpShort(Math.abs(kas))}</div></div>
  </div>`;

  const grouped={};
  sorted.forEach(r=>{if(!grouped[r.tanggal])grouped[r.tanggal]=[];grouped[r.tanggal].push(r)});

  const html=Object.entries(grouped).map(([tgl,txs],gi)=>{
    const dk=txs.reduce((s,r)=>r.jenis==='Pemasukan'?s+r.nominal:s-r.nominal,0);
    const hasIn=txs.some(r=>r.jenis==='Pemasukan'),hasOut=txs.some(r=>r.jenis==='Pengeluaran');
    const dotCls=hasIn&&hasOut?'mix':hasIn?'inc':'spd';
    const cards=txs.map((r,ri)=>{
      const isIn=r.jenis==='Pemasukan',cls=isIn?'inc':'spd',arr=isIn?'↓':'↑';
      const kat=r.kategori||'';
      const tags=[r.pembayaran,r.metode].filter(Boolean).map(t=>`<span class="dtag">${t}</span>`).join('');
      const ketHtml=r.detail?`<span class="dc-ket-inline">${r.detail}</span>`:'';
      // Badge dicatat oleh
      const recColor=colorMap[r.recorded_by]||'var(--tx3)';
      const recBadge=r.recorded_by?`<span class="rec-by-badge" style="background:${recColor}15;color:${recColor}">${r.recorded_by.charAt(0).toUpperCase()}</span>`:'';
      const editBtn=editMode?`<button class="edit-btn" onclick="event.stopPropagation();openEdit(${r.rowIndex})">${IC.edit} Edit</button>`:'';
      const editHtml=editBtn?`<div class="dc-edit-row">${editBtn}</div>`:'';
      return`<div class="dc ${cls}" style="animation-delay:${(gi*0.05)+(ri*0.03)}s" onclick="event.stopPropagation();openStrukDetail(${r.rowIndex})">
        <div class="dc-row1">
          <div class="dc-left"><span class="dc-kat">${kat}</span>${recBadge}</div>
          <div class="dc-right"><span class="dc-nom ${cls}">${arr} ${rp(r.nominal)}</span></div>
        </div>
        <div class="dc-divider"></div>
        <div class="dc-tags"><div class="dc-tags-left">${tags}</div>${ketHtml}</div>
        ${editHtml}
      </div>`;
    }).join('');
    return`<div class="date-group">
      <div class="dg-header"><div class="dg-dot ${dotCls}"></div><span class="dg-date">${IC.cal} ${formatTgl(tgl)}</span><span class="dg-kas ${dk>=0?'g':'r'}">${dk>=0?'+':'−'}${rp(Math.abs(dk))}</span></div>
      <div class="dg-cards">${cards}</div>
    </div>`;
  }).join('');
  el.innerHTML=strip+html;
}

function filterData(){
  const b=document.getElementById('filterBulan')?.value||'';
  const j=document.getElementById('filterJenis')?.value||'';
  let rows=getFilteredRows();
  if(b)rows=rows.filter(r=>r.bulan===b);
  if(j)rows=rows.filter(r=>r.jenis===j);
  renderCards(rows);
}

// ═══ REKAP ═══
async function loadRekap(){
  const el=document.getElementById('rekapContent');
  el.innerHTML='<div class="ldrow"><div class="spin"></div>Memuat...</div>';
  try{
    if(!allRows.length)allRows=await fetchAllData();
    const years=[...new Set(allRows.map(r=>r.tanggal?.slice(0,4)).filter(Boolean))].sort().reverse();
    if(!years.length){el.innerHTML=`<div class="empty"><div class="ei">${IC.chart}</div><p>Belum ada data</p></div>`;return}

    let html='';
    years.forEach(y=>{
      const yRows=allRows.filter(r=>r.tanggal?.startsWith(y));
      const totalMasuk=yRows.filter(r=>r.jenis==='Pemasukan').reduce((s,r)=>s+r.nominal,0);
      const totalKeluar=yRows.filter(r=>r.jenis==='Pengeluaran').reduce((s,r)=>s+r.nominal,0);
      const kasTotal=totalMasuk-totalKeluar;

      const byBulan=MOS.map((m,i)=>{
        const mRows=yRows.filter(r=>r.bulan===m);
        const mk=mRows.filter(r=>r.jenis==='Pemasukan').reduce((s,r)=>s+r.nominal,0);
        const kk=mRows.filter(r=>r.jenis==='Pengeluaran').reduce((s,r)=>s+r.nominal,0);
        return{bulan:m,masuk:mk,keluar:kk,kas:mk-kk,count:mRows.length};
      }).filter(m=>m.count>0);

      html+=`
        <div style="margin-bottom:20px">
          <!-- Header tahun -->
          <div style="font-family:var(--ffd);font-size:1.1rem;font-weight:700;color:var(--tx);margin-bottom:10px">${y}</div>

          <!-- Total Pemasukan & Pengeluaran -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
            <div style="background:var(--grn-bg);border:1px solid rgba(52,211,153,0.2);border-radius:14px;padding:12px;text-align:center">
              <div style="font-size:0.55rem;font-weight:800;color:var(--grn);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">Total Pemasukan</div>
              <div style="font-family:var(--ffd);font-size:1rem;font-weight:700;color:var(--grn)">${rp(totalMasuk)}</div>
            </div>
            <div style="background:var(--red-bg);border:1px solid rgba(248,113,113,0.2);border-radius:14px;padding:12px;text-align:center">
              <div style="font-size:0.55rem;font-weight:800;color:var(--red);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">Total Pengeluaran</div>
              <div style="font-family:var(--ffd);font-size:1rem;font-weight:700;color:var(--red)">${rp(totalKeluar)}</div>
            </div>
          </div>

          <!-- Arus Kas Tahunan -->
          <div class="hero-kas" style="text-align:center;margin-bottom:12px">
            <div class="hk-lbl" style="text-align:center">Arus Kas Tahunan</div>
            <div class="hk-val" style="text-align:center;font-size:1.6rem">${kasTotal<0?'−':''}${rp(Math.abs(kasTotal))}</div>
          </div>

          <!-- Per Bulan -->
          <div style="font-size:0.6rem;font-weight:800;color:var(--tx3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Per Bulan</div>
          ${byBulan.map(m=>`
            <div style="background:var(--glass);border:1px solid var(--bdr2);border-radius:14px;padding:12px;margin-bottom:8px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                <span style="font-weight:700;font-size:0.9rem;color:var(--tx)">${m.bulan} ${y}</span>
                <span style="font-family:var(--ffd);font-size:0.9rem;font-weight:800;color:${m.kas>=0?'var(--grn)':'var(--red)'}">${m.kas>=0?'+':'−'}${rpShort(Math.abs(m.kas))}</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div style="background:var(--grn-bg);border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:0.55rem;font-weight:700;color:var(--grn);text-transform:uppercase;margin-bottom:3px">Pemasukan</div>
                  <div style="font-family:var(--ffd);font-size:0.88rem;font-weight:700;color:var(--grn)">${rpShort(m.masuk)}</div>
                </div>
                <div style="background:rgba(248,113,113,0.22);border:1px solid rgba(248,113,113,0.2);border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:0.55rem;font-weight:700;color:var(--red);text-transform:uppercase;margin-bottom:3px">Pengeluaran</div>
                  <div style="font-family:var(--ffd);font-size:0.88rem;font-weight:700;color:var(--red)">${rpShort(m.keluar)}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    });
    el.innerHTML=html;
  }catch(e){el.innerHTML=`<div class="empty"><div class="ei">${IC.warn}</div><p>Gagal memuat</p></div>`;toast('Gagal rekap: '+e.message,'err')}
}

// ═══ METODE ═══
async function loadMetode(){
  const el=document.getElementById('metodeContent');
  el.innerHTML='<div class="ldrow"><div class="spin"></div>Memuat...</div>';
  try{
    if(!allRows.length)allRows=await fetchAllData();
    const{startDate,endDate}=getActivePeriodResolved();
    const sd=new Date(startDate);sd.setHours(0,0,0,0);
    const ed=new Date(endDate);ed.setHours(23,59,59,999);
    const rows=allRows.filter(r=>{const d=new Date(r.tanggal);return d>=sd&&d<=ed&&r.jenis==='Pengeluaran'});
    if(!rows.length){el.innerHTML=`<div class="empty"><div class="ei">${IC.card}</div><p>Belum ada data</p></div>`;return}
    const byMetode=groupBy(rows,'metode');
    const total=rows.reduce((s,r)=>s+r.nominal,0);
    const items=Object.entries(byMetode).map(([m,v])=>({metode:m||'Lainnya',nominal:v.reduce((s,r)=>s+r.nominal,0),count:v.length})).sort((a,b)=>b.nominal-a.nominal);
    const metodeIcons={
      'Cash':'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"/></svg>',
      'Transfer':'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"/></svg>',
      'QRIS':'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"/><path d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"/></svg>',
    };

    // Summary 3 kolom di atas chart
    const mainMetodes=['Cash','Transfer','QRIS'];
    const summaryHtml=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">${
      mainMetodes.map(m=>{
        const found=items.find(x=>x.metode===m);
        const nom=found?found.nominal:0;
        const col=m==='Transfer'?'#a78bfa':m==='QRIS'?'#f472b6':'#60a5fa';
        return`<div style="background:linear-gradient(135deg,${col}1a,${col}0d);border:1px solid ${col}30;border-radius:14px;padding:12px 8px;text-align:center">
          <div style="color:${col};margin-bottom:6px">${metodeIcons[m]||''}</div>
          <div style="font-size:0.55rem;font-weight:800;color:var(--tx3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">${m}</div>
          <div style="font-family:var(--ffd);font-size:1rem;font-weight:700;color:${col}">${rpShort(nom)}</div>
        </div>`;
      }).join('')
    }</div>`;

    el.innerHTML=summaryHtml+`<div style="background:linear-gradient(135deg,#a78bfa1a,#f472b614,#60a5fa1a);border:1px solid rgba(167,139,250,0.25);border-radius:16px;padding:14px;margin-bottom:14px"><canvas id="chartMetode" height="200"></canvas></div>`+
      items.map((m,i)=>{
        const pct=Math.round(m.nominal/total*100);
        const col=m.metode==='Transfer'?'#a78bfa':m.metode==='QRIS'?'#f472b6':'#60a5fa';
        return`<div style="background:linear-gradient(135deg,${col}1a,${col}0d);border:1px solid ${col}30;border-radius:14px;padding:10px 12px;margin-bottom:8px">
          <div class="bud-top"><span class="bud-name">${m.metode}</span><span class="bud-pct" style="color:${col}">${pct}%</span></div>
          <div class="bud-bar"><div class="bud-fill bud-ok" style="width:0%" data-w="${pct}"></div></div>
          <div class="bud-amts"><span>${rp(m.nominal)}</span><span>${m.count} transaksi</span></div>
        </div>`;
      }).join('');
    setTimeout(()=>{el.querySelectorAll('.bud-fill').forEach(e=>e.style.width=e.dataset.w+'%')},100);
    // Render pie chart metode
    const ctx=document.getElementById('chartMetode')?.getContext('2d');
    if(ctx){
      if(chartMetode){try{chartMetode.destroy()}catch(e){}}
      const isOceanM=document.documentElement.getAttribute('data-theme')==='ocean';
      const metodeColMap=m=>m==='Transfer'?'#a78bfa':m==='QRIS'?'#f472b6':'#60a5fa';
      chartMetode=new Chart(ctx,{
        type:'doughnut',
        data:{labels:items.map(m=>m.metode),datasets:[{data:items.map(m=>m.nominal),backgroundColor:items.map(m=>metodeColMap(m.metode)),borderWidth:1.5,borderColor:isOceanM?'rgba(2,132,199,0.3)':'rgba(15,12,41,0.6)',hoverOffset:6}]},
        options:{responsive:true,cutout:'50%',plugins:{legend:{display:true,position:'bottom',labels:{color:isOceanM?'#0c2a3d':'rgba(255,255,255,0.7)',font:{size:11},padding:12}},tooltip:{callbacks:{label:c=>` ${c.label}: ${rp(c.raw)}`}}}}
      });
    }
  }catch(e){el.innerHTML=`<div class="empty"><div class="ei">${IC.warn}</div><p>Gagal memuat</p></div>`;toast('Gagal metode: '+e.message,'err')}
}

// ═══ KALENDER ═══
function changeKalMonth(d){
  kalMonth+=d;
  if(kalMonth>11){kalMonth=0;kalYear++;}
  else if(kalMonth<0){kalMonth=11;kalYear--;}
  renderKalender();
}

function renderKalender(){
  const el=document.getElementById('kalGrid');if(!el)return;
  const lbl=document.getElementById('kalNavLbl');
  if(lbl)lbl.textContent=`${MOS[kalMonth]} ${kalYear}`;
  const rows=allRows;
  const byDay={};
  rows.filter(r=>r.jenis==='Pengeluaran').forEach(r=>{byDay[r.tanggal]=(byDay[r.tanggal]||0)+r.nominal});
  const first=new Date(kalYear,kalMonth,1).getDay();
  const days=new Date(kalYear,kalMonth+1,0).getDate();
  const today=new Date();
  const vals=Object.values(byDay);
  const maxVal=vals.length?Math.max(...vals):1;
  const headers=['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(h=>`<div class="kal-hd">${h}</div>`).join('');
  let cells='';
  for(let i=0;i<first;i++)cells+=`<div class="kal-cell empty"></div>`;
  for(let d=1;d<=days;d++){
    const tgl=`${kalYear}-${pad(kalMonth+1)}-${pad(d)}`;
    const nom=byDay[tgl]||0;
    const isToday=today.getDate()===d&&today.getMonth()===kalMonth&&today.getFullYear()===kalYear;
    const intensity=nom>0?Math.max(0.15,nom/maxVal):0;
    const bg=nom>0?`rgba(56,189,248,${intensity*0.5})`:'transparent';
    const cl=(isToday?'kal-cell today':'kal-cell')+(nom>0?' has-tx':'');
    cells+=`<div class="${cl}" style="background:${bg}" onclick="showKalDetail('${tgl}')">
      <div class="kal-day">${d}</div>
      ${nom>0?`<div class="kal-nom">${rpShort(nom)}</div>`:''}
    </div>`;
  }
  el.innerHTML=`<div class="kal-grid">${headers}${cells}</div>`;
  updatePeriodUI();
  // Chart harian kalender
  renderChartKal(rows);
}

function renderChartKal(rows){
  const wrap=document.getElementById('chartKal')?.parentElement;if(!wrap)return;
  if(chartKal){try{chartKal.destroy()}catch(e){}chartKal=null;}
  const byDay={};
  rows.filter(r=>r.jenis==='Pengeluaran').forEach(r=>{byDay[r.tanggal]=(byDay[r.tanggal]||0)+r.nominal});
  const sorted=Object.keys(byDay).sort();
  if(!sorted.length){wrap.innerHTML='<canvas id="chartKal"></canvas>';return}
  wrap.innerHTML='<canvas id="chartKal"></canvas>';
  const ctx=document.getElementById('chartKal').getContext('2d');
  const tc=document.documentElement.getAttribute('data-theme')==='ocean'?'rgba(12,42,61,0.5)':'rgba(255,255,255,0.4)';
  chartKal=new Chart(ctx,{
    type:'bar',
    data:{labels:sorted.map(d=>{const p=d.split('-');return`${p[2]}/${p[1]}`}),datasets:[{data:sorted.map(d=>byDay[d]),backgroundColor:'rgba(56,189,248,0.5)',borderColor:'#38bdf8',borderWidth:1,borderRadius:4}]},
    options:{responsive:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${rp(c.raw)}`}}},scales:{y:{ticks:{callback:v=>rpShort(v),color:tc,font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'},border:{display:false}},x:{ticks:{color:tc,font:{size:9},maxRotation:45},grid:{display:false},border:{display:false}}}}
  });
}

function showKalDetail(tgl){
  const rows=allRows.filter(r=>r.tanggal===tgl);
  if(!rows.length)return;
  const members=getHouseholdMembers();
  const colorMap={};members.forEach(m=>colorMap[m.username]=m.color);
  const totK=rows.filter(r=>r.jenis==='Pengeluaran').reduce((s,r)=>s+r.nominal,0);
  const totM=rows.filter(r=>r.jenis==='Pemasukan').reduce((s,r)=>s+r.nominal,0);
  const html=`<div style="margin-bottom:12px"><span style="color:var(--grn)">↓ ${rp(totM)}</span> &nbsp; <span style="color:var(--red)">↑ ${rp(totK)}</span></div>`+
    rows.map(r=>{
      const isIn=r.jenis==='Pemasukan';
      const recColor=colorMap[r.recorded_by]||'var(--tx3)';
      const recBadge=r.recorded_by?`<span class="rec-by-badge" style="background:${recColor}15;color:${recColor}">${r.recorded_by}</span>`:'';
      return`<div class="dc ${isIn?'inc':'spd'}" style="margin-bottom:8px">
        <div class="dc-row1"><div class="dc-left"><span class="dc-kat">${r.kategori}</span>${recBadge}</div><div class="dc-right"><span class="dc-nom ${isIn?'inc':'spd'}">${isIn?'↓':'↑'} ${rp(r.nominal)}</span></div></div>
        ${r.detail?`<div style="font-size:0.72rem;color:var(--tx3);padding:4px 0 0">${r.detail}</div>`:''}
      </div>`;
    }).join('');
  openBs(formatTgl(tgl),html);
}

// ═══ TABUNGAN ═══
async function loadTabungan(){
  const el=document.getElementById('tabContent');
  el.innerHTML='<div class="ldrow"><div class="spin"></div>Memuat...</div>';
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=get-tabungan&household_id=${hid}`);
    const json=await res.json();
    const list=json.data||[];
    if(!list.length){
      el.innerHTML=`
        <div class="empty-state"><div class="empty-ico">🏦</div><div class="empty-title">Belum ada tabungan</div><div class="empty-sub">Tambah target tabungan bersama</div></div>
        <button class="btn-ok" style="width:100%;margin-top:8px" onclick="openAddTabungan()">+ Tambah Tabungan</button>
      `;
      return;
    }
    const total=list.reduce((s,t)=>s+Number(t.target),0);
    const terkumpul=list.reduce((s,t)=>s+Number(t.terkumpul),0);
    const pct=total>0?Math.round(terkumpul/total*100):0;
    el.innerHTML=`
      <div class="tab-summary">
        <div class="ts-val">${rp(terkumpul)}</div>
        <div class="ts-lbl">dari target ${rp(total)}</div>
        <div class="bud-bar" style="margin-top:8px"><div class="bud-fill bud-ok" style="width:0%" data-w="${pct}"></div></div>
        <div style="font-size:0.72rem;color:var(--tx3);margin-top:4px">${pct}% terkumpul</div>
      </div>
      <div style="margin-bottom:12px"><button class="btn-ok" style="width:100%" onclick="openAddTabungan()">+ Tambah Tabungan</button></div>
      ${list.map(t=>{
        const p=Number(t.target)>0?Math.min(Math.round(Number(t.terkumpul)/Number(t.target)*100),100):0;
        return`<div class="bmon-item tap-card">
          <div class="bmon-top"><span class="bmon-name">${t.nama}</span><span class="bmon-pct" style="color:var(--grn)">${p}%</span></div>
          <div class="bud-bar"><div class="bud-fill bud-ok" style="width:0%" data-w="${p}"></div></div>
          <div class="bmon-amts"><span>${rp(t.terkumpul)}</span><span>dari ${rp(t.target)}</span></div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn-sm-sec" onclick="openTopupTabungan(${t.id},'${t.nama}',${t.terkumpul},${t.target})">+ Topup</button>
            <button class="btn-sm-sec" onclick="openRiwayatTabungan(${t.id},'${t.nama}')">Riwayat</button>
            <button class="btn-sm-del" onclick="deleteTabungan(${t.id})">Hapus</button>
          </div>
        </div>`;
      }).join('')}
    `;
    setTimeout(()=>{el.querySelectorAll('.bud-fill').forEach(e=>e.style.width=e.dataset.w+'%')},100);
  }catch(e){el.innerHTML=`<div class="empty"><div class="ei">${IC.warn}</div><p>Gagal memuat</p></div>`;toast('Gagal tabungan: '+e.message,'err')}
}

function openAddTabungan(){
  openBs('Tambah Tabungan',`
    <div class="inp-row"><label class="inp-lbl">Nama Tabungan</label><input type="text" id="tabNama" class="inp" placeholder="Liburan, Rumah, dll..."></div>
    <div class="inp-row"><label class="inp-lbl">Target</label><input type="text" id="tabTarget" class="inp" inputmode="numeric" oninput="fmtNom(this)" placeholder="0"></div>
    <div class="inp-row"><label class="inp-lbl">Sudah terkumpul</label><input type="text" id="tabAwal" class="inp" inputmode="numeric" oninput="fmtNom(this)" placeholder="0"></div>
    <div class="inp-row"><label class="inp-lbl">Sumber Dana (opsional)</label><select id="tabSumber" class="inp"></select>
      <p style="font-size:0.68rem;color:var(--tx3);margin-top:4px">Kalau dipilih, saldo terkumpul awal akan otomatis tercatat sebagai pengeluaran kategori "Tabungan" dari rekening ini.</p>
    </div>
    <button class="btn-ok" style="width:100%;margin-top:8px" onclick="submitAddTabungan()">Simpan</button>
  `);
  fillBank('tabSumber','');
}

async function submitAddTabungan(){
  const nama=document.getElementById('tabNama')?.value.trim();
  const target=getNomVal('tabTarget');
  const terkumpul=getNomVal('tabAwal');
  const sumber=document.getElementById('tabSumber')?.value;
  if(!nama||!target){toast('Lengkapi data tabungan','err');return}
  if(!lockBusy('addTabungan'))return;
  try{
    const hid=getHouseholdId();
    const res=await fetch(`${API_URL}/api/sheets?action=append-tabungan`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({household_id:hid,nama,target,terkumpul})});
    const json=await res.json().catch(()=>({success:false}));
    const tabId=json.data?.id;
    if(terkumpul>0){
      if(tabId)await fetch(`${API_URL}/api/sheets?action=append-tabungan-history`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({household_id:hid,tabungan_id:tabId,nominal:terkumpul,sumber:sumber||null,tanggal:getLocalDate()})});
      if(sumber){
        await sheetsAppend({
          tanggal:getLocalDate(),bulan:MOS[new Date().getMonth()],
          kategori:'Tabungan',nominal:terkumpul,pembayaran:sumber,
          detail:`Tabungan: ${nama}`,metode:'Transfer',jenis:'Pengeluaran'
        });
        allRows=[];
      }
    }
    closeBs();toast('Tabungan ditambahkan ✓','ok');loadTabungan();
    if(sumber&&terkumpul>0)loadDashboard();
  }catch(e){toast('Gagal simpan: '+e.message,'err')}
  finally{unlockBusy('addTabungan')}
}

function openTopupTabungan(id,nama,terkumpul,target){
  openBs(`Topup: ${nama}`,`
    <div style="text-align:center;margin-bottom:12px"><div style="font-size:0.8rem;color:var(--tx3)">Terkumpul saat ini</div><div style="font-size:1.2rem;font-weight:700;color:var(--grn)">${rp(terkumpul)}</div><div style="font-size:0.75rem;color:var(--tx3)">dari ${rp(target)}</div></div>
    <div class="inp-row"><label class="inp-lbl">Jumlah Topup</label><input type="text" id="topupNom" class="inp" inputmode="numeric" oninput="fmtNom(this)" placeholder="0"></div>
    <div class="inp-row"><label class="inp-lbl">Sumber Dana (opsional)</label><select id="topupSumber" class="inp"></select>
      <p style="font-size:0.68rem;color:var(--tx3);margin-top:4px">Kalau dipilih, jumlah topup otomatis tercatat sebagai pengeluaran kategori "Tabungan" dari rekening ini.</p>
    </div>
    <button class="btn-ok" style="width:100%;margin-top:8px" onclick="submitTopup(${id},${terkumpul},'${nama}')">Topup</button>
  `);
  fillBank('topupSumber','');
}

async function submitTopup(id,current,nama){
  const tambah=getNomVal('topupNom');if(!tambah){toast('Isi jumlah topup','err');return}
  const sumber=document.getElementById('topupSumber')?.value;
  if(!lockBusy('topupTab'))return;
  try{
    const hid=getHouseholdId();
    const session=getSession();
    // Update terkumpul di tabungan
    await fetch(`${API_URL}/api/sheets?action=update-tabungan`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,household_id:hid,terkumpul:current+tambah})});

    let transaksi_id=null;
    if(sumber){
      // Catat sebagai transaksi Pengeluaran, simpan id-nya
      const txRes=await fetch(`${API_URL}/api/sheets?action=append`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        household_id:hid,recorded_by:session?.username||'',
        tanggal:getLocalDate(),bulan:MOS[new Date().getMonth()],
        kategori:'Tabungan',nominal:tambah,pembayaran:sumber,
        detail:`Topup tabungan: ${nama||''}`,metode:'Transfer',jenis:'Pengeluaran'
      })});
      const txJson=await txRes.json();
      transaksi_id=txJson.data?.id||null;
      allRows=[];
    }
    // Simpan history tabungan + transaksi_id (untuk sinkronisasi edit/hapus)
    await fetch(`${API_URL}/api/sheets?action=append-tabungan-history`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      household_id:hid,tabungan_id:id,nominal:tambah,
      sumber:sumber||null,tanggal:getLocalDate(),
      transaksi_id
    })});
    closeBs();toast('Topup berhasil ✓','ok');loadTabungan();
    if(sumber)loadDashboard();
  }catch(e){toast('Gagal topup: '+e.message,'err')}
  finally{unlockBusy('topupTab')}
}

function openRiwayatTabungan(id,nama){
  openBs(`Riwayat: ${nama}`,`<div id="riwayatTabBody"><div class="ldrow"><div class="spin"></div>Memuat...</div></div>`);
  (async()=>{
    try{
      const hid=getHouseholdId();
      // Selalu fetch fresh — supaya sync dengan edit/hapus transaksi terbaru
      const res=await fetch(`${API_URL}/api/sheets?action=get-tabungan-history&household_id=${hid}&tabungan_id=${id}&_t=${Date.now()}`);
      const json=await res.json();
      const list=json.data||[];
      const body=document.getElementById('riwayatTabBody');if(!body)return;
      if(!list.length){body.innerHTML=`<div style="text-align:center;color:var(--tx3);padding:16px;font-size:0.8rem">Belum ada riwayat topup</div>`;return}
      const total=list.reduce((s,h)=>s+Number(h.nominal||0),0);
      body.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0 12px;border-bottom:1px solid var(--bdr2);margin-bottom:8px">
          <span style="font-size:0.72rem;color:var(--tx3)">${list.length} topup</span>
          <span style="font-size:0.82rem;font-weight:700;color:var(--grn)">Total: +${rp(total)}</span>
        </div>
        ${list.map(h=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--bdr2)">
          <div><div style="font-size:0.82rem;font-weight:600">${h.tanggal||''}</div><div style="font-size:0.68rem;color:var(--tx3)">${h.sumber?'dari '+h.sumber:'Manual (tanpa rekening)'}</div></div>
          <div style="font-weight:700;color:var(--grn)">+${rp(h.nominal)}</div>
        </div>`).join('')}`;
    }catch(e){
      const body=document.getElementById('riwayatTabBody');if(body)body.innerHTML=`<div style="text-align:center;color:var(--red);padding:16px;font-size:0.8rem">Gagal memuat riwayat</div>`;
    }
  })();
}

async function deleteTabungan(id){
  if(!confirm('Hapus tabungan ini?'))return;
  try{
    const hid=getHouseholdId();
    await fetch(`${API_URL}/api/sheets?action=delete-tabungan&id=${id}&household_id=${hid}`,{method:'DELETE'});
    toast('Tabungan dihapus','ok');loadTabungan();
  }catch(e){toast('Gagal hapus','err')}
}

// ═══ AVG DETAIL ═══
function openAvgDetail(){
  if(!avgDetailData)return;
  const{totalFleksibel,avgHarian,byKategori,kas,masuk,keluar,sisaHari,avgBudget}=avgDetailData;
  const html=`
    <div class="avg-grid">
      <div class="avg-item"><div class="avg-val" style="color:#c084fc">${rp(avgHarian)}</div><div class="avg-lbl">Rata²/Hari</div></div>
      <div class="avg-item"><div class="avg-val" style="color:#fbbf24">${sisaHari>0?rp(avgBudget):'—'}</div><div class="avg-lbl">Rata² Budget</div></div>
      <div class="avg-item"><div class="avg-val" style="color:var(--grn)">${rp(masuk)}</div><div class="avg-lbl">Total Masuk</div></div>
      <div class="avg-item"><div class="avg-val" style="color:var(--red)">${rp(keluar)}</div><div class="avg-lbl">Total Keluar</div></div>
    </div>
    <div style="margin:12px 0 8px;font-size:0.75rem;color:var(--tx3)">Pengeluaran fleksibel per kategori:</div>
    ${byKategori.map((k,i)=>`<div class="avg-row"><span style="color:${CHART_COLORS[i%CHART_COLORS.length]}">${k.kategori}</span><span style="color:var(--tx)">${rp(k.nominal)}</span></div>`).join('')}
  `;
  openBs('Detail Rata-rata',html);
}

// ═══ KAS DETAIL ═══
function openKasDetail(){
  if(!avgDetailData)return;
  const{kas,masuk,keluar,startDate,endDate}=avgDetailData;
  const html=`
    <div class="avg-grid">
      <div class="avg-item"><div class="avg-val" style="color:${kas>=0?'var(--grn)':'var(--red)'}">${kas<0?'−':''}${rp(Math.abs(kas))}</div><div class="avg-lbl">Arus Kas</div></div>
      <div class="avg-item"><div class="avg-val" style="color:var(--grn)">${rp(masuk)}</div><div class="avg-lbl">Pemasukan</div></div>
      <div class="avg-item"><div class="avg-val" style="color:var(--red)">${rp(keluar)}</div><div class="avg-lbl">Pengeluaran</div></div>
    </div>
    <div style="margin-top:12px;font-size:0.75rem;color:var(--tx3);text-align:center">
      Periode: ${fmtDateShort(new Date(startDate))} – ${fmtDateShort(new Date(endDate))}
    </div>
  `;
  openBs('Arus Kas',html);
}

// ═══ BUD ITEM DETAIL ═══
function openBudItemDetail(kat){
  const{startDate,endDate}=getActivePeriodResolved();
  const sd=new Date(startDate);sd.setHours(0,0,0,0);
  const ed=new Date(endDate);ed.setHours(23,59,59,999);
  const rows=allRows.filter(r=>{
    const d=new Date(r.tanggal);
    return d>=sd&&d<=ed&&r.kategori===kat&&r.jenis==='Pengeluaran';
  }).sort((a,b)=>b.tanggal.localeCompare(a.tanggal));
  const total=rows.reduce((s,r)=>s+r.nominal,0);
  const members=getHouseholdMembers();
  const colorMap={};members.forEach(m=>colorMap[m.username]=m.color);
  const html=`
    <div style="text-align:center;margin-bottom:12px"><div style="font-size:1.3rem;font-weight:700;color:var(--ac)">${rp(total)}</div><div style="font-size:0.75rem;color:var(--tx3)">${rows.length} transaksi</div></div>
    ${rows.map(r=>{
      const recColor=colorMap[r.recorded_by]||'var(--tx3)';
      const recBadge=r.recorded_by?`<span class="rec-by-badge" style="background:${recColor}15;color:${recColor}">${r.recorded_by}</span>`:'';
      return`<div class="dc spd" style="margin-bottom:6px">
        <div class="dc-row1"><div class="dc-left">${recBadge} <span style="font-size:0.72rem;color:var(--tx3)">${formatTgl(r.tanggal)}</span></div><div class="dc-right"><span class="dc-nom spd">↑ ${rp(r.nominal)}</span></div></div>
        ${r.detail?`<div style="font-size:0.72rem;color:var(--tx3);padding:2px 0">${r.detail}</div>`:''}
      </div>`;
    }).join('')}
  `;
  openBs(kat,html);
}

// ═══ STRUK DETAIL ═══
function openStrukDetail(id){
  const r=allRows.find(x=>x.id===id||x.rowIndex===id);if(!r)return;
  const isIn=r.jenis==='Pemasukan';
  const members=getHouseholdMembers();
  const colorMap={};members.forEach(m=>colorMap[m.username]=m.color);
  const recColor=colorMap[r.recorded_by]||'var(--tx3)';
  const html=`
    <div class="struk">
      <div class="struk-nom ${isIn?'inc':'spd'}">${isIn?'↓':'↑'} ${rp(r.nominal)}</div>
      <div class="struk-kat">${r.kategori}</div>
      <div class="struk-divider"></div>
      <div class="struk-row"><span>Tanggal</span><span>${formatTgl(r.tanggal)}</span></div>
      <div class="struk-row"><span>Jenis</span><span>${r.jenis}</span></div>
      <div class="struk-row"><span>Metode</span><span>${r.metode||'—'}</span></div>
      <div class="struk-row"><span>Rekening</span><span>${r.pembayaran||'—'}</span></div>
      ${r.detail?`<div class="struk-row"><span>Keterangan</span><span>${r.detail}</span></div>`:''}
      ${r.recorded_by?`<div class="struk-row"><span>Dicatat oleh</span><span style="color:${recColor};font-weight:600">${r.recorded_by}</span></div>`:''}
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn-cx" style="flex:1" onclick="openEdit(${r.id||r.rowIndex});closeBs()">${IC.edit} Edit</button>
      <button class="btn-del" style="flex:1" onclick="confirmDelete(${r.id||r.rowIndex})">Hapus</button>
    </div>
  `;
  openBs('Detail Transaksi',html);
}
