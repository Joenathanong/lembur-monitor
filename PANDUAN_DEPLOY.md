# 📋 PANDUAN DEPLOY — LemburMonitor v2.0
# Vercel + Firebase Firestore
# ============================================================

## LANGKAH 1 — Buat Project Firebase

1. Buka https://console.firebase.google.com
2. Klik **"Add project"** → beri nama, misal: `lembur-monitor`
3. Matikan Google Analytics (tidak perlu) → klik **Continue**
4. Tunggu project dibuat → klik **Continue**

### 1a. Aktifkan Firestore
1. Di sidebar kiri → **Build** → **Firestore Database**
2. Klik **"Create database"**
3. Pilih **"Start in test mode"** → Next
4. Pilih region: `asia-southeast1 (Singapore)` → **Enable**

### 1b. Ambil Firebase Config
1. Di sidebar kiri → ⚙️ **Project Settings** (ikon gear)
2. Scroll ke bawah → bagian **"Your apps"**
3. Klik ikon **`</>`** (Web)
4. Register app: isi nama `lembur-monitor-web` → **Register app**
5. Copy kode config yang muncul, contoh:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "lembur-monitor.firebaseapp.com",
     projectId: "lembur-monitor",
     storageBucket: "lembur-monitor.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123:web:abc123"
   };
   ```
6. Klik **Continue to console**

---

## LANGKAH 2 — Edit File Config

Buka file: `js/firebase-config.js`

Ganti bagian ini dengan config Firebase Anda:
```js
const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY_ANDA",        // ← ganti
  authDomain: "GANTI...",                       // ← ganti
  projectId: "GANTI...",                        // ← ganti
  storageBucket: "GANTI...",                    // ← ganti
  messagingSenderId: "GANTI...",                // ← ganti
  appId: "GANTI..."                             // ← ganti
};
```

Opsional — ganti password default divisi:
```js
const DIVISI_CREDENTIALS = {
  FGWH:  { password: "BEAUTY60", label: "FGWH" },
  RMWH:  { password: "BEAUTY60", label: "RMWH" },
  PMWH:  { password: "BEAUTY60", label: "PMWH" },
  ADMIN: { password: "BEAUTY125",    label: "Admin" }
};
```

---

## LANGKAH 3 — Upload ke GitHub

1. Buat akun di https://github.com (jika belum punya)
2. Klik **"New repository"** → nama: `lembur-monitor` → **Create repository**
3. Upload semua file:
   - Cara mudah: klik **"uploading an existing file"** di halaman repo
   - Drag & drop seluruh folder `lembur-monitor/`
   - Klik **"Commit changes"**

Struktur yang harus ada di GitHub:
```
lembur-monitor/
├── index.html
├── dashboard.html
├── vercel.json
├── firestore.rules
├── css/
│   └── style.css
└── js/
    ├── firebase-config.js  ← sudah diisi config Firebase
    ├── auth.js
    ├── utils.js
    ├── umr.js
    ├── karyawan.js
    ├── lembur.js
    ├── rekap.js
    └── dashboard.js
```

---

## LANGKAH 4 — Deploy ke Vercel

1. Buka https://vercel.com → **Sign up with GitHub**
2. Klik **"New Project"**
3. Import repository `lembur-monitor` dari GitHub
4. Semua setting biarkan default → klik **"Deploy"**
5. Tunggu ~1 menit → selesai!
6. Vercel akan memberi URL seperti: `https://lembur-monitor-xxxx.vercel.app`

---

## LANGKAH 5 — Input UMR Awal

1. Buka URL Vercel Anda
2. Login dengan divisi **ADMIN** → password `admin2025`
3. Klik menu **Pengaturan**
4. Isi UMR Kab. Bogor terkini dan tanggal berlaku → **Simpan**

---

## LANGKAH 6 — Bagikan ke Tim

Kirim ke masing-masing tim:
- **URL**: `https://lembur-monitor-xxxx.vercel.app`
- **FGWH** → password: `fgwh2025`
- **RMWH** → password: `rmwh2025`
- **PMWH** → password: `pmwh2025`

---

## TIPS KEAMANAN

1. Segera ganti password default setelah deploy
2. Jangan bagikan password ADMIN ke semua orang
3. Untuk security lebih ketat, update `firestore.rules` sesuai komentar di file tersebut

## TROUBLESHOOTING

| Masalah | Solusi |
|---------|--------|
| Data tidak tersimpan | Cek config Firebase di `js/firebase-config.js` |
| Error CORS | Pastikan Firestore rules = test mode |
| Halaman blank | Buka Console browser (F12) → lihat pesan error |
| Tidak bisa login | Cek password di `js/firebase-config.js` |

---

Butuh bantuan? Tanyakan ke Claude di claude.ai 🙂
