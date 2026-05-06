// ============================================================
// LEMBUR MODULE
// ============================================================

const LEM_COLLECTION = 'lembur';
let nameRows = [];
let lemCache = [];

// ---- FIRESTORE ----
async function saveLemburBatch(records) {
  const batch = db.batch();
  records.forEach(rec => {
    const ref = db.collection(LEM_COLLECTION).doc();
    batch.set(ref, rec);
  });
  await batch.commit();
}

async function loadLembur(divisi, filters = {}) {
  let q = db.collection(LEM_COLLECTION).where('divisi', '==', divisi);
  if (filters.dari) q = q.where('tgl', '>=', filters.dari);
  if (filters.sampai) q = q.where('tgl', '<=', filters.sampai);
  q = q.orderBy('tgl', 'desc');
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function deleteLembur(id) {
  await db.collection(LEM_COLLECTION).doc(id).delete();
}

// ---- MULTI-NAME ROWS ----
function initNameRows() {
  nameRows = [{ id: 'nr' + Date.now(), nama: '', bagian: '', status: '', wa: '' }];
  renderNameRows();
}

function addNameRow() {
  nameRows.push({ id: 'nr' + Date.now() + Math.random().toString(36).slice(2,5), nama: '', bagian: '', status: '', wa: '' });
  renderNameRows();
}

function removeNameRow(id) {
  if (nameRows.length <= 1) return;
  nameRows = nameRows.filter(r => r.id !== id);
  renderNameRows();
}

function renderNameRows() {
  const cont = document.getElementById('name-rows');
  cont.innerHTML = nameRows.map((row, i) => `
    <div class="multi-row" id="row-${row.id}">
      <div class="autocomplete-wrap" style="flex:2">
        <label>Karyawan ${i + 1}</label>
        <input type="text" value="${row.nama}" placeholder="Ketik nama..." autocomplete="off"
          id="inp-${row.id}" oninput="onNameInput(this,'${row.id}')">
        <div class="autocomplete-list" id="sug-${row.id}" style="display:none"></div>
      </div>
      <div style="flex:2">
        <label>Bagian / Status</label>
        <input type="text" id="info-${row.id}"
          value="${row.bagian ? row.bagian + ' · ' + row.status : ''}"
          readonly class="input-readonly">
      </div>
      <div style="display:flex;align-items:flex-end;padding-bottom:2px">
        ${nameRows.length > 1
          ? `<button class="btn btn-sm btn-danger" onclick="removeNameRow('${row.id}')">✕</button>`
          : '<div style="width:34px"></div>'}
      </div>
    </div>`).join('');
}

function onNameInput(el, id) {
  const row = nameRows.find(r => r.id === id);
  if (row) row.nama = el.value;
  const divisi = window._activDiv;
  const sug = document.getElementById('sug-' + id);
  const matches = getSuggestKaryawan(divisi, el.value);
  if (!matches.length) { sug.style.display = 'none'; return; }
  sug.innerHTML = matches.map(k =>
    `<div class="autocomplete-item" onmousedown="selectName('${id}',${JSON.stringify(k).replace(/"/g,'&quot;')})">${k.nama}
      <span class="text-muted small">${k.bagian || ''} · ${k.status || ''}</span>
    </div>`).join('');
  sug.style.display = 'block';
}

function selectName(id, k) {
  const row = nameRows.find(r => r.id === id);
  if (row) { row.nama = k.nama; row.bagian = k.bagian || ''; row.status = k.status || ''; row.wa = k.wa || ''; }
  document.getElementById('inp-' + id).value = k.nama;
  document.getElementById('info-' + id).value = (k.bagian || '') + ' · ' + (k.status || '');
  document.getElementById('sug-' + id).style.display = 'none';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.autocomplete-wrap'))
    document.querySelectorAll('.autocomplete-list').forEach(el => el.style.display = 'none');
});

// ---- FORM ----
function onTglChange() {
  const v = document.getElementById('f-tgl').value;
  if (v) document.getElementById('f-hari').value = HARI[new Date(v + 'T00:00:00').getDay()];
  updateJamPreview();
}

