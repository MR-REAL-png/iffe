// ═══ PIN STATE ═══
let pinMode = 'select';   // 'select' | 'login' | 'register' | 'confirm' | 'join'
let pinBuffer = '';
let pinRegisterPin = '';
let pinSelectedUser = null; // username yang dipilih di user picker

// ═══ INIT ═══
function initPinOverlay() {
  const session = getSession();
  if (session?.username && session?.household_id) {
    hidePinOverlay();
    updateProfileUI();
    return;
  }
  showPinOverlay();
}

function showPinOverlay() {
  const ov = document.getElementById('pinOverlay');
  if (ov) { ov.style.display = 'flex'; ov.classList.add('visible'); ov.classList.remove('hidden'); }
  pinBuffer = '';
  initPinStars();
  updatePinDatetime();
  if (!window._pinDatetimeTimer) window._pinDatetimeTimer = setInterval(updatePinDatetime, 1000);

  // Cek apakah household sudah ada (ada member tersimpan)
  const members = getHouseholdMembers();
  if (members.length > 0) {
    showUserPicker(members);
  } else {
    showSetupScreen();
  }
}

// ═══ LOADING STATE (wordmark) — ditampilin sebentar setelah PIN/login sukses,
// selama nunggu refreshMembers/pullSettings/loadDashboard, sebelum overlay ditutup ══
function showPinLoadingState() {
  const wrap = document.getElementById('pinWrap');
  if (!wrap) return;
  wrap.innerHTML = `
    <div class="pin-loading-wrap">
      <img src="./shif-wordmark-outlined.png" alt="SHIF" class="pin-loading-wordmark">
      <div class="pin-loading-dots"><span></span><span></span><span></span></div>
    </div>
  `;
}

function hidePinOverlay() {
  const ov = document.getElementById('pinOverlay');
  if (ov) {
    ov.classList.add('hidden'); ov.classList.remove('visible');
    setTimeout(() => {
      ov.style.display = 'none';
      // Fix Android: setelah overlay fixed inset:0 dihapus, body kadang "lupa"
      // ngitung ulang area yang bisa di-scroll sampai ada reflow lain (misal buka
      // drawer). Paksa reflow + trigger resize di sini biar scroll langsung normal.
      void document.body.offsetHeight;
      window.dispatchEvent(new Event('resize'));
    }, 400);
  }
}

// ═══ SCREEN: USER PICKER ═══
// Tampil dua avatar — pilih siapa yang mau login
function showUserPicker(members) {
  pinMode = 'select';
  pinBuffer = '';
  const wrap = document.getElementById('pinWrap');
  if (!wrap) return;

  const cards = members.map(m => `
    <div class="pin-user-card" onclick="selectUser('${m.username}','${m.color}')" style="--uc:${m.color}">
      <div class="pin-user-avatar" style="background:${m.color}20;border:2px solid ${m.color}">
        <span style="color:${m.color};font-size:1.4rem;font-weight:700">${m.username.charAt(0).toUpperCase()}</span>
      </div>
      <div class="pin-user-name" style="color:${m.color}">${m.username}</div>
    </div>
  `).join('');

  wrap.innerHTML = `
    <div class="pin-logo" id="pinLogo"></div>
    <div class="pin-app-name">${APP_NAME}</div>
    <div class="pin-subtitle" id="pinSubtitle">Siapa yang masuk?</div>
    <div class="pin-datetime" id="pinDatetime"></div>
    <div class="pin-user-picker">${cards}</div>
    <button class="pin-switch" onclick="showSetupScreen()">Akun baru / Gabung keluarga</button>
  `;
  initLogo();
  updatePinDatetime();
}

