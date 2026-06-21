# KAS BERSAMA — Backend API
  
## Setup Vercel Environment Variable
   
Di Vercel Dashboard → Project → Settings → Environment Variables, tambahkan:

| Key | Value |
|-----|-------|
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxa25mc29ycXRpdHlhbGdoZXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY5ODIwNCwiZXhwIjoyMDk3Mjc0MjA0fQ.u339swL19iN9qTugB9Lz2LCcW8KBTuKS1aDK8Sq6eVs` |

## Struktur File

```
/
├── api/
│   └── sheets.js     ← API utama (semua endpoint)
├── vercel.json       ← Routing & config
└── README.md
```

## Endpoints

| Action | Method | Keterangan |
|--------|--------|------------|
| `register` | POST | Daftar user baru + buat household |
| `join-household` | POST | Gabung household via kode undangan |
| `login` | POST | Login dengan username + PIN |
| `get-members` | GET | Daftar anggota household |
| `get` | GET | Ambil semua transaksi household |
| `append` | POST | Tambah transaksi |
| `update` | PUT | Edit transaksi |
| `delete` | DELETE | Hapus transaksi |
| `get-settings` | GET | Ambil settings household |
| `save-settings` | POST | Simpan settings household |
| `get-tabungan` | GET | Daftar tabungan |
| `append-tabungan` | POST | Tambah tabungan |
| `update-tabungan` | PUT | Update tabungan |
| `delete-tabungan` | DELETE | Hapus tabungan |
| `get-piutang` | GET | Daftar piutang |
| `append-piutang` | POST | Tambah piutang |
| `update-piutang` | PUT | Update/tandai lunas piutang |
| `delete-piutang` | DELETE | Hapus piutang |
