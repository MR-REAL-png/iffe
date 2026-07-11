// ═══ SETTINGS PAGE ═══
// Fungsi utama settings sudah ada di modals.js
// File ini berisi helper tambahan untuk settings page

function initSettingsPage(){
  loadSettings();
  updateProfileUI();
  renderDrawerMembers();
}

// ═══ SETT AVATAR UPDATE ═══
// Avatar Settings sekarang pakai logo brand (lingkaran, di-render initLogo() dari helpers.js),
// bukan lagi kotak inisial berwarna per-user — jangan dikembalikan ke logika lama di sini.
function updateSettAvatar(){
  const session=getSession();if(!session)return;
  const{username,color}=session;
  if(typeof initLogo==='function')initLogo();
  const av=document.getElementById('settAvatar');
  if(av)av.style.borderColor=color;
  const unEl=document.getElementById('settUsername');
  if(unEl)unEl.textContent=username;
  const ulEl=document.getElementById('settUserLogin');
  if(ulEl)ulEl.innerHTML='<img src="shif-wordmark-outlined.png" alt="SHIF" style="height:16px;width:auto;object-fit:contain;display:block;margin-top:-2px">';
}