// ═══ SCREEN: KEYPAD (setelah pilih user) ═══
function selectUser(username, color) {
  pinSelectedUser = { username, color };
  pinMode = 'login';
  pinBuffer = '';

  const wrap = document.getElementById('pinWrap');
  wrap.innerHTML = `
    <div class="pin-logo" id="pinLogo"></div>
    <div class="pin-user-avatar-sm" style="background:${color}20;border:2px solid ${color};margin:0 auto 6px">
      <span style="color:${color};font-size:1.1rem;font-weight:700">${username.charAt(0).toUpperCase()}</span>
    </div>
    <div class="pin-subtitle" id="pinSubtitle">Halo, <b style="color:${color}">${username}</b> 👋</div>
    <div class="pin-datetime" id="pinDatetime"></div>
    <div class="pin-dots" id="pinDots">
      <span></span><span></span><span></span><span></span><span></span><span></span>
    </div>
    <div class="pin-error" id="pinError"></div>
    <div class="pin-keypad">
      <button class="pk" onclick="pinKey('1')">1</button>
      <button class="pk" onclick="pinKey('2')">2</button>
      <button class="pk" onclick="pinKey('3')">3</button>
      <button class="pk" onclick="pinKey('4')">4</button>
      <button class="pk" onclick="pinKey('5')">5</button>
      <button class="pk" onclick="pinKey('6')">6</button>
      <button class="pk" onclick="pinKey('7')">7</button>
      <button class="pk" onclick="pinKey('8')">8</button>
      <button class="pk" onclick="pinKey('9')">9</button>
      <button class="pk pk-empty"></button>
      <button class="pk" onclick="pinKey('0')">0</button>
      <button class="pk pk-del" onclick="pinDel()">⌫</button>
    </div>
    <button class="pin-switch" onclick="showUserPicker(getHouseholdMembers())">← Ganti pengguna</button>
  `;
  initLogo();
  updatePinDatetime();
  renderPinDots();
}

// ═══ SCREEN: SETUP (register atau join) ═══
function showSetupScreen() {
  pinMode = 'setup';
  pinBuffer = '';
  const wrap = document.getElementById('pinWrap');
  const hasMembers = getHouseholdMembers().length > 0;
  wrap.innerHTML = `
    <div class="pin-logo" id="pinLogo"></div>
    <div class="pin-app-name">${APP_NAME}</div>
    <div class="pin-subtitle">Mulai perjalanan finansial bersama 🌿</div>
    <div class="pin-datetime" id="pinDatetime"></div>
    <div class="pin-setup-btns">
      <button class="pin-setup-btn pin-setup-primary" onclick="showLoginByNameScreen()">
        🔑 Sudah punya akun? Masuk
      </button>
      <button class="pin-setup-btn pin-setup-secondary" onclick="showRegisterScreen()">
        Buat Keluarga Baru
      </button>
      <button class="pin-setup-btn pin-setup-secondary" onclick="showJoinScreen()">
        Gabung Keluarga (Punya Kode)
      </button>
    </div>
    <button class="pin-switch" onclick="showUserPicker(getHouseholdMembers())" ${!hasMembers?'style="display:none"':''}>← Kembali</button>
  `;
  initLogo();
  updatePinDatetime();
}

// ═══ SCREEN: LOGIN BY NAME (device baru / browser baru) ═══
function showLoginByNameScreen() {
  pinMode = 'login-by-name';
  pinBuffer = '';
  const wrap = document.getElementById('pinWrap');
  wrap.innerHTML = `
    <div class="pin-logo" id="pinLogo"></div>
    <div class="pin-subtitle">Masuk dengan nama kamu</div>
    <div class="pin-datetime" id="pinDatetime"></div>
    <div class="pin-name-wrap">
      <input class="pin-name-input" id="pinNameInput" type="text" placeholder="Nama kamu..." maxlength="20" autocomplete="off">
    </div>
    <div class="pin-dots" id="pinDots">
      <span></span><span></span><span></span><span></span><span></span><span></span>
    </div>
    <div class="pin-sublabel">Masukkan PIN kamu</div>
    <div class="pin-error" id="pinError"></div>
    <div class="pin-keypad">
      <button class="pk" onclick="pinKey('1')">1</button>
      <button class="pk" onclick="pinKey('2')">2</button>
      <button class="pk" onclick="pinKey('3')">3</button>
      <button class="pk" onclick="pinKey('4')">4</button>
      <button class="pk" onclick="pinKey('5')">5</button>
      <button class="pk" onclick="pinKey('6')">6</button>
      <button class="pk" onclick="pinKey('7')">7</button>
      <button class="pk" onclick="pinKey('8')">8</button>
      <button class="pk" onclick="pinKey('9')">9</button>
      <button class="pk pk-empty"></button>
      <button class="pk" onclick="pinKey('0')">0</button>
      <button class="pk pk-del" onclick="pinDel()">⌫</button>
    </div>
    <button class="pin-switch" onclick="showSetupScreen()">← Kembali</button>
  `;
  initLogo();
  updatePinDatetime();
  renderPinDots();
  setTimeout(() => document.getElementById('pinNameInput')?.focus(), 100);
}

