// ═══ SETTINGS PAGE ═══
// Fungsi utama settings sudah ada di modals.js
// File ini berisi helper tambahan untuk settings page

function initSettingsPage(){
  loadSettings();
  updateProfileUI();
  renderDrawerMembers();
}

// ═══ SETT AVATAR UPDATE ═══
function updateSettAvatar(){
  const session=getSession();if(!session)return;
  const av=document.getElementById('settAvatar');
  if(av){
    av.style.cssText=`width:64px;height:64px;border-radius:20px;background:${session.color}20;border:2px solid ${session.color};display:flex;align-items:center;justify-content:center;margin:0 auto 8px`;
    av.innerHTML=`<span style="color:${session.color};font-size:1.8rem;font-weight:800">${session.username.charAt(0).toUpperCase()}</span>`;
  }
  const unEl=document.getElementById('settUsername');
  if(unEl)unEl.textContent=session.username;
  const ulEl=document.getElementById('settUserLogin');
  if(ulEl){ulEl.textContent=APP_NAME;ulEl.style.color=session.color;}
}
