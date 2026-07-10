// ═══════════════════════════════════════════════════
// CUSTOM SELECT (csel) — dropdown custom pengganti <select>
// Dipakai untuk: inKat, eKat, inBank, eBank
// Supaya bisa render ikon (Heroicon SVG) / swatch warna
// yang tidak bisa ditampilkan di <option> native.
//
// Cara pakai di HTML, untuk id "inKat" contoh:
//   <div class="csel">
//     <button type="button" class="inp csel-btn" id="inKatBtn" onclick="cselToggle('inKat')">
//       <span class="csel-ico" id="inKatIco"></span>
//       <span class="csel-lbl" id="inKatLbl">— Pilih —</span>
//       <svg class="csel-chev" ...></svg>
//     </button>
//     <input type="hidden" id="inKat" value="">
//     <div class="csel-panel" id="inKatPanel"></div>
//   </div>
//
// Kode lama yang baca/tulis document.getElementById('inKat').value
// TETAP JALAN TANPA DIUBAH — value setter di-override supaya
// otomatis update tampilan tombol & panel.
// ═══════════════════════════════════════════════════

function initCsel(id){
  const hidden=document.getElementById(id);
  if(!hidden||hidden._cselPatched)return;
  hidden._cselPatched=true;
  let _val=hidden.value||'';
  let _dis=false;
  Object.defineProperty(hidden,'value',{
    get(){return _val;},
    set(v){
      _val=(v===null||v===undefined)?'':String(v);
      const panel=document.getElementById(id+'Panel');
      const opts=(panel&&panel._cselOptions)||[];
      const opt=opts.find(o=>String(o.value)===_val);
      cselUpdateBtn(id,_val,opt?opt.label:(_val||(panel&&panel._cselPlaceholder)||''),opt?opt.icon:null,opt?opt.color:null);
    }
  });
  Object.defineProperty(hidden,'disabled',{
    get(){return _dis;},
    set(v){
      _dis=!!v;
      const btn=document.getElementById(id+'Btn');
      if(btn){btn.disabled=_dis;btn.classList.toggle('disabled',_dis);}
    }
  });
}

function cselSetOptions(id,options,selectedVal,placeholder){
  initCsel(id);
  const panel=document.getElementById(id+'Panel');
  const hidden=document.getElementById(id);
  if(!panel||!hidden)return;
  options=options||[];
  panel._cselOptions=options;
  panel._cselPlaceholder=placeholder||'— Pilih —';
  if(!options.length){
    panel.innerHTML=`<div class="csel-empty">${placeholder||'Tidak ada pilihan'}</div>`;
  }else{
    panel.innerHTML=options.map(o=>`
      <div class="csel-opt" data-val="${String(o.value).replace(/"/g,'&quot;')}" onclick="cselChoose('${id}','${String(o.value).replace(/'/g,"\\'")}')">
        <span class="csel-opt-left">
          ${o.icon?`<span class="csel-opt-ico">${o.icon}</span>`:(o.color?`<span class="csel-opt-dot" style="background:${o.color}"></span>`:'')}
          <span class="csel-opt-lbl">${o.label}</span>
        </span>
        <svg class="csel-opt-check" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M5 13l4 4L19 7"/></svg>
      </div>`).join('');
  }
  const valid=options.some(o=>String(o.value)===String(selectedVal));
  hidden.value=valid?selectedVal:'';
}

function cselChoose(id,val){
  const hidden=document.getElementById(id);
  if(!hidden)return;
  hidden.value=val;
  cselCloseAll();
  hidden.dispatchEvent(new Event('change'));
}

function cselUpdateBtn(id,val,label,icon,color){
  const lbl=document.getElementById(id+'Lbl');
  const ico=document.getElementById(id+'Ico');
  if(lbl)lbl.textContent=label||'';
  if(ico)ico.innerHTML=icon?icon:(color?`<span class="csel-dot" style="background:${color}"></span>`:'');
  const panel=document.getElementById(id+'Panel');
  if(panel)panel.querySelectorAll('.csel-opt').forEach(el=>el.classList.toggle('sel',el.dataset.val===String(val)));
}

