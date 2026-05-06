// ============================================================
// GANTI NILAI DI BAWAH INI DENGAN CONFIG FIREBASE ANDA
// Cara mendapatkan: Firebase Console → Project Settings → Your Apps
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBbMwxtnpoSiB4xHdavXxaL53GZLBKcuSc",
  authDomain: "wrh-goc-eb6b1.firebaseapp.com",
  projectId: "wrh-goc-eb6b1",
  storageBucket: "wrh-goc-eb6b1.firebasestorage.app",
  messagingSenderId: "690803704567",
  appId: "1:690803704567:web:ee2624ac378eabe24ac9f2",
  measurementId: "G-XVB586PK1C"
};

// Import Firebase (via CDN, sudah di-load di HTML)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================================================
// PASSWORD LOGIN PER DIVISI — bisa diubah sesuka hati
// ============================================================
const DIVISI_CREDENTIALS = {
  FGWH:  { password: "BEAUTY60",  label: "FGWH" },
  RMWH:  { password: "BEAUTY60",  label: "RMWH" },
  PMWH:  { password: "BEAUTY60",  label: "PMWH" },
  ADMIN: { password: "BEAUTY125", label: "ADMIN" }
};
