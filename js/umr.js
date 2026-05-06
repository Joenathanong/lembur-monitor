// ============================================================
// UMR MODULE
// ============================================================

const UMR_COLLECTION = 'umr';

async function getUMRList() {
  const snap = await db.collection(UMR_COLLECTION).orderBy('tgl', 'desc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getUMRForDate(tgl) {
  // Ambil UMR yang berlaku pada tanggal tertentu (UMR terbaru yang <= tgl)
  const snap = await db.collection(UMR_COLLECTION)
    .where('tgl', '<=', tgl)
    .orderBy('tgl', 'desc')
    .limit(1)
    .get();
  if (!snap.empty) return snap.docs[0].data();
  // fallback: ambil yang paling lama
  const fallback = await db.collection(UMR_COLLECTION).orderBy('tgl', 'asc').limit(1).get();
  return fallback.empty ? { umr: 4906448, tgl: '2024-01-01' } : fallback.docs[0].data();
}

async function saveUMR(umrVal, tgl) {
  await db.collection(UMR_COLLECTION).add({ umr: umrVal, tgl, createdAt: new Date().toISOString() });
}

async function deleteUMR(id) {
  await db.collection(UMR_COLLECTION).doc(id).delete();
}

async function calcUpahLembur(jam, tgl) {
  const umrData = await getUMRForDate(tgl);
  const upahPerJam = umrData.umr / 21 / 8;
  return {
    upah: jam * upahPerJam,
    umrVal: umrData.umr,
    umrTgl: umrData.tgl,
    upahPerJam
  };
}

// ---- UI ----
async function renderUMRPage() {
  const list = await getUMRList();
  const today = getToday();
  const aktif = await getUMRForDate(today);

  document.getElementById('umr-aktif-info').innerHTML =
    `UMR aktif: <strong>${fmtRp(aktif.umr)}</strong> (berlaku ${fmtTgl(aktif.tgl)}) — 
     Upah/jam: <strong>${fmtRp(aktif.umr / 21 / 8)}</strong>`;

  const histEl = document.getElementById('umr-history');
  if (!list.length) { histEl.innerHTML = '<div class="empty">Belum ada data UMR</div>'; return; }

  histEl.innerHTML = list.map(u => `
    <div class="umr-row">
      <div>
        <strong>${fmtRp(u.umr)}</strong>
        <span class="umr-tgl">Berlaku ${fmtTgl(u.tgl)}</span>
      </div>
      <button class="btn btn-sm btn-danger" onclick="handleDeleteUMR('${u.id}')">Hapus</button>
    </div>`).join('');
}

async function handleSaveUMR() {
  const val = parseFloat(document.getElementById('umr-input').value);
  const tgl = document.getElementById('umr-tgl').value;
  if (!val || val < 1000000) { showAlert('umr-alert', 'error', 'UMR tidak valid (min Rp 1.000.000)'); return; }
  if (!tgl) { showAlert('umr-alert', 'error', 'Pilih tanggal berlaku'); return; }
  try {
    await saveUMR(val, tgl);
    document.getElementById('umr-input').value = '';
    showAlert('umr-alert', 'success', 'UMR baru disimpan. Data lembur lama tidak berubah.');
    renderUMRPage();
  } catch (e) { showAlert('umr-alert', 'error', 'Gagal menyimpan: ' + e.message); }
}

async function handleDeleteUMR(id) {
  const list = await getUMRList();
  if (list.length <= 1) { showAlert('umr-alert', 'error', 'Minimal harus ada 1 data UMR'); return; }
  if (!confirm('Hapus data UMR ini?')) return;
  await deleteUMR(id);
  renderUMRPage();
}