function cselCloseAll(){
  document.querySelectorAll('.csel-panel.open').forEach(p=>p.classList.remove('open'));
  const bd=document.getElementById('cselBackdrop');if(bd)bd.classList.remove('open');
}

function cselToggle(id){
  const panel=document.getElementById(id+'Panel');
  const btn=document.getElementById(id+'Btn');
  if(!panel||(btn&&btn.disabled))return;
  const isOpen=panel.classList.contains('open');
  cselCloseAll();
  if(!isOpen){
    panel.classList.add('open');
    const bd=document.getElementById('cselBackdrop');if(bd)bd.classList.add('open');
  }
}
document.addEventListener('click',(e)=>{
  if(!e.target.closest('.csel')&&!e.target.closest('.csel-panel'))cselCloseAll();
});

// ═══════════════════════════════════════════════════
// LIBRARY IKON KATEGORI (Heroicon-style, outline, konsisten
// dengan gaya SVG yang sudah dipakai di seluruh app)
// ═══════════════════════════════════════════════════
const KAT_ICON_LIST=[
  {key:'food',label:'Makanan',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.25 3v6M12 3v6M15.75 3v6M8.25 9c0 2-1.5 2.5-1.5 4.5V21m7.5-12c0 2 1.5 2.5 1.5 4.5V21M12 9v12"/></svg>'},
  {key:'drink',label:'Minuman',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l-1.5 15.5A2 2 0 0 1 14.5 20h-5a2 2 0 0 1-2-1.8L6 3Z"/><path d="M6.5 8h11"/></svg>'},
  {key:'transport',label:'Transportasi',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.75 16.5 5.16 8.9a3 3 0 0 1 2.95-2.4h7.78a3 3 0 0 1 2.95 2.4l1.41 7.6M3.75 16.5v3a.75.75 0 0 0 .75.75H6a.75.75 0 0 0 .75-.75v-1.5m-3-1.5h16.5m0 0v3a.75.75 0 0 1-.75.75H18a.75.75 0 0 1-.75-.75v-1.5M6.75 13.5h10.5"/><circle cx="7.5" cy="16.5" r="1"/><circle cx="16.5" cy="16.5" r="1"/></svg>'},
  {key:'fuel',label:'Bensin',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 21V6.75A2.25 2.25 0 0 1 6.75 4.5h4.5A2.25 2.25 0 0 1 13.5 6.75V21M4.5 21h9M4.5 10.5h9M13.5 9l3 2.2v6.3a1.5 1.5 0 0 0 3 0v-4.2c0-.6-.24-1.17-.66-1.59L16.5 9.3"/></svg>'},
  {key:'shopping',label:'Belanja',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7.5V6a6 6 0 1 1 12 0v1.5M4.5 7.5h15l-.9 12.15A2.25 2.25 0 0 1 16.36 21.75H7.64a2.25 2.25 0 0 1-2.24-2.1L4.5 7.5Z"/></svg>'},
  {key:'bills',label:'Tagihan',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 3h9a1.5 1.5 0 0 1 1.5 1.5v16.5l-3-1.8-2.25 1.8L10.5 19.2l-2.25 1.8L6 19.2V4.5A1.5 1.5 0 0 1 7.5 3Z"/><path d="M9 8.25h6M9 11.25h6M9 14.25h3"/></svg>'},
  {key:'electricity',label:'Listrik',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 2.25 4.5 13.5h6L9.75 21.75 19.5 10.5h-6l.75-8.25Z"/></svg>'},
  {key:'water',label:'Air/PDAM',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.25S5.25 10 5.25 14.75a6.75 6.75 0 0 0 13.5 0C18.75 10 12 2.25 12 2.25Z"/></svg>'},
  {key:'internet',label:'Internet',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.25 16.5a5.25 5.25 0 0 1 7.5 0M4.5 12.75a10.5 10.5 0 0 1 15 0M1.5 9a15 15 0 0 1 21 0"/><circle cx="12" cy="19.5" r="1"/></svg>'},
  {key:'phone',label:'Pulsa/Telpon',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.25 4.5h7.5A1.5 1.5 0 0 1 17.25 6v12a1.5 1.5 0 0 1-1.5 1.5h-7.5A1.5 1.5 0 0 1 6.75 18V6a1.5 1.5 0 0 1 1.5-1.5Z"/><path d="M11 17.25h2"/></svg>'},
  {key:'home',label:'Rumah/Kos',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"/></svg>'},
  {key:'health',label:'Kesehatan',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-10-9.2C.6 8.4 2.4 4.5 6 4.5c2.1 0 3.6 1.4 4.5 2.6a5.4 5.4 0 0 1 1.5-1.6c1-.7 2.4-1 3.5-1 3.6 0 5.4 3.9 4 7.3C17 16.4 12 21 12 21Z"/><path d="M9.5 11h2l1-2 1.5 4 1-2h1.5"/></svg>'},
  {key:'education',label:'Pendidikan',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.25 8.25 12 13.5l9.75-5.25L12 3Z"/><path d="M6 10.5v5.25c0 .6 2.5 3 6 3s6-2.4 6-3V10.5"/></svg>'},
  {key:'entertainment',label:'Hiburan',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.25" width="18" height="13.5" rx="2"/><path d="M9.75 9v6l5.25-3-5.25-3Z"/></svg>'},
  {key:'gift',label:'Hadiah',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.75 9.75h16.5v10.5a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75V9.75Z"/><path d="M2.25 6.75A1.5 1.5 0 0 1 3.75 5.25h16.5a1.5 1.5 0 0 1 1.5 1.5v3h-19.5v-3Z"/><path d="M12 5.25v16.5"/><path d="M12 5.25c0-1.5-1.2-3-3-3-1.3 0-2.25 1-2.25 2.1 0 .9.75.9 1.5.9H12Z"/><path d="M12 5.25c0-1.5 1.2-3 3-3 1.3 0 2.25 1 2.25 2.1 0 .9-.75.9-1.5.9H12Z"/></svg>'},
  {key:'salary',label:'Gaji',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.25" y="6.75" width="19.5" height="12" rx="2"/><circle cx="12" cy="12.75" r="2.5"/><path d="M6 6.75V5.25a1.5 1.5 0 0 1 1.5-1.5h9a1.5 1.5 0 0 1 1.5 1.5v1.5"/></svg>'},
  {key:'savings',label:'Tabungan',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.75c0-3.5 3-6 7.5-6 3.3 0 5.4 1.2 6.4 2.6.55.05 1.6.3 1.6 1.65 0 1.15-.85 1.5-1.4 1.6-.3 1.7-1.3 2.9-2.6 3.6v2.3a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-.75c-.65.1-1.3.1-2 0v.75a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-2.35c-1.5-.85-2.5-2.15-2.5-3.4Z"/><circle cx="16" cy="10.5" r=".5" fill="currentColor" stroke="none"/></svg>'},
  {key:'debt',label:'Utang/Piutang',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4.5l2-4 3 8 2-4H21"/></svg>'},
  {key:'travel',label:'Perjalanan',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.75 2.25-9 9M21.75 2.25 15 21.75l-3.75-7.5-7.5-3.75 17.25-8.25Z"/></svg>'},
  {key:'pet',label:'Hewan',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="8" r="1.6"/><circle cx="12" cy="6" r="1.6"/><circle cx="17" cy="8" r="1.6"/><circle cx="19" cy="12.5" r="1.6"/><path d="M6 15c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5-2.2 5.5-6 5.5-6-3-6-5.5Z"/></svg>'},
  {key:'sport',label:'Olahraga',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9Z"/></svg>'},
  {key:'insurance',label:'Asuransi',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5 4.5 5.75v6c0 5 3.2 8.7 7.5 9.75 4.3-1.05 7.5-4.75 7.5-9.75v-6L12 2.5Z"/><path d="m9.25 12 2 2 3.5-4"/></svg>'},
  {key:'family',label:'Keluarga',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><path d="M2.5 20c0-3 2.5-5.25 5.5-5.25S13.5 17 13.5 20M10.5 20c0-3 2.5-5.25 5.5-5.25s5.5 2.25 5.5 5.25"/></svg>'},
  {key:'coffee',label:'Kopi/Cafe',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 8.25h11.25v6a4.5 4.5 0 0 1-4.5 4.5h-2.25a4.5 4.5 0 0 1-4.5-4.5v-6Z"/><path d="M15.75 9.75h1.5a2.25 2.25 0 0 1 0 4.5h-1.5"/><path d="M7.5 4.5c0-.83.4-1.2.75-1.5M11 4.5c0-.83.4-1.2.75-1.5"/></svg>'},
  {key:'laundry',label:'Laundry',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.75" y="2.25" width="16.5" height="19.5" rx="2"/><circle cx="12" cy="13.5" r="4.5"/><circle cx="12" cy="13.5" r="2"/><circle cx="7" cy="5.25" r=".6" fill="currentColor" stroke="none"/><circle cx="10" cy="5.25" r=".6" fill="currentColor" stroke="none"/></svg>'},
  {key:'parking',label:'Parkir',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.75" y="3.75" width="16.5" height="16.5" rx="2.5"/><path d="M9.5 16.5v-9h3.25a2.75 2.75 0 1 1 0 5.5H9.5"/></svg>'},
  {key:'beauty',label:'Kecantikan',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.5" cy="6.5" r="2.25"/><circle cx="6.5" cy="17.5" r="2.25"/><path d="M20.25 5.25 8.5 12l11.75 6.75M8.5 12 4.5 9.75M8.5 12l-4 2.25"/></svg>'},
  {key:'subscription',label:'Langganan',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.25" width="18" height="13.5" rx="2"/><path d="M3 9.75h18"/><path d="M7 14.25h4"/></svg>'},
  {key:'donation',label:'Donasi',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-4-9-8.3C1.3 9.8 2.8 6.5 6 6.5c1.8 0 3.1 1.1 3.9 2.3M12 21s6.5-4 9-8.3c1.7-2.9.2-6.2-3-6.2-1.8 0-3.1 1.1-3.9 2.3"/><path d="M9 6.5V3.75M9 3.75h-1.5a1.5 1.5 0 0 0 0 3H10a1.5 1.5 0 0 1 0 3H7.5"/></svg>'},
  {key:'tax',label:'Pajak',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4.5 4.5V21H6V3Z"/><path d="M15 3v4.5h4.5"/><path d="m9.5 17 5-5.5"/><circle cx="9.75" cy="12" r=".9"/><circle cx="14.25" cy="16.25" r=".9"/></svg>'},
  {key:'repair',label:'Servis/Reparasi',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.6 5l-6.6 6.6a1.5 1.5 0 0 0 2.1 2.1l6.6-6.6a4 4 0 0 0 5-5.6l-2.5 2.5-2-2 2.5-2.5Z"/></svg>'},
  {key:'furniture',label:'Perabotan',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.25 11.25v-3a3 3 0 0 1 3-3h7.5a3 3 0 0 1 3 3v3"/><path d="M3.75 11.25h16.5v4.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-4.5Z"/><path d="M5.25 17.25 4.5 21m14.25-3.75.75 3.75"/></svg>'},
  {key:'baby',label:'Anak/Bayi',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3.75h6v3a3 3 0 0 1-.5 1.66l-.2.34H9.7l-.2-.34A3 3 0 0 1 9 6.75v-3Z"/><path d="M8.25 8.75h7.5l1 8.5a2.5 2.5 0 0 1-2.48 2.75H9.73a2.5 2.5 0 0 1-2.48-2.75l1-8.5Z"/><path d="M10 14c.5.5 1 .75 2 .75s1.5-.25 2-.75"/></svg>'},
  {key:'books',label:'Buku',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5c2.5-1 5.5-1 8 0v15c-2.5-1-5.5-1-8 0v-15Z"/><path d="M12 4.5c2.5-1 5.5-1 8 0v15c-2.5-1-5.5-1-8 0"/></svg>'},
  {key:'music',label:'Musik',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5.25L20 3v12.75"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="15.75" r="2.5"/></svg>'},
  {key:'fashion',label:'Pakaian',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4.5 12 6l3-1.5 4.5 3-2.25 3-2.25-1.2V21h-6V9.3L6.75 10.5 4.5 7.5 9 4.5Z"/></svg>'},
  {key:'electronics',label:'Elektronik',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M8.25 20.25h7.5M12 16.5v3.75"/></svg>'},
  {key:'restaurant',label:'Makan di Luar',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 3v6.5a2.5 2.5 0 0 0 5 0V3M10 9.5V21M16.5 3c-1.2 0-2 1.5-2 4s.8 5 2 5v9"/></svg>'},
  {key:'toll',label:'Tol',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 21V9L12 3l7.5 6v12"/><path d="M8.25 21v-6a1.5 1.5 0 0 1 1.5-1.5h4.5a1.5 1.5 0 0 1 1.5 1.5v6"/><path d="M4.5 12h15"/></svg>'},
  {key:'fee',label:'Biaya Admin',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 15V9l3 3 3-3v6"/></svg>'},
  {key:'other',label:'Lainnya',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6.75h.008v.008H6V6.75Z"/><path d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"/></svg>'}
];
const KAT_ICON_MAP={};
KAT_ICON_LIST.forEach(i=>{KAT_ICON_MAP[i.key]=i});

// Default: kategori bawaan (belum pernah di-set manual) -> ikon otomatis
const KAT_ICON_DEFAULT_MAP={
  'gaji':'salary','bonus':'salary','freelance':'salary','transfer masuk':'salary','investasi':'savings','lainnya':'other',
  'bensin':'fuel','belanja':'shopping','makanan':'food','bayar kos':'home','kos':'home','lain lain':'other',
  'transportasi':'transport','bulanan':'bills','listrik':'electricity','listrik rumah':'electricity',
  'piutang':'debt','tabungan':'savings','internet':'internet','air':'water','pdam':'water','tf rumah':'home',
  'kesehatan':'health','pendidikan':'education','hiburan':'entertainment','hadiah':'gift','pulsa':'phone','asuransi':'insurance',
  'kopi':'coffee','cafe':'coffee','ngopi':'coffee','laundry':'laundry','cuci baju':'laundry','parkir':'parking',
  'kecantikan':'beauty','salon':'beauty','skincare':'beauty','langganan':'subscription','subscription':'subscription',
  'donasi':'donation','sedekah':'donation','pajak':'tax','servis':'repair','reparasi':'repair','bengkel':'repair',
  'perabotan':'furniture','furniture':'furniture','anak':'baby','bayi':'baby','buku':'books','musik':'music',
  'pakaian':'fashion','baju':'fashion','elektronik':'electronics','gadget':'electronics','makan diluar':'restaurant',
  'restoran':'restaurant','tol':'toll','biaya admin':'fee','admin':'fee'
};

// Map runtime: nama kategori (lowercase) -> icon key, dibangun dari mm_custom_kats
let katIconMap={};
function normalizeKatList(raw){
  return (raw||[]).map(x=>typeof x==='string'?{name:x,icon:'other'}:{name:x.name,icon:x.icon||'other'});
}
function rebuildKatIconMap(){
  katIconMap={};
  const customKats=normalizeKatList(JSON.parse(localStorage.getItem('mm_custom_kats')||'[]'));
  customKats.forEach(k=>{katIconMap[k.name.toLowerCase()]=k.icon||'other';});
}
function getKatIconKey(name){
  const n=(name||'').toLowerCase();
  return katIconMap[n]||KAT_ICON_DEFAULT_MAP[n]||'other';
}
function getKatIconSVG(name){
  const key=getKatIconKey(name);
  return (KAT_ICON_MAP[key]||KAT_ICON_MAP.other).svg;
}
// Ikon kecil (untuk dipakai di teks/inline, sudah wrap size)
function katIconInline(name,size){
  size=size||16;
  return `<span style="display:inline-flex;width:${size}px;height:${size}px;flex-shrink:0;vertical-align:-3px;margin-right:4px">${getKatIconSVG(name)}</span>`;
}

// ═══════════════════════════════════════════════════
// WARNA BANK CUSTOM
// ═══════════════════════════════════════════════════
let bankColorMap={};
function normalizeBankList(raw){
  return (raw||[]).map(x=>typeof x==='string'?{name:x,color:null}:{name:x.name,color:x.color||null});
}
function rebuildBankColorMap(){
  bankColorMap={};
  const customBanks=normalizeBankList(JSON.parse(localStorage.getItem('mm_custom_banks')||'[]'));
  customBanks.forEach(b=>{if(b.color)bankColorMap[b.name.toLowerCase()]=b.color;});
}
function getBankColor(name){
  return bankColorMap[(name||'').toLowerCase()]||null;
}
// ═══════════════════════════════════════════════════
// WARNA PILL (badge kecil di list transaksi/struk) — TERPISAH dari BANK_THEMES
// Supaya kartu ATM di Dompet tetap pakai warna aslinya, tapi pill di list
// tetap gampang dibedain (BRI/BCA/Dana/OVO/Mandiri/Jago semua mirip biru/oranye di BANK_THEMES)
// ═══════════════════════════════════════════════════
const PILL_COLORS={
  'bri':'#1e3a8a',      // navy
  'bca':'#0e7490',      // teal/cyan
  'dana':'#a21caf',     // magenta/fuchsia
  'ovo':'#6d28d9',      // ungu
  'mandiri':'#b45309',  // amber
  'jago':'#be123c',     // rose
};
function getBankPillColor(name){
  const custom=getBankColor(name);
  if(custom)return custom;
  const key=Object.keys(PILL_COLORS).find(k=>name&&name.toLowerCase().includes(k));
  if(key)return PILL_COLORS[key];
  return getBankDisplayColor(name); // fallback: bank lain tetap ikut warna kartu
}

// Warna yang ditampilkan di manapun (list Kelola Rekening, dropdown Bank input transaksi, dst):
// custom kalau ada, kalau nggak pakai warna tema bawaan dari BANK_THEMES (dompet.js)
// — biar SELALU konsisten sama warna kartu ATM di halaman Dompet.
function extractFirstColor(grad){
  const m=grad&&grad.match(/#[0-9a-fA-F]{3,6}/);
  return m?m[0]:'#38bdf8';
}
function getBankDisplayColor(name){
  const custom=getBankColor(name);
  if(custom)return custom;
  if(typeof BANK_THEMES==='undefined')return null;
  const key=Object.keys(BANK_THEMES).find(k=>name&&name.toLowerCase().includes(k.toLowerCase())&&k!=='default');
  const theme=key?BANK_THEMES[key]:null;
  return theme?extractFirstColor(theme.grad):null;
}
function lightenColor(hex,pct){
  hex=(hex||'').replace('#','');
  if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');
  const num=parseInt(hex,16);
  if(isNaN(num))return '#38bdf8';
  let r=(num>>16)+Math.round(255*pct/100);
  let g=((num>>8)&0xff)+Math.round(255*pct/100);
  let b=(num&0xff)+Math.round(255*pct/100);
  r=Math.min(255,Math.max(0,r));g=Math.min(255,Math.max(0,g));b=Math.min(255,Math.max(0,b));
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