async function updateJamPreview() {
  const mulai = document.getElementById('f-mulai').value;
  const selesai = document.getElementById('f-selesai').value;
  const ist = document.getElementById('f-istirahat').value;
  const tgl = document.getElementById('f-tgl').value || getToday();
  const jam = calcJam(mulai, selesai, ist);
  const { upah, umrVal } = await calcUpahLembur(jam, tgl);
  const warn = jam > 3;
  document.getElementById('jam-preview').innerHTML =
    `Total jam: <strong style="color:${warn ? '#E24B4A' : '#3B6D11'}">${fmtJam(jam)}</strong>
     &nbsp;|&nbsp; Upah/orang: <strong>${fmtRp(upah)}</strong>
     &nbsp;|&nbsp; <span class="text-muted small">UMR: ${fmtRp(umrVal)}</span>
     ${warn ? '&nbsp;<span class="badge badge-red">Cek batas lembur</span>' : ''}`;
}

async function handleSaveLembur(divisi) {
  const tgl = document.getElementById('f-tgl').value;
  const mulai = document.getElementById('f-mulai').value;
  const selesai = document.getElementById('f-selesai').value;
  const ist = document.getElementById('f-istirahat').value;
  const istLabel = document.getElementById('f-istirahat').options[document.getElementById('f-istirahat').selectedIndex].text;
  const plan = document.getElementById('f-plan').value;
  const hasil = document.getElementById('f-hasil').value;

  if (!tgl || !mulai || !selesai) { showAlert('inp-alert', 'error', 'Tanggal, jam mulai & selesai wajib diisi'); return; }
  const filledRows = nameRows.filter(r => r.nama.trim());
  if (!filledRows.length) { showAlert('inp-alert', 'error', 'Isi minimal 1 nama karyawan'); return; }

  const jam = calcJam(mulai, selesai, ist);
  const { upah, umrVal, umrTgl } = await calcUpahLembur(jam, tgl);

  const records = filledRows.map(row => ({
    divisi, tgl, hari: HARI[new Date(tgl + 'T00:00:00').getDay()],
    nama: row.nama, bagian: row.bagian, status: row.status, wa: row.wa,
    plan, hasil, mulai, selesai, istirahat: ist, istirahatLabel: istLabel,
    jam, upah, umrVal, umrTgl,
    createdAt: new Date().toISOString()
  }));

  try {
    await saveLemburBatch(records);
    showAlert('inp-alert', 'success', `✓ ${filledRows.length} data lembur berhasil disimpan!`);
    resetLemburForm();
    await loadAndRenderLemburTable(divisi);
  } catch (e) {
    showAlert('inp-alert', 'error', 'Gagal menyimpan: ' + e.message);
  }
}

function resetLemburForm() {
  document.getElementById('f-plan').value = '';
  document.getElementById('f-hasil').value = '';
  document.getElementById('f-mulai').value = '16:30';
  document.getElementById('f-selesai').value = '22:15';
  document.getElementById('f-istirahat').value = '0.5';
  initNameRows();
  updateJamPreview();
}

// ---- TABLE ----
async function loadAndRenderLemburTable(divisi) {
  const filTgl = document.getElementById('fil-tgl').value;
  const filters = filTgl ? { dari: filTgl, sampai: filTgl } : {};
  lemCache = await loadLembur(divisi, filters);
  renderLemburTable(divisi);
}

function renderLemburTable(divisi) {
  const filNama = (document.getElementById('fil-nama').value || '').toLowerCase();
  let data = lemCache.filter(r => !filNama || r.nama.toLowerCase().includes(filNama));
  data.sort((a, b) => b.tgl.localeCompare(a.tgl) || a.nama.localeCompare(b.nama));

  const tbody = document.getElementById('lembur-tbody');
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="11" class="empty">Belum ada data lembur</td></tr>'; return; }
  tbody.innerHTML = data.map(r => `
    <tr>
      <td class="small">${fmtTgl(r.tgl)}</td>
      <td><strong>${r.nama}</strong></td>
      <td>${r.bagian || '-'}</td>
      <td class="small" style="max-width:140px">${r.plan || '-'}</td>
      <td>${r.mulai}</td>
      <td class="small">${r.istirahatLabel || '-'}</td>
      <td>${r.selesai}</td>
      <td style="font-weight:500;color:${r.jam > 3 ? '#E24B4A' : 'inherit'}">${fmtJam(r.jam)}</td>
      <td class="small">${fmtRp(r.upah || 0)}</td>
      <td class="small" style="max-width:120px">${r.hasil || '-'}</td>
      <td><button class="btn btn-sm btn-danger" onclick="handleDeleteLembur('${r.id}','${divisi}')">✕</button></td>
    </tr>`).join('');
}

async function handleDeleteLembur(id, divisi) {
  if (!confirm('Hapus data lembur ini?')) return;
  await deleteLembur(id);
  await loadAndRenderLemburTable(divisi);
}
