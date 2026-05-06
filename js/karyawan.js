// ============================================================
// KARYAWAN MODULE
// ============================================================

const KAR_COLLECTION = 'karyawan';
let karCache = {}; // { FGWH: [...], RMWH: [...], PMWH: [...] }

async function loadKaryawan(divisi) {
  const snap = await db.collection(KAR_COLLECTION)
    .where('divisi', '==', divisi)
    .orderBy('nama', 'asc')
    .get();
  karCache[divisi] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return karCache[divisi];
}

async function saveKaryawan(data, divisi, editId = null) {
  const payload = { ...data, divisi, updatedAt: new Date().toISOString() };
  if (editId) {
    await db.collection(KAR_COLLECTION).doc(editId).update(payload);
  } else {
    payload.createdAt = new Date().toISOString();
    await db.collection(KAR_COLLECTION).add(payload);
  }
  await loadKaryawan(divisi);
}

async function deleteKaryawan(id, divisi) {
  await db.collection(KAR_COLLECTION).doc(id).delete();
  await loadKaryawan(divisi);
}

function getKaryawanCache(divisi) {
  return karCache[divisi] || [];
}

// ---- UI ----
let editKarId = null;

function initKaryawanPage(divisi) {
  document.getElementById('kar-div-title').textContent = divisi;
  loadKaryawan(divisi).then(() => renderKarTable(divisi));
}

function showKarForm(divisi) {
  editKarId = null;
  document.getElementById('kar-form-title').textContent = 'Tambah Karyawan';
  clearKarForm();
  document.getElementById('kar-form-card').style.display = 'block';
}

function cancelKarForm() {
  document.getElementById('kar-form-card').style.display = 'none';
}

function clearKarForm() {
  ['k-nik','k-nama','k-jabatan','k-bagian','k-ttlk','k-ttlt','k-masuk','k-wa','k-email','k-alamat']
    .forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('k-status').value = 'PKWT';
  document.getElementById('k-jk').value = 'Laki-laki';
}

function editKarUI(id, divisi) {
  const k = getKaryawanCache(divisi).find(k => k.id === id);
  if (!k) return;
  editKarId = id;
  document.getElementById('kar-form-title').textContent = 'Edit Karyawan';
  const fieldMap = {
    'k-nik':'nik','k-nama':'nama','k-jabatan':'jabatan','k-bagian':'bagian',
    'k-ttlk':'ttlKota','k-ttlt':'ttlTgl','k-masuk':'masuk','k-wa':'wa',
    'k-email':'email','k-alamat':'alamat'
  };
  Object.entries(fieldMap).forEach(([elId, key]) => {
    const el = document.getElementById(elId); if(el) el.value = k[key] || '';
  });
  document.getElementById('k-status').value = k.status || 'PKWT';
  document.getElementById('k-jk').value = k.jk || 'Laki-laki';
  document.getElementById('kar-form-card').style.display = 'block';
}

async function handleSaveKaryawan(divisi) {
  const nik = document.getElementById('k-nik').value.trim();
  const nama = document.getElementById('k-nama').value.trim();
  if (!nik || !nama) { showAlert('kar-alert', 'error', 'NIK dan Nama wajib diisi'); return; }

  const data = {
    nik, nama,
    jabatan: document.getElementById('k-jabatan').value,
    bagian: document.getElementById('k-bagian').value,
    status: document.getElementById('k-status').value,
    jk: document.getElementById('k-jk').value,
    ttlKota: document.getElementById('k-ttlk').value,
    ttlTgl: document.getElementById('k-ttlt').value,
    masuk: document.getElementById('k-masuk').value,
    wa: document.getElementById('k-wa').value,
    email: document.getElementById('k-email').value,
    alamat: document.getElementById('k-alamat').value,
  };

  try {
    await saveKaryawan(data, divisi, editKarId);
    cancelKarForm();
    renderKarTable(divisi);
    showAlert('kar-alert', 'success', 'Data karyawan berhasil disimpan!');
  } catch (e) {
    showAlert('kar-alert', 'error', 'Gagal menyimpan: ' + e.message);
  }
}

async function handleDeleteKar(id, divisi) {
  if (!confirm('Hapus karyawan ini?')) return;
  try {
    await deleteKaryawan(id, divisi);
    renderKarTable(divisi);
  } catch (e) { alert('Gagal hapus: ' + e.message); }
}

function renderKarTable(divisi) {
  const search = (document.getElementById('kar-search').value || '').toLowerCase();
  const filStatus = document.getElementById('kar-fil-status').value;
  let data = getKaryawanCache(divisi).filter(k => {
    const ms = !search || (k.nama + k.nik + (k.bagian || '')).toLowerCase().includes(search);
    const mst = !filStatus || k.status === filStatus;
    return ms && mst;
  });

  const tbody = document.getElementById('kar-tbody');
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="8" class="empty">Belum ada data</td></tr>'; return; }
  tbody.innerHTML = data.map(k => `
    <tr>
      <td class="text-muted small">${k.nik || '-'}</td>
      <td><strong>${k.nama}</strong></td>
      <td>${k.jabatan || '-'}</td>
      <td>${k.bagian || '-'}</td>
      <td>${badgeStatus(k.status)}</td>
      <td>${k.wa ? `<a class="wa-link" href="https://wa.me/${k.wa.replace(/\D/g,'')}" target="_blank">+${k.wa}</a>` : '-'}</td>
      <td class="small">${fmtTgl(k.masuk)}</td>
      <td>
        <button class="btn btn-sm" onclick="editKarUI('${k.id}','${divisi}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="handleDeleteKar('${k.id}','${divisi}')">✕</button>
      </td>
    </tr>`).join('');
}

// Autocomplete helper untuk form lembur
function getSuggestKaryawan(divisi, query) {
  if (!query || query.length < 1) return [];
  return getKaryawanCache(divisi)
    .filter(k => k.nama.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);
}