// ═══ SCREEN: REGISTER ═══
function showRegisterScreen() {
  pinMode = 'register';
  pinBuffer = '';
  const wrap = document.getElementById('pinWrap');
  wrap.innerHTML = `
    <div class="pin-logo" id="pinLogo"></div>
    <div class="pin-subtitle">Daftar akun baru</div>
    <div class="pin-datetime" id="pinDatetime"></div>
    <div class="pin-name-wrap">
      <input class="pin-name-input" id="pinNameInput" type="text" placeholder="Nama kamu..." maxlength="20" autocomplete="off">
    </div>
    <div class="pin-dots" id="pinDots">
      <span></span><span></span><span></span><span></span><span></span><span></span>
    </div>
    <div class="pin-sublabel" id="pinSubLabel">Buat PIN 6 digit</div>
    <div class="pin-error" id="pinError"></div>
    <div class="pin-keypad">
      <button class="pk" onclick="pinKey('1')">1</button>
      <button class="pk" onclick="pinKey('2')">2</button>
      <button class="pk" onclick="pinKey('3')">3</button>
      <button class="pk" onclick="pinKey('4')">4</button>
      <button class="pk" onclick="pinKey('5')">5</button>
      <button class="pk" onclick="pinKey('6')">6</button>
      <button class="pk" onclick="pinKey('7')">7</button>
      <button class="pk" onclick="pinKey('8')">8</button>
      <button class="pk" onclick="pinKey('9')">9</button>
      <button class="pk pk-empty"></button>
      <button class="pk" onclick="pinKey('0')">0</button>
      <button class="pk pk-del" onclick="pinDel()">⌫</button>
    </div>
    <button class="pin-switch" onclick="showSetupScreen()">← Kembali</button>
  `;
  initLogo();
  updatePinDatetime();
  renderPinDots();
  setTimeout(() => document.getElementById('pinNameInput')?.focus(), 100);
}

// ═══ SCREEN: JOIN ═══
function showJoinScreen() {
  pinMode = 'join';
  pinBuffer = '';
  const wrap = document.getElementById('pinWrap');
  wrap.innerHTML = `
    <div class="pin-logo" id="pinLogo"></div>
    <div class="pin-subtitle">Gabung keluarga</div>
    <div class="pin-datetime" id="pinDatetime"></div>
    <div class="pin-name-wrap">
      <input class="pin-name-input" id="pinNameInput" type="text" placeholder="Nama kamu..." maxlength="20" autocomplete="off">
    </div>
    <div class="pin-name-wrap" style="margin-top:8px">
      <input class="pin-name-input pin-code-input" id="pinCodeInput" type="text" placeholder="Kode undangan (6 huruf)..." maxlength="6" autocomplete="off" style="text-transform:uppercase;letter-spacing:0.2em;text-align:center">
    </div>
    <div class="pin-dots" id="pinDots">
      <span></span><span></span><span></span><span></span><span></span><span></span>
    </div>
    <div class="pin-sublabel">Buat PIN 6 digit</div>
    <div class="pin-error" id="pinError"></div>
    <div class="pin-keypad">
      <button class="pk" onclick="pinKey('1')">1</button>
      <button class="pk" onclick="pinKey('2')">2</button>
      <button class="pk" onclick="pinKey('3')">3</button>
      <button class="pk" onclick="pinKey('4')">4</button>
      <button class="pk" onclick="pinKey('5')">5</button>
      <button class="pk" onclick="pinKey('6')">6</button>
      <button class="pk" onclick="pinKey('7')">7</button>
      <button class="pk" onclick="pinKey('8')">8</button>
      <button class="pk" onclick="pinKey('9')">9</button>
      <button class="pk pk-empty"></button>
      <button class="pk" onclick="pinKey('0')">0</button>
      <button class="pk pk-del" onclick="pinDel()">⌫</button>
    </div>
    <button class="pin-switch" onclick="showSetupScreen()">← Kembali</button>
  `;
  initLogo();
  updatePinDatetime();
  renderPinDots();
  setTimeout(() => document.getElementById('pinNameInput')?.focus(), 100);
}

