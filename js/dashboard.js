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
  const now=new Date();
  const b=MOS[now.getMonth()],t=String(now.getFullYear());
  const lbl=document.getElementById('dashPeriodLabel');
  if(lbl)lbl.textContent=`${b} ${t}`;
  document.getElementById('d-kas').textContent='...';
  document.getElementById('d-masuk').textContent='...';
  document.getElementById('d-keluar').textContent='...';
  const _bmon=document.getElementById('budgetMonitor');if(_bmon)_bmon.style.display='none';
  const _bmonLbl=document.getElementById('bmonSecLbl');if(_bmonLbl)_bmonLbl.style.display='none';
  try{
    if(!allRows.length)allRows=await fetchAllData();
    const{startDate,endDate}=getActivePeriodResolved();
    const sd=new Date(startDate);sd.setHours(0,0,0,0);
    const ed=new Date(endDate);ed.setHours(23,59,59,999);
    const rows=allRows.filter(r=>{const d=new Date(r.tanggal);return d>=sd&&d<=ed});
    const masuk=rows.filter(r=>r.jenis==='Pemasukan').reduce((s,r)=>s+r.nominal,0);
    const keluar=rows.filter(r=>r.jenis==='Pengeluaran').reduce((s,r)=>s+r.nominal,0);
    const kas=masuk-keluar;
    const days=[...new Set(rows.map(r=>r.tanggal))].length;
    const tdim=new Date(parseInt(t),MOS.indexOf(b)+1,0).getDate();
    const FIXED_CATS=JSON.parse(localStorage.getItem('mm_fixed_cats')||'["Tabungan","Kos","Tf Rumah","Listrik Rumah","Internet","Listrik"]');
    const fleks=rows.filter(r=>r.jenis==='Pengeluaran'&&!FIXED_CATS.some(fc=>r.kategori.toLowerCase().includes(fc.toLowerCase())));
    const totalFleks=fleks.reduce((s,r)=>s+r.nominal,0);
    const totalDaysPeriode=Math.round((ed-sd)/(1000*60*60*24));
    const avgHarian=totalDaysPeriode>0?Math.round(totalFleks/totalDaysPeriode):0;
    const byKat=groupBy(rows.filter(r=>r.jenis==='Pengeluaran'),'kategori');
    const byKatArr=Object.entries(byKat).map(([k,v])=>({kategori:k,nominal:v.reduce((s,r)=>s+r.nominal,0)})).sort((a,b)=>b.nominal-a.nominal);
    const byKatFleks=groupBy(fleks,'kategori');
    const byKatFleksArr=Object.entries(byKatFleks).map(([k,v])=>({kategori:k,nominal:v.reduce((s,r)=>s+r.nominal,0)})).sort((a,b)=>b.nominal-a.nominal);

    document.getElementById('hk-periode-lbl').textContent=`${b} ${t}`;
    countUp('d-kas',Math.abs(kas),kas<0?'−':'');
    document.getElementById('d-masuk').textContent=rpShort(masuk);
    document.getElementById('d-keluar').textContent=rpShort(keluar);
    document.getElementById('d-avg').textContent=rpShort(avgHarian);
    document.getElementById('d-active-days').textContent=`${days} hari`;
    document.getElementById('d-total-days-val').textContent=`${tdim} hari`;

    // Rata² Budget = kas sisa ÷ sisa hari
    const sisaHariNow=getSisaHari(endDate).total;
    const avgBudget=sisaHariNow>0?Math.round(kas/sisaHariNow):0;
    const elAvgBudget=document.getElementById('d-avg-budget');
    if(elAvgBudget){
      elAvgBudget.textContent=kas<=0?'—':rpShort(avgBudget);
      elAvgBudget.style.color=kas<=0?'var(--red)':'#fbbf24';
    }

    avgDetailData={totalFleksibel:totalFleks,totalDays:totalDaysPeriode,avgHarian,byKategori:byKatFleksArr,kas,masuk,keluar,sisaHari:sisaHariNow,avgBudget,startDate,endDate};

    // Render member activity di dashboard
    renderMemberActivity(rows);

    const _bKey=getBudgetMonthKey(new Date(startDate).getFullYear(),new Date(startDate).getMonth());
    const _budgets=getBudgetsForMonth(_bKey);
    const _hasBudget=Object.values(_budgets).some(v=>Number(v)>0);
    const _kompSec=document.getElementById('kompSection');
    if(_kompSec)_kompSec.style.display=_hasBudget?'none':'';

    renderChartKat(byKatArr);
    renderBudget(byKatArr);
    renderChartHarian(rows);
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
  const legendColor=isOcean?'#B8DEFF':'#E2D9FF';
  const plugin={id:'rdg',afterDraw(chart){
    const{ctx:c,chartArea:ca}=chart;if(!ca)return;
    const cx=(ca.left+ca.right)/2,cy=(ca.top+ca.bottom)/2;
    c.save();c.textAlign='center';c.textBaseline='middle';
    c.fillStyle=isOcean?'rgba(184,222,255,0.6)':'rgba(226,217,255,0.6)';
    c.font=`500 11px 'DM Sans',sans-serif`;c.fillText('Total',cx,cy-14);
    c.fillStyle='rgba(255,255,255,0.95)';
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
  const tc='rgba(255,255,255,0.45)';
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
  const now=new Date();
  const bKey=getBudgetMonthKey(now.getFullYear(),now.getMonth());
  const budgets=getBudgetsForMonth(bKey);
  const hasBudget=Object.values(budgets).some(v=>Number(v)>0);
  const kompSec=document.getElementById('kompSection');
  if(kompSec)kompSec.style.display=hasBudget?'none':'';
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
  if(!allItems.length){el.style.display='none';secLbl.style.display='none';return}
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
    const byYear=groupBy(allRows,'tanggal');
    const years=[...new Set(allRows.map(r=>r.tanggal?.slice(0,4)).filter(Boolean))].sort().reverse();
    if(!years.length){el.innerHTML=`<div class="empty"><div class="ei">${IC.chart}</div><p>Belum ada data</p></div>`;return}
    el.innerHTML=years.map(y=>{
      const yRows=allRows.filter(r=>r.tanggal?.startsWith(y));
      const masuk=yRows.filter(r=>r.jenis==='Pemasukan').reduce((s,r)=>s+r.nominal,0);
      const keluar=yRows.filter(r=>r.jenis==='Pengeluaran').reduce((s,r)=>s+r.nominal,0);
      const kas=masuk-keluar;
      const byBulan=MOS.map((m,i)=>{
        const mRows=yRows.filter(r=>r.bulan===m);
        const mk=mRows.filter(r=>r.jenis==='Pemasukan').reduce((s,r)=>s+r.nominal,0);
        const kk=mRows.filter(r=>r.jenis==='Pengeluaran').reduce((s,r)=>s+r.nominal,0);
        return{bulan:m,masuk:mk,keluar:kk,kas:mk-kk,count:mRows.length};
      }).filter(m=>m.count>0);
      return`<div class="rekap-year">
        <div class="rekap-year-hd"><span class="rekap-year-lbl">${y}</span><span class="rekap-kas ${kas>=0?'g':'r'}">${kas>=0?'+':'−'}${rpShort(Math.abs(kas))}</span></div>
        <div class="rekap-pills"><span class="rek-pill g">↓ ${rpShort(masuk)}</span><span class="rek-pill r">↑ ${rpShort(keluar)}</span></div>
        ${byBulan.map(m=>`<div class="rekap-row"><span class="rekap-bulan">${m.bulan}</span><span class="rekap-nom g">+${rpShort(m.masuk)}</span><span class="rekap-nom r">−${rpShort(m.keluar)}</span><span class="rekap-nom ${m.kas>=0?'g':'r'}">${m.kas>=0?'+':'−'}${rpShort(Math.abs(m.kas))}</span></div>`).join('')}
      </div>`;
    }).join('');
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
    el.innerHTML=`<div class="chart-card" style="margin-bottom:12px"><canvas id="chartMetode" height="200"></canvas></div>`+
      items.map((m,i)=>{
        const pct=Math.round(m.nominal/total*100);
        return`<div class="bud-item"><div class="bud-top"><span class="bud-name">${m.metode}</span><span class="bud-pct">${pct}%</span></div><div class="bud-bar"><div class="bud-fill bud-ok" style="width:0%" data-w="${pct}"></div></div><div class="bud-amts"><span>${rp(m.nominal)}</span><span>${m.count} transaksi</span></div></div>`;
      }).join('');
    setTimeout(()=>{el.querySelectorAll('.bud-fill').forEach(e=>e.style.width=e.dataset.w+'%')},100);
    // Render pie chart metode
    const ctx=document.getElementById('chartMetode')?.getContext('2d');
    if(ctx){
      if(chartMetode){try{chartMetode.destroy()}catch(e){}}
      chartMetode=new Chart(ctx,{
        type:'doughnut',
        data:{labels:items.map(m=>m.metode),datasets:[{data:items.map(m=>m.nominal),backgroundColor:CHART_COLORS.slice(0,items.length),borderWidth:1.5,borderColor:'rgba(15,12,41,0.6)',hoverOffset:6}]},
        options:{responsive:true,cutout:'50%',plugins:{legend:{display:true,position:'bottom',labels:{color:'rgba(255,255,255,0.7)',font:{size:11},padding:12}},tooltip:{callbacks:{label:c=>` ${c.label}: ${rp(c.raw)}`}}}}
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
  const{startDate,endDate}=getActivePeriodResolved();
  const sd=new Date(startDate);sd.setHours(0,0,0,0);
  const ed=new Date(endDate);ed.setHours(23,59,59,999);
  const rows=allRows.filter(r=>{const d=new Date(r.tanggal);return d>=sd&&d<=ed});
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
    const bg=nom>0?`rgba(244,114,182,${intensity*0.6})`:'transparent';
    const cl=isToday?'kal-cell today':'kal-cell';
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
  const tc='rgba(255,255,255,0.4)';
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
    <button class="btn-ok" style="width:100%;margin-top:8px" onclick="submitAddTabungan()">Simpan</button>
  `);
}

async function submitAddTabungan(){
  const nama=document.getElementById('tabNama')?.value.trim();
  const target=getNomVal('tabTarget');
  const terkumpul=getNomVal('tabAwal');
  if(!nama||!target){toast('Lengkapi data tabungan','err');return}
  try{
    const hid=getHouseholdId();
    await fetch(`${API_URL}/api/sheets?action=append-tabungan`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({household_id:hid,nama,target,terkumpul})});
    closeBs();toast('Tabungan ditambahkan ✓','ok');loadTabungan();
  }catch(e){toast('Gagal simpan','err')}
}

function openTopupTabungan(id,nama,terkumpul,target){
  openBs(`Topup: ${nama}`,`
    <div style="text-align:center;margin-bottom:12px"><div style="font-size:0.8rem;color:var(--tx3)">Terkumpul saat ini</div><div style="font-size:1.2rem;font-weight:700;color:var(--grn)">${rp(terkumpul)}</div><div style="font-size:0.75rem;color:var(--tx3)">dari ${rp(target)}</div></div>
    <div class="inp-row"><label class="inp-lbl">Jumlah Topup</label><input type="text" id="topupNom" class="inp" inputmode="numeric" oninput="fmtNom(this)" placeholder="0"></div>
    <button class="btn-ok" style="width:100%;margin-top:8px" onclick="submitTopup(${id},${terkumpul})">Topup</button>
  `);
}

async function submitTopup(id,current){
  const tambah=getNomVal('topupNom');if(!tambah){toast('Isi jumlah topup','err');return}
  try{
    const hid=getHouseholdId();
    await fetch(`${API_URL}/api/sheets?action=update-tabungan`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,household_id:hid,terkumpul:current+tambah})});
    closeBs();toast('Topup berhasil ✓','ok');loadTabungan();
  }catch(e){toast('Gagal topup','err')}
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
