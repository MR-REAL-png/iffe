// ============================================
// IFFE — api/gemini.js
// Vercel Edge Function: scan struk via Gemini API
// Fallback otomatis ke key berikutnya kalau kena limit/quota
// ============================================

export const config = {
  runtime: 'edge',
};

const GEMINI_MODEL = 'gemini-2.0-flash';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'Gambar tidak ditemukan' }), { status: 400 });
    }

    const apiKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ].filter(Boolean);

    if (apiKeys.length === 0) {
      return new Response(JSON.stringify({ error: 'API key belum dikonfigurasi di Vercel' }), {
        status: 500,
      });
    }

    const prompt = `Kamu adalah asisten yang membaca struk belanja, bukti transfer, atau QRIS dari Indonesia.
Ekstrak informasi berikut dari gambar dan kembalikan HANYA dalam format JSON, tanpa markdown, tanpa penjelasan tambahan:
{
  "nominal": <angka total transaksi, tanpa titik/koma, contoh: 150000>,
  "tanggal": "<tanggal transaksi format YYYY-MM-DD, gunakan tanggal hari ini jika tidak terbaca>",
  "keterangan": "<ringkasan singkat, misal nama toko atau jenis transaksi>"
}`;

    let lastError = null;

    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: mimeType || 'image/jpeg',
                        data: image,
                      },
                    },
                  ],
                },
              ],
            }),
          }
        );

        // Kena rate limit / quota habis -> coba key berikutnya
        if (response.status === 429 || response.status === 403) {
          lastError = `Key #${i + 1} kena limit (status ${response.status})`;
          continue;
        }

        if (!response.ok) {
          lastError = `Key #${i + 1} gagal (status ${response.status})`;
          continue;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return new Response(JSON.stringify({ success: true, result: parsed, usedKey: i + 1 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        lastError = `Key #${i + 1} error: ${err.message}`;
        continue;
      }
    }

    return new Response(
      JSON.stringify({ error: 'Semua API key gagal atau kena limit', detail: lastError }),
      { status: 502 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