// ═══ PIN INPUT ═══
function pinKey(d) {
  if (pinBuffer.length >= 6) return;
  pinBuffer += d;
  renderPinDots();
  if (pinBuffer.length === 6) setTimeout(() => pinSubmit(), 120);
}

function pinDel() {
  if (!pinBuffer.length) return;
  pinBuffer = pinBuffer.slice(0, -1);
  renderPinDots();
  const err = document.getElementById('pinError');
  if (err) err.textContent = '';
}

function renderPinDots() {
  const dots = document.querySelectorAll('#pinDots span');
  dots.forEach((d, i) => d.classList.toggle('filled', i < pinBuffer.length));
}

function pinShakeError(msg) {
  const err = document.getElementById('pinError');
  if (err) err.textContent = msg;
  const dots = document.querySelectorAll('#pinDots span');
  dots.forEach(d => { d.classList.add('shake'); setTimeout(() => d.classList.remove('shake'), 400); });
  pinBuffer = '';
  setTimeout(() => renderPinDots(), 50);
}

// ═══ PIN SUBMIT ═══
async function pinSubmit() {
  if (pinMode === 'login') {
    try {
      const res  = await fetch(`${API_URL}/api/sheets?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: pinSelectedUser.username, pin: pinBuffer })
      });
      const json = await res.json();
      if (json.success) {
        setSession({ username: json.username, household_id: json.household_id, color: json.color });
        showPinLoadingState();
        // Refresh members dari server
        await refreshMembers(json.household_id);
        hidePinOverlay();
        updateProfileUI();
        await pullSettings();
        initRealtimeSync();
        fetchDBOptions().then(() => loadDashboard());
      } else {
        pinShakeError(json.error || 'PIN salah');
      }
    } catch(e) {
      pinShakeError('Gagal terhubung ke server');
    }
  }

  else if (pinMode === 'login-by-name') {
    const name = document.getElementById('pinNameInput')?.value.trim();
    if (!name) { pinShakeError('Isi nama dulu'); pinBuffer=''; renderPinDots(); return; }
    try {
      const res  = await fetch(`${API_URL}/api/sheets?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, pin: pinBuffer })
      });
      const json = await res.json();
      if (json.success) {
        setSession({ username: json.username, household_id: json.household_id, color: json.color });
        showPinLoadingState();
        await refreshMembers(json.household_id);
        hidePinOverlay();
        updateProfileUI();
        await pullSettings();
        initRealtimeSync();
        fetchDBOptions().then(() => loadDashboard());
        toast(`Selamat datang, ${json.username}! 👋`, 'ok');
      } else {
        pinShakeError(json.error || 'Nama atau PIN salah');
      }
    } catch(e) {
      pinShakeError('Gagal terhubung ke server');
    }
  }

  else if (pinMode === 'register') {
    pinRegisterPin = pinBuffer;
    pinBuffer = '';
    pinMode = 'confirm';
    renderPinDots();
    const lbl = document.getElementById('pinSubLabel');
    if (lbl) lbl.textContent = 'Konfirmasi PIN kamu';
    const err = document.getElementById('pinError');
    if (err) err.textContent = '';
  }

  else if (pinMode === 'confirm') {
    if (pinBuffer !== pinRegisterPin) {
      pinShakeError('PIN tidak cocok, coba lagi');
      pinMode = 'register';
      pinBuffer = '';
      renderPinDots();
      const lbl = document.getElementById('pinSubLabel');
      if (lbl) lbl.textContent = 'Buat PIN 6 digit';
      return;
    }
    const name = document.getElementById('pinNameInput')?.value.trim() || 'User';
    if (!name) { pinShakeError('Isi nama dulu'); pinBuffer=''; renderPinDots(); return; }
    try {
      const res  = await fetch(`${API_URL}/api/sheets?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, pin: pinRegisterPin, household_name: 'Keluarga '+name })
      });
      const json = await res.json();
      if (json.success) {
        const color = USER_COLORS.default1;
        setSession({ username: json.username, household_id: json.household_id, color });
        localStorage.setItem('shifa_members', JSON.stringify([{ username: json.username, color }]));
        // Tampilkan kode undangan
        showInviteCode(json.invite_code, json.username, json.household_id, color);
      } else {
        pinShakeError(json.error || 'Gagal mendaftar');
        pinMode = 'register';
      }
    } catch(e) {
      pinShakeError('Gagal terhubung ke server');
    }
  }

  else if (pinMode === 'join') {
    const name = document.getElementById('pinNameInput')?.value.trim();
    const code = document.getElementById('pinCodeInput')?.value.trim().toUpperCase();
    if (!name) { pinShakeError('Isi nama dulu'); pinBuffer=''; renderPinDots(); return; }
    if (!code || code.length !== 6) { pinShakeError('Isi kode undangan 6 huruf'); pinBuffer=''; renderPinDots(); return; }
    try {
      const res  = await fetch(`${API_URL}/api/sheets?action=join-household`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, pin: pinBuffer, invite_code: code })
      });
      const json = await res.json();
      if (json.success) {
        const color = USER_COLORS.default2;
        setSession({ username: json.username, household_id: json.household_id, color });
        showPinLoadingState();
        await refreshMembers(json.household_id);
        hidePinOverlay();
        updateProfileUI();
        fetchDBOptions().then(() => loadDashboard());
        toast(`Selamat datang, ${json.username}! 🎉`, 'ok');
      } else {
        pinShakeError(json.error || 'Gagal bergabung');
      }
    } catch(e) {
      pinShakeError('Gagal terhubung ke server');
    }
  }
}

// ═══ TAMPILKAN KODE UNDANGAN ═══
function showInviteCode(code, username, household_id, color) {
  const wrap = document.getElementById('pinWrap');
  wrap.innerHTML = `
    <div class="pin-logo" id="pinLogo"></div>
    <div class="pin-app-name">${APP_NAME}</div>
    <div class="pin-subtitle">Akun berhasil dibuat! 🎉</div>
    <div class="pin-invite-box">
      <div class="pin-invite-lbl">Kode undangan untuk pasangan kamu:</div>
      <div class="pin-invite-code" style="color:${color}">${code}</div>
      <div class="pin-invite-hint">Bagikan kode ini ke pasangan untuk bergabung</div>
    </div>
    <button class="pin-setup-btn pin-setup-primary" onclick="afterRegister('${username}','${household_id}','${color}')">
      Masuk ke SHIFA →
    </button>
  `;
  initLogo();
}

async function afterRegister(username, household_id, color) {
  showPinLoadingState();
  hidePinOverlay();
  updateProfileUI();
  await pullSettings();
  initRealtimeSync();
  fetchDBOptions().then(() => loadDashboard());
}

// ═══ REFRESH MEMBERS ═══
async function refreshMembers(household_id) {
  try {
    const res  = await fetch(`${API_URL}/api/sheets?action=get-members&household_id=${household_id}`);
    const json = await res.json();
    if (json.success && json.data) {
      localStorage.setItem('shifa_members', JSON.stringify(json.data));
    }
  } catch(e) { console.warn('refreshMembers gagal:', e); }
}

// ═══ PROFILE UI ═══
function updateProfileUI() {
  const session = getSession();
  if (!session) return;
  const { username, color } = session;

  // Header avatar
  const av = document.getElementById('drawerAvatar');
  if (av) {
    av.innerHTML = `<span style="color:${color};font-size:1.3rem;font-weight:700">${username.charAt(0).toUpperCase()}</span>`;
    av.style.cssText = `width:48px;height:48px;border-radius:16px;background:${color}20;border:2px solid ${color};display:flex;align-items:center;justify-content:center`;
  }

  const un = document.getElementById('drawerUsername');
  if (un) un.textContent = username;

  // Member avatars di header
  renderMemberAvatars();
}

function renderMemberAvatars() {
  const members = getHouseholdMembers();
  const el = document.getElementById('hdrMembers');
  if (!el || !members.length) return;
  el.innerHTML = members.map(m => `
    <div class="hdr-member-av" title="${m.username}" style="background:${m.color}20;border:1.5px solid ${m.color}">
      <span style="color:${m.color};font-size:0.7rem;font-weight:700">${m.username.charAt(0).toUpperCase()}</span>
    </div>
  `).join('');
}

// ═══ LOGOUT ═══
function pinLogout() {
  clearSession();
  // Jangan hapus shifa_members supaya user picker tetap muncul
  showPinOverlay();
}

// ═══ STARS & DATETIME ═══
function initPinStars() {
  const c = document.getElementById('pinStars');
  if (!c || c.children.length > 0) return;
  for (let i = 0; i < 20; i++) {
    const s = document.createElement('div');
    s.className = 'pin-star';
    s.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*2+1}px;height:${Math.random()*2+1}px;animation-duration:${Math.random()*15+10}s;animation-delay:${Math.random()*10}s;opacity:${Math.random()*0.6+0.2}`;
    c.appendChild(s);
  }
}

function updatePinDatetime() {
  const el = document.getElementById('pinDatetime');
  if (!el) return;
  const now = new Date();
  const jam = String(now.getHours()).padStart(2,'0');
  const mnt = String(now.getMinutes()).padStart(2,'0');
  el.textContent = `${HARI[now.getDay()]}, ${now.getDate()} ${MOS[now.getMonth()]} · ${jam}:${mnt}`;
}

// ═══ SETTINGS SYNC ═══
function collectSettings() {
  return {
    mm_budgets_v2:   JSON.parse(localStorage.getItem('mm_budgets_v2')  || '{}'),
    mm_custom_kats:  JSON.parse(localStorage.getItem('mm_custom_kats') || '[]'),
    mm_custom_banks: JSON.parse(localStorage.getItem('mm_custom_banks')|| '[]'),
    mm_fixed_cats:   JSON.parse(localStorage.getItem('mm_fixed_cats')  || '[]'),
    mm_periode:      JSON.parse(localStorage.getItem('mm_periode')     || '{}'),
    mm_settings:     JSON.parse(localStorage.getItem('mm_settings')    || '{}'),
    mm_t:            localStorage.getItem('mm_t') || 'cosmic',
  };
}

function applySettings(data) {
  if (!data) return;
  if (data.mm_budgets_v2)   localStorage.setItem('mm_budgets_v2',   JSON.stringify(data.mm_budgets_v2));
  if (data.mm_custom_kats)  localStorage.setItem('mm_custom_kats',  JSON.stringify(data.mm_custom_kats));
  if (data.mm_custom_banks) localStorage.setItem('mm_custom_banks', JSON.stringify(data.mm_custom_banks));
  if (data.mm_fixed_cats)   localStorage.setItem('mm_fixed_cats',   JSON.stringify(data.mm_fixed_cats));
  if (data.mm_periode)      localStorage.setItem('mm_periode',      JSON.stringify(data.mm_periode));
  if (data.mm_settings)     localStorage.setItem('mm_settings',     JSON.stringify(data.mm_settings));
  if (data.mm_t)            localStorage.setItem('mm_t',            data.mm_t);
  const s = data.mm_settings || {};
  if (s.notifEnabled !== undefined) notifEnabled = s.notifEnabled;
  if (s.alertPct)    alertPct    = s.alertPct;
  if (s.adminPassword) adminPassword = s.adminPassword;
  if (s.app_logo && typeof refreshLogoFromSettings === 'function') refreshLogoFromSettings(s.app_logo);
  if (data.mm_t) setTheme(data.mm_t, false);
}

async function pushSettings() {
  try {
    const hid = getHouseholdId();
    if (!hid) return;
    await fetch(`${API_URL}/api/sheets?action=save-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ household_id: hid, data: collectSettings() })
    });
  } catch(e) { console.warn('pushSettings gagal:', e); }
}

async function pullSettings() {
  try {
    const hid = getHouseholdId();
    if (!hid) return;
    const res  = await fetch(`${API_URL}/api/sheets?action=get-settings&household_id=${hid}`);
    if (!res.ok) return;
    const json = await res.json();
    if (json.success && json.data) applySettings(json.data);
  } catch(e) { console.warn('pullSettings gagal:', e); }
}
