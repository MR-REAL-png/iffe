// ============================================
// IFFE — auth.js
// Login pilih nama (tanpa password), session, role check
// ============================================

import { supabase, setSession, getSession } from './supabase.js';

const userListEl = document.getElementById('userList');
const errorEl = document.getElementById('loginError');

async function init() {
  // Kalau session masih aktif, langsung ke home
  const existing = getSession();
  if (existing) {
    window.location.href = 'home.html';
    return;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('nama', { ascending: true });

  if (error || !data || data.length === 0) {
    errorEl.hidden = false;
    errorEl.textContent = error
      ? `Error: ${error.message}`
      : 'Data kosong (cek tabel users di Supabase).';
    console.error('Gagal load users:', error);
    return;
  }

  renderUserList(data);
}

function renderUserList(users) {
  userListEl.innerHTML = '';

  users.forEach((user) => {
    const btn = document.createElement('button');
    btn.className = 'login-user-btn';
    btn.innerHTML = `
      <span class="login-user-avatar">${user.nama.charAt(0).toUpperCase()}</span>
      <span>${user.nama}</span>
    `;
    btn.addEventListener('click', () => handleLogin(user));
    userListEl.appendChild(btn);
  });
}

function handleLogin(user) {
  setSession(user);

  // Terapkan tema sesuai preferensi user yang login
  document.documentElement.setAttribute('data-theme', user.tema || 'light');

  window.location.href = 'home.html';
}

init();
