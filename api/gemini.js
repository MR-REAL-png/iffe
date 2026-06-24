// ═══════════════════════════════════════════════
// api/gemini.js — Gemini Vision Proxy
// Key disimpan aman di Vercel Environment Variables:
//   GEMINI_KEY_1, GEMINI_KEY_2, GEMINI_KEY_3
// ═══════════════════════════════════════════════

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_BASE  = 'https://generativelanguage.googleapis.com/v1beta/models/';

const PROMPT = `Kamu adalah asisten pembaca struk belanja. Analisis gambar struk ini dan ekstrak informasi transaksi keuangan.

Kembalikan HANYA JSON dengan format berikut (tidak ada teks lain, tidak ada markdown):
{
  "tanggal": "YYYY-MM-DD atau kosong jika tidak ada",
  "nominal": 0,
  "kategori": "nama kategori yang sesuai (Makan, Transport, Belanja, Kesehatan, Hiburan, Utilitas, dll)",
  "jenis": "Pengeluaran atau Pemasukan",
  "metode": "Cash atau Transfer atau QRIS",
  "keterangan": "nama toko atau deskripsi singkat"
}

Jika tidak ada informasi, isi dengan string kosong atau 0 untuk nominal.`;

// Wajib: Vercel perlu config ini supaya req.body ter-parse & limit cukup untuk base64 gambar
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Fallback manual parse jika body masih string
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  const { imageBase64, mimeType = 'image/jpeg', keyIndex = 0 } = body;

  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 wajib diisi — body tidak terbaca atau kosong' });

  const keys = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
  ].filter(Boolean);

  if (!keys.length) return res.status(500).json({ error: 'API key belum dikonfigurasi di Vercel' });

  const idx = Math.min(Number(keyIndex) || 0, keys.length - 1);
  const apiKey = keys[idx];

  const url = `${GEMINI_BASE}${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: mimeType, data: imageBase64 } }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 512 }
  };

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const retryAfter = parseInt(geminiRes.headers.get('retry-after') || '0') || 60;
    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({
        error: data?.error?.message || `Gemini error ${geminiRes.status}`,
        status: geminiRes.status,
        retryAfter,
        keyIndex: idx,
        totalKeys: keys.length,
      });
    }

    // Ekstrak teks dari respons Gemini
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();

    let parsed = null;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (!parsed) {
      return res.status(422).json({ error: 'Respons AI tidak valid', raw });
    }

    return res.status(200).json({ success: true, data: parsed, keyIndex: idx });

  } catch (e) {
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
