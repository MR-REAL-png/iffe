const SUPABASE_URL = 'https://sqknfsorqtityalgherc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'apikey': SUPABASE_KEY,
  'Prefer': 'return=representation'
};

async function sb(path, method = 'GET', body = null) {
  const opts = { method, headers: { ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, opts);
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;

  try {

    // ═══════════════════════════════════════
    // AUTH — REGISTER (buat household baru)
    // ═══════════════════════════════════════
    if (action === 'register' && req.method === 'POST') {
      const { username, pin, household_name } = req.body;
      if (!username || !pin) return res.json({ success: false, error: 'Username dan PIN wajib diisi' });

      // Buat invite code unik
      let invite_code, codeExists = true;
      while (codeExists) {
        invite_code = generateInviteCode();
        const check = await sb(`/households?invite_code=eq.${invite_code}`);
        codeExists = check.data?.length > 0;
      }

      // Buat household
      const hh = await sb('/households', 'POST', {
        name: household_name || 'Keluarga',
        invite_code
      });
      if (!hh.ok) return res.json({ success: false, error: 'Gagal buat household' });
      const household_id = hh.data[0].id;

      // Buat user
      const usr = await sb('/users', 'POST', {
        username,
        pin,
        household_id,
        color: '#a78bfa'
      });
      if (!usr.ok) return res.json({ success: false, error: 'Gagal buat user' });

      return res.json({
        success: true,
        username,
        household_id,
        invite_code
      });
    }

    // ═══════════════════════════════════════
    // AUTH — JOIN (gabung household via kode)
    // ═══════════════════════════════════════
    if (action === 'join-household' && req.method === 'POST') {
      const { username, pin, invite_code } = req.body;
      if (!username || !pin || !invite_code) return res.json({ success: false, error: 'Data tidak lengkap' });

      // Cari household
      const hh = await sb(`/households?invite_code=eq.${invite_code.toUpperCase()}`);
      if (!hh.ok || !hh.data?.length) return res.json({ success: false, error: 'Kode undangan tidak ditemukan' });
      const household_id = hh.data[0].id;

      // Cek jumlah member (max 2)
      const members = await sb(`/users?household_id=eq.${household_id}`);
      if (members.data?.length >= 2) return res.json({ success: false, error: 'Household sudah penuh (maks 2 orang)' });

      // Cek username tidak duplikat di household ini
      const dupCheck = await sb(`/users?household_id=eq.${household_id}&username=eq.${encodeURIComponent(username)}`);
      if (dupCheck.data?.length > 0) return res.json({ success: false, error: 'Nama sudah dipakai di household ini' });

      // Buat user kedua
      const colors = ['#f472b6', '#60a5fa', '#34d399', '#fb923c'];
      const color = colors[members.data?.length % colors.length] || '#f472b6';
      const usr = await sb('/users', 'POST', { username, pin, household_id, color });
      if (!usr.ok) return res.json({ success: false, error: 'Gagal bergabung' });

      return res.json({ success: true, username, household_id });
    }

    // ═══════════════════════════════════════
    // AUTH — LOGIN
    // ═══════════════════════════════════════
    if (action === 'login' && req.method === 'POST') {
      const { username, pin } = req.body;
      if (!username || !pin) return res.json({ success: false, error: 'Data tidak lengkap' });

      const result = await sb(`/users?username=eq.${encodeURIComponent(username)}&pin=eq.${encodeURIComponent(pin)}&select=*`);
      if (!result.ok || !result.data?.length) return res.json({ success: false, error: 'Nama atau PIN salah' });

      const user = result.data[0];
      return res.json({
        success: true,
        username: user.username,
        household_id: user.household_id,
        color: user.color
      });
    }

    // ═══════════════════════════════════════
    // AUTH — GET MEMBERS (daftar anggota household)
    // ═══════════════════════════════════════
    if (action === 'get-members' && req.method === 'GET') {
      const { household_id } = req.query;
      if (!household_id) return res.json({ success: false, error: 'household_id wajib' });

      const result = await sb(`/users?household_id=eq.${household_id}&select=username,color,created_at`);
      return res.json({ success: true, data: result.data || [] });
    }

    // ═══════════════════════════════════════
    // TRANSAKSI — GET
    // ═══════════════════════════════════════
    if (action === 'get' && req.method === 'GET') {
      const { household_id } = req.query;
      if (!household_id) return res.json({ success: false, error: 'household_id wajib' });

      const result = await sb(`/transaksi?household_id=eq.${household_id}&order=tanggal.desc,id.desc`);
      if (!result.ok) return res.json({ success: false, error: 'Gagal ambil data' });

      return res.json({ success: true, data: result.data || [] });
    }

    // ═══════════════════════════════════════
    // TRANSAKSI — APPEND
    // ═══════════════════════════════════════
    if (action === 'append' && req.method === 'POST') {
      const { household_id, recorded_by, tanggal, bulan, kategori, nominal, pembayaran, detail, metode, jenis } = req.body;
      if (!household_id) return res.json({ success: false, error: 'household_id wajib' });

      const result = await sb('/transaksi', 'POST', {
        household_id, recorded_by: recorded_by || '',
        tanggal, bulan, kategori,
        nominal: Number(nominal) || 0,
        pembayaran, detail, metode, jenis
      });
      if (!result.ok) return res.json({ success: false, error: 'Gagal simpan transaksi' });

      return res.json({ success: true, data: result.data?.[0] });
    }

    // ═══════════════════════════════════════
    // TRANSAKSI — UPDATE
    // ═══════════════════════════════════════
    if (action === 'update' && req.method === 'PUT') {
      const { id, household_id, ...fields } = req.body;
      if (!id || !household_id) return res.json({ success: false, error: 'id dan household_id wajib' });

      const result = await sb(`/transaksi?id=eq.${id}&household_id=eq.${household_id}`, 'PATCH', fields);
      if (!result.ok) return res.json({ success: false, error: 'Gagal update transaksi' });

      return res.json({ success: true });
    }

    // ═══════════════════════════════════════
    // TRANSAKSI — DELETE
    // ═══════════════════════════════════════
    if (action === 'delete' && req.method === 'DELETE') {
      const { id, household_id } = req.query;
      if (!id || !household_id) return res.json({ success: false, error: 'id dan household_id wajib' });

      const result = await sb(`/transaksi?id=eq.${id}&household_id=eq.${household_id}`, 'DELETE');
      if (!result.ok) return res.json({ success: false, error: 'Gagal hapus transaksi' });

      return res.json({ success: true });
    }

    // ═══════════════════════════════════════
    // SETTINGS — GET
    // ═══════════════════════════════════════
    if (action === 'get-settings' && req.method === 'GET') {
      const { household_id } = req.query;
      if (!household_id) return res.json({ success: false, error: 'household_id wajib' });

      const result = await sb(`/settings?household_id=eq.${household_id}`);
      if (!result.ok || !result.data?.length) return res.json({ success: true, data: null });

      return res.json({ success: true, data: result.data[0].data, updated_at: result.data[0].updated_at });
    }

    // ═══════════════════════════════════════
    // SETTINGS — SAVE (upsert)
    // ═══════════════════════════════════════
    if (action === 'save-settings' && req.method === 'POST') {
      const { household_id, data } = req.body;
      if (!household_id) return res.json({ success: false, error: 'household_id wajib' });

      // Cek apakah sudah ada
      const existing = await sb(`/settings?household_id=eq.${household_id}`);
      let result;
      if (existing.data?.length > 0) {
        result = await sb(`/settings?household_id=eq.${household_id}`, 'PATCH', {
          data,
          updated_at: new Date().toISOString()
        });
      } else {
        result = await sb('/settings', 'POST', {
          household_id,
          data,
          updated_at: new Date().toISOString()
        });
      }
      if (!result.ok) return res.json({ success: false, error: 'Gagal simpan settings' });

      return res.json({ success: true });
    }

    // ═══════════════════════════════════════
    // TABUNGAN — GET
    // ═══════════════════════════════════════
    if (action === 'get-tabungan' && req.method === 'GET') {
      const { household_id } = req.query;
      if (!household_id) return res.json({ success: false, error: 'household_id wajib' });

      const result = await sb(`/tabungan?household_id=eq.${household_id}&order=created_at.desc`);
      return res.json({ success: true, data: result.data || [] });
    }

    // ═══════════════════════════════════════
    // TABUNGAN — APPEND
    // ═══════════════════════════════════════
    if (action === 'append-tabungan' && req.method === 'POST') {
      const { household_id, nama, target, terkumpul } = req.body;
      const result = await sb('/tabungan', 'POST', {
        household_id, nama,
        target: Number(target) || 0,
        terkumpul: Number(terkumpul) || 0
      });
      if (!result.ok) return res.json({ success: false, error: 'Gagal simpan tabungan' });
      return res.json({ success: true, data: result.data?.[0] });
    }

    // ═══════════════════════════════════════
    // TABUNGAN — UPDATE
    // ═══════════════════════════════════════
    if (action === 'update-tabungan' && req.method === 'PUT') {
      const { id, household_id, ...fields } = req.body;
      const result = await sb(`/tabungan?id=eq.${id}&household_id=eq.${household_id}`, 'PATCH', fields);
      if (!result.ok) return res.json({ success: false, error: 'Gagal update tabungan' });
      return res.json({ success: true });
    }

    // ═══════════════════════════════════════
    // TABUNGAN — DELETE
    // ═══════════════════════════════════════
    if (action === 'delete-tabungan' && req.method === 'DELETE') {
      const { id, household_id } = req.query;
      const result = await sb(`/tabungan?id=eq.${id}&household_id=eq.${household_id}`, 'DELETE');
      if (!result.ok) return res.json({ success: false, error: 'Gagal hapus tabungan' });
      return res.json({ success: true });
    }

    // ═══════════════════════════════════════
    // PIUTANG — GET
    // ═══════════════════════════════════════
    if (action === 'get-piutang' && req.method === 'GET') {
      const { household_id } = req.query;
      const result = await sb(`/piutang?household_id=eq.${household_id}&order=tanggal.desc`);
      return res.json({ success: true, data: result.data || [] });
    }

    // ═══════════════════════════════════════
    // PIUTANG — APPEND
    // ═══════════════════════════════════════
    if (action === 'append-piutang' && req.method === 'POST') {
      const { household_id, nama, nominal, tanggal, catatan } = req.body;
      const result = await sb('/piutang', 'POST', {
        household_id, nama,
        nominal: Number(nominal) || 0,
        tanggal, catatan, lunas: false
      });
      if (!result.ok) return res.json({ success: false, error: 'Gagal simpan piutang' });
      return res.json({ success: true, data: result.data?.[0] });
    }

    // ═══════════════════════════════════════
    // PIUTANG — UPDATE (termasuk tandai lunas)
    // ═══════════════════════════════════════
    if (action === 'update-piutang' && req.method === 'PUT') {
      const { id, household_id, ...fields } = req.body;
      const result = await sb(`/piutang?id=eq.${id}&household_id=eq.${household_id}`, 'PATCH', fields);
      if (!result.ok) return res.json({ success: false, error: 'Gagal update piutang' });
      return res.json({ success: true });
    }

    // ═══════════════════════════════════════
    // PIUTANG — DELETE
    // ═══════════════════════════════════════
    if (action === 'delete-piutang' && req.method === 'DELETE') {
      const { id, household_id } = req.query;
      const result = await sb(`/piutang?id=eq.${id}&household_id=eq.${household_id}`, 'DELETE');
      if (!result.ok) return res.json({ success: false, error: 'Gagal hapus piutang' });
      return res.json({ success: true });
    }

    // ═══════════════════════════════════════
    // TRANSFERS — GET
    // ═══════════════════════════════════════
    if (action === 'get-transfers' && req.method === 'GET') {
      const { household_id } = req.query;
      if (!household_id) return res.json({ success: false, error: 'household_id wajib' });
      const result = await sb(`/transfers?household_id=eq.${household_id}&order=tanggal.desc`);
      return res.json({ success: true, data: result.data || [] });
    }

    // ═══════════════════════════════════════
    // TRANSFERS — APPEND
    // ═══════════════════════════════════════
    if (action === 'append-transfer' && req.method === 'POST') {
      const { household_id, dari, ke, nominal, catatan, tanggal } = req.body;
      if (!household_id || !dari || !ke) return res.json({ success: false, error: 'Data tidak lengkap' });
      const result = await sb('/transfers', 'POST', {
        household_id, dari, ke,
        nominal: Number(nominal) || 0,
        catatan: catatan || '',
        tanggal: tanggal || new Date().toISOString().slice(0,10)
      });
      if (!result.ok) return res.json({ success: false, error: 'Gagal simpan transfer' });
      return res.json({ success: true, data: result.data?.[0] });
    }

    // ═══════════════════════════════════════
    // TRANSFERS — UPDATE
    // ═══════════════════════════════════════
    if (action === 'update-transfer' && req.method === 'PUT') {
      const { id, household_id, ...fields } = req.body;
      if (!id || !household_id) return res.json({ success: false, error: 'id dan household_id wajib' });
      const result = await sb(`/transfers?id=eq.${id}&household_id=eq.${household_id}`, 'PATCH', fields);
      if (!result.ok) return res.json({ success: false, error: 'Gagal update transfer' });
      return res.json({ success: true });
    }

    // ═══════════════════════════════════════
    // TRANSFERS — DELETE
    // ═══════════════════════════════════════
    if (action === 'delete-transfer' && req.method === 'DELETE') {
      const { id, household_id } = req.query;
      if (!id || !household_id) return res.json({ success: false, error: 'id dan household_id wajib' });
      const result = await sb(`/transfers?id=eq.${id}&household_id=eq.${household_id}`, 'DELETE');
      if (!result.ok) return res.json({ success: false, error: 'Gagal hapus transfer' });
      return res.json({ success: true });
    }

    return res.status(400).json({ success: false, error: `Action tidak dikenal: ${action}` });

  } catch (e) {
    console.error('API Error:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
}
