// api/parse-image.js — SHIF Vercel Serverless
// Menerima: { imageBase64, mimeType, categories[], banks[] }
// Mengembalikan: { tanggal, jenis, kategori, nominal, metode, bank, keterangan }
//
// Strategy: 3 API keys (GEMINI_API_KEY_1/2/3) dirotasi secara berurutan.
// Jika satu key kena rate-limit (429) atau error server (5xx), tunggu jeda
// lalu coba key berikutnya. Jeda makin lama setiap kali gagal (exponential backoff).

const GEMINI_MODEL    = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

const RETRY_DELAYS = [1500, 3000];

const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getApiKeys() {
  const keys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean);

  // Fallback nama lama
  if (!keys.length && process.env.GEMINI_KEY_1) keys.push(process.env.GEMINI_KEY_1);
  if (!keys.length && process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  return keys;
}

async function callGemini(apiKey, payload) {
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status   = res.status;
    err.isLimit  = res.status === 429;
    err.isServer = res.status >= 500;
    throw err;
  }

  return data;
}

function extractJSON(rawText) {
  // 1. Strip markdown fences
  let clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // 2. Coba parse langsung
  try { return JSON.parse(clean); } catch {}

  // 3. Cari { ... } pertama yang valid
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }

  // 4. Handle JSON terpotong
  const start = clean.indexOf('{');
  if (start >= 0) {
    let partial = clean.slice(start);
    const lines = partial.split('\n');
    while (lines.length > 1) {
      const last = lines[lines.length - 1].trim();
      if (last.endsWith(',') || last.endsWith('}') || last === '') break;
      lines.pop();
    }
    partial = lines.join('\n').trim();
    if (!partial.endsWith('}')) partial += '\n}';
    try { return JSON.parse(partial); } catch {}
  }

  return null;
}

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  // Fallback manual parse body
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  const keys = getApiKeys();
  if (!keys.length) {
    return res.status(500).json({ error: 'Tidak ada GEMINI_API_KEY yang dikonfigurasi di Vercel' });
  }

  const { imageBase64, mimeType, categories = [], banks = [] } = body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 diperlukan' });

  // ── Build prompt ──
  const today = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const prompt = `Kamu adalah asisten keuangan. Analisis gambar struk/nota/bukti transaksi ini dan ekstrak informasi berikut.

Kategori yang tersedia: ${categories.length ? categories.join(', ') : 'Makanan, Transport, Belanja, Hiburan, Kesehatan, Pendidikan, Tagihan, Lainnya'}
Rekening yang tersedia: ${banks.length ? banks.join(', ') : '-'}
Tanggal hari ini: ${today}

Balas HANYA dengan JSON valid (tanpa markdown, tanpa preamble), format persis:
{
  "tanggal": "YYYY-MM-DD",
  "jenis": "Pemasukan" atau "Pengeluaran",
  "kategori": "nama kategori paling sesuai dari daftar di atas",
  "nominal": angka tanpa titik/koma (contoh: 50000),
  "metode": "Cash" atau "Transfer" atau "QRIS",
  "bank": "nama bank/rekening jika terlihat, atau string kosong",
  "keterangan": "deskripsi singkat transaksi max 40 karakter"
}

Aturan:
- Jika tanggal tidak ada, gunakan tanggal hari ini
- Format tanggal: YYYY-MM-DD
- Jenis default: "Pengeluaran"
- Nominal: angka murni tanpa titik/koma pemisah ribuan
- Jika gambar tidak jelas, tetap kembalikan JSON dengan tebakan terbaik`;

  const payload = {
    contents: [{
      parts: [
        { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  };

  // ── Retry loop ──
  let lastError = null;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_DELAYS[attempt - 1] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
      console.log(`[parse-image] Menunggu ${delay}ms sebelum coba key ke-${attempt + 1}...`);
      await sleep(delay);
    }

    const key = keys[attempt];
    const keyLabel = `KEY_${attempt + 1}`;

    try {
      console.log(`[parse-image] Mencoba ${keyLabel}...`);
      const geminiData = await callGemini(key, payload);

      const parts = geminiData?.candidates?.[0]?.content?.parts || [];
      const rawText = parts.map(p => p.text || '').join('');

      console.log(`[parse-image] ${keyLabel} raw (first 300):`, rawText.substring(0, 300));

      const parsed = extractJSON(rawText);

      if (!parsed) {
        console.error(`[parse-image] ${keyLabel} tidak bisa parse JSON. Raw:`, rawText);
        return res.status(422).json({
          error: 'AI tidak bisa mengekstrak data. Coba foto lebih jelas atau dari sudut berbeda.',
        });
      }

      // Sanitize nominal
      parsed.nominal = parseInt(String(parsed.nominal ?? '0').replace(/[^0-9]/g, ''), 10) || 0;

      console.log(`[parse-image] Berhasil dengan ${keyLabel}:`, JSON.stringify(parsed));
      return res.status(200).json(parsed);

    } catch (err) {
      lastError = err;
      console.warn(`[parse-image] ${keyLabel} gagal: ${err.message} (status ${err.status})`);

      const shouldRetry = err.isLimit || err.isServer;
      if (!shouldRetry) break;
    }
  }

  const isRateLimit = lastError?.isLimit;
  console.error('[parse-image] Semua key gagal. Last error:', lastError?.message);
  return res.status(isRateLimit ? 429 : 502).json({
    error: isRateLimit
      ? 'Semua API key sedang rate-limited. Coba lagi dalam beberapa detik.'
      : (lastError?.message || 'Gagal menghubungi Gemini AI'),
  });
}

module.exports = handler;
module.exports.config = config;
