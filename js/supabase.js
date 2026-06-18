// ============================================
// IFFE — Supabase Connection & Helpers
// Import via CDN, tanpa build step
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Project Supabase IFFE (anon key aman untuk dipakai di frontend,
// proteksi data tetap via RLS)
const SUPABASE_URL = 'https://sqknfsorqtityalgherc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxa25mc29ycXRpdHlhbGdoZXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTgyMDQsImV4cCI6MjA5NzI3NDIwNH0.hE9VCHIc53v5RPCd4eXaEEoYnxJqszA-ph7IaIZDgjo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Session Helper (login pilih nama, tanpa password) =====
const SESSION_KEY = 'iffe_session';

export function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Panggil di awal tiap halaman (selain index.html) untuk cek login
export function requireSession(redirectTo = 'index.html') {
  const user = getSession();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

export function isAdmin() {
  const user = getSession();
  return user?.role === 'admin';
}

// ===== Generic CRUD Helpers =====
// Dipakai di semua [page].js biar query Supabase konsisten

export async function fetchAll(table, options = {}) {
  let query = supabase.from(table).select(options.select || '*');

  if (options.eq) {
    for (const [col, val] of Object.entries(options.eq)) {
      query = query.eq(col, val);
    }
  }
  if (options.order) {
    query = query.order(options.order.column, {
      ascending: options.order.ascending ?? false,
    });
  }

  const { data, error } = await query;
  if (error) {
    console.error(`fetchAll(${table}) error:`, error.message);
    return [];
  }
  return data;
}

export async function insertRow(table, row) {
  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error(`insertRow(${table}) error:`, error.message);
    return null;
  }
  return data;
}

export async function updateRow(table, id, updates) {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`updateRow(${table}) error:`, error.message);
    return null;
  }
  return data;
}

export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error(`deleteRow(${table}) error:`, error.message);
    return false;
  }
  return true;
}
