// ═══════════════════════════════════════════════════
// API PROXY — GEMINI VISION (SCAN STRUK)
// API key disimpan di Environment Variables Vercel,
// TIDAK PERNAH dikirim/diekspos ke browser.
//
// Setup di Vercel Dashboard → Project → Settings → Environment Variables:
//   GEMINI_KEY_1 = <api key gemini #1>
//   GEMINI_KEY_2 = <api key gemini #2>   (opsional)
//   GEMINI_KEY_3 = <api key gemini #3>   (opsional)
// ═══════════════════════════════════════════════════

const GEMINI_KEYS = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
].filter(Boolean); // buang yang kosong/belum di-set

const GEMINI_MODEL    = 'gemini-1.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

const PROMPT = `Kamu adalah asisten pembaca struk belanja. Analisis gambar struk ini dan ekstrak informasi transaksi keuangan.

Kembalikan HANYA JSON dengan format berikut (tidak ada teks lain):
{
  "tanggal": "YYYY-MM-DD atau kosong jika tidak ada",
  "nominal": 0,
  "kategori": "nama kategori yang sesuai (Makan, Transport, Belanja, Kesehatan, Hiburan, Utilitas, dll)",
  "jenis": "Pengeluaran atau Pemasukan",
  "metode": "Cash atau Transfer atau QRIS",
  "keterangan": "nama toko atau deskripsi singkat"
}

Jika tidak ada informasi, isi dengan string kosong atau 0 untuk nominal.`;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

async function callGeminiVision(apiKey, base64Data, mimeType) {
  const url = `${GEMINI_API_BASE}${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: mimeType, data: base64Data } }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 512 }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    const err = new Error(errJson?.error?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.retryAfter = parseInt(res.headers.get('retry-after') || '0') || 60;
    throw err;
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const clean = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    const err = new Error('Respons AI tidak valid');
    err.status = 502;
    throw err;
  }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method tidak diizinkan' });
  }
  if (!GEMINI_KEYS.length) {
    return res.status(500).json({ success: false, error: 'GEMINI_KEY belum di-set di Environment Variables Vercel' });
  }

  const { base64, mimeType } = req.body || {};
  if (!base64) {
    return res.status(400).json({ success: false, status: 400, error: 'Gambar tidak ditemukan' });
  }

  let lastErr = null;
  for (let ki = 0; ki < GEMINI_KEYS.length; ki++) {
    try {
      const data = await callGeminiVision(GEMINI_KEYS[ki], base64, mimeType || 'image/jpeg');
      return res.json({ success: true, data, keyUsed: ki + 1 });
    } catch (e) {
      lastErr = e;
      // 429 (rate limit/quota) → tetap coba key berikutnya, sama seperti versi client-side dulu
      // Error lain → juga lanjut coba key berikutnya sebagai fallback
      console.warn(`Gemini key ${ki + 1} gagal:`, e.message);
    }
  }

  // Semua key gagal
  const status = lastErr?.status || 500;
  return res.status(status).json({
    success: false,
    status,
    error: lastErr?.message || 'Semua API key gagal',
    retryAfter: lastErr?.retryAfter || 60
  });
}
