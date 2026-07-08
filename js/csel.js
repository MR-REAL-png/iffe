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
        ${o.icon?`<span class="csel-opt-ico">${o.icon}</span>`:(o.color?`<span class="csel-opt-dot" style="background:${o.color}"></span>`:'')}
        <span class="csel-opt-lbl">${o.label}</span>
      </div>`).join('');
  }
  const valid=options.some(o=>String(o.value)===String(selectedVal));
  hidden.value=valid?selectedVal:'';
}

function cselChoose(id,val){
  const hidden=document.getElementById(id);
  if(!hidden)return;
  hidden.value=val;
  const panel=document.getElementById(id+'Panel');
  if(panel)panel.classList.remove('open');
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

function cselToggle(id){
  const panel=document.getElementById(id+'Panel');
  const btn=document.getElementById(id+'Btn');
  if(!panel||(btn&&btn.disabled))return;
  const isOpen=panel.classList.contains('open');
  document.querySelectorAll('.csel-panel.open').forEach(p=>p.classList.remove('open'));
  if(!isOpen)panel.classList.add('open');
}
document.addEventListener('click',(e)=>{
  if(!e.target.closest('.csel'))document.querySelectorAll('.csel-panel.open').forEach(p=>p.classList.remove('open'));
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
  'kesehatan':'health','pendidikan':'education','hiburan':'entertainment','hadiah':'gift','pulsa':'phone','asuransi':'insurance'
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
