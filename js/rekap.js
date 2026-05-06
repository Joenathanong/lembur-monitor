// ============================================================
// REKAP & EXPORT MODULE
// ============================================================

let rekapTab = 'periode';

function switchRekapTab(t) {
  rekapTab = t;
  document.getElementById('rtab-periode').style.display = t === 'periode' ? '' : 'none';
  document.getElementById('rtab-tanggal').style.display = t === 'tanggal' ? '' : 'none';
  document.querySelectorAll('#page-rekap .tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === t);
  });
}

function getRekapRange() {
  let dari, sampai;
  if (rekapTab === 'periode') {
    dari = document.getElementById('r-dari').value;
    sampai = document.getElementById('r-sampai').value;
    if (!dari || !sampai) { alert('Pilih rentang tanggal'); return null; }
  } else {
    dari = sampai = document.getElementById('r-tgl1').value;
    if (!dari) { alert('Pilih tanggal'); return null; }
  }
  return { dari, sampai };
}

async function getRekapData(divisi) {
  const rng = getRekapRange();
  if (!rng) return null;
  const data = await loadLembur(divisi, { dari: rng.dari, sampai: rng.sampai });
  data.sort((a, b) => a.tgl.localeCompare(b.tgl) || a.nama.localeCompare(b.nama));
  return { ...rng, data };
}

// ---- PREVIEW ----
async function handlePreviewRekap(divisi) {
  const res = await getRekapData(divisi);
  if (!res) return;
  const { dari, sampai, data } = res;
  document.getElementById('rekap-preview-area').style.display = 'block';
  const rows = [...data]; while (rows.length < 20) rows.push(null);

  document.getElementById('rekap-preview-content').innerHTML = `
    <div class="small text-muted mb-8">
      ${dari === sampai ? fmtTgl(dari) : fmtTgl(dari) + ' — ' + fmtTgl(sampai)}
      &nbsp;|&nbsp; Divisi: ${divisi} &nbsp;|&nbsp; ${data.length} karyawan
    </div>
    <div style="overflow-x:auto">
      <table class="print-table">
        <thead>
          <tr>
            <th rowspan="2">No.</th><th rowspan="2">Nama Karyawan</th>
            <th rowspan="2">Lembur Direncanakan</th><th rowspan="2">Hasil Lembur</th>
            <th colspan="3">Pelaksanaan Lembur</th><th rowspan="2">Jam</th>
            <th rowspan="2">Upah</th><th rowspan="2">Paraf</th>
          </tr>
          <tr><th>Mulai</th><th>Istirahat</th><th>Selesai</th></tr>
        </thead>
        <tbody>
          ${rows.map((r, i) => `<tr>
            <td class="text-center">${i + 1}</td>
            <td>${r ? `<strong>${r.nama}</strong>` : ''}</td>
            <td>${r ? r.plan || '' : ''}</td>
            <td>${r ? r.hasil || '' : ''}</td>
            <td class="text-center">${r ? r.mulai : ''}</td>
            <td class="text-center">${r ? r.istirahatLabel || '' : ''}</td>
            <td class="text-center">${r ? r.selesai : ''}</td>
            <td class="text-center">${r ? fmtJam(r.jam) : ''}</td>
            <td class="text-right">${r ? fmtRp(r.upah || 0) : ''}</td>
            <td></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="sign-row">
      <div>Penanggung Jawab/SPV,<br><br><br>(…………………………)</div>
      <div>Disetujui Manager Logistik<br><br><br>(…………………………)</div>
      <div>Dicek HRD,<br><br><br>(…………………………)</div>
    </div>`;
}

// ---- PRINT PDF ----
async function handlePrintRekap(divisi) {
  const res = await getRekapData(divisi);
  if (!res) return;
  const { dari, sampai, data } = res;
  const rows = [...data]; while (rows.length < 20) rows.push(null);
  const tglHeader = dari === sampai
    ? `${HARI[new Date(dari + 'T00:00:00').getDay()]}, ${fmtTgl(dari)}`
    : `${fmtTgl(dari)} s/d ${fmtTgl(sampai)}`;

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Form HRD-34 — ${divisi}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0 }
    body { font-family:Arial,sans-serif; font-size:10px; padding:20px; color:#000 }
    table { border-collapse:collapse; width:100% }
    td, th { border:1px solid #000; padding:3px 5px; font-size:9px }
    .header { margin-bottom:10px }
    .header h3 { font-size:11px; margin-bottom:3px }
    .sign { display:flex; justify-content:space-between; margin-top:24px; font-size:9px }
    .sign div { text-align:center; width:30% }
    .keterangan { margin-top:10px; font-size:9px }
    @media print { @page { size:A4; margin:15mm } }
  </style></head><body>
  <div class="header">
    <h3>Form HRD - 34 &nbsp; Formulir Pengajuan dan Pelaksanaan Kerja Lembur</h3>
    <div>HARI/TANGGAL : ${tglHeader} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; STATUS KARYAWAN : BULANAN</div>
    <div>DEPARTEMENT : ${divisi}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th rowspan="2" style="width:24px">NO.</th>
        <th rowspan="2">NAMA KARYAWAN</th>
        <th rowspan="2">LEMBUR YANG DIRENCANAKAN</th>
        <th rowspan="2">HASIL LEMBUR</th>
        <th colspan="3">PELAKSANAAN LEMBUR</th>
        <th rowspan="2">PARAF</th>
      </tr>
      <tr><th style="width:36px">MULAI</th><th>ISTIRAHAT</th><th style="width:40px">SELESAI</th></tr>
    </thead>
    <tbody>
      ${rows.map((r, i) => `<tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${r ? r.nama : ''}</td>
        <td>${r ? r.plan || '' : ''}</td>
        <td>${r ? r.hasil || '' : ''}</td>
        <td style="text-align:center">${r ? r.mulai : ''}</td>
        <td style="text-align:center">${r ? r.istirahatLabel || '' : ''}</td>
        <td style="text-align:center">${r ? r.selesai : ''}</td>
        <td></td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="keterangan">
    Keterangan : - Lembur dapat dilaksanakan setelah SPL ditandatangani oleh Atasan langsung &amp; Manager<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - Keterlambatan penyerahan SPL tidak dibayar
  </div>
  <div class="sign">
    <div>Penanggung Jawab/SPV,<br><br><br><br>(…………………………)</div>
    <div>Disetujui Manager Logistik<br><br><br><br>(…………………………)</div>
    <div>Dicek HRD,<br><br><br><br>(…………………………)</div>
  </div>
  <script>window.onload = () => window.print();<\/script>
  </body></html>`);
  w.document.close();
}

// ---- EXPORT EXCEL ----
async function handleExportExcel(divisi) {
  const res = await getRekapData(divisi);
  if (!res) return;
  const { dari, sampai, data } = res;
  if (!data.length) { alert('Tidak ada data pada rentang ini'); return; }

  const today = getToday();
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  // Load FTW & MTD data
  const ftwData = await loadLembur(divisi, { dari: weekStart, sampai: today });
  const mtdData = await loadLembur(divisi, { dari: monthStart, sampai: today });

  const wb = XLSX.utils.book_new();

  // === SHEET 1: Detail ===
  const s1Head = [
    [`Form HRD-34 — Rekap Lembur Detail`],
    [`Divisi: ${divisi} | Periode: ${fmtTgl(dari)} s/d ${fmtTgl(sampai)}`],
    [`Digenerate: ${fmtTgl(today)}`],
    []
  ];
  const s1Cols = [['No.','Tanggal','Hari','Nama Karyawan','Bagian','Status Karyawan','Lembur Direncanakan','Hasil Lembur','Jam Mulai','Istirahat','Jam Selesai','Total Jam','Upah Lembur (Rp)','UMR Dipakai (Rp)']];
  const s1Rows = data.map((r, i) => [i+1, r.tgl, r.hari, r.nama, r.bagian||'', r.status||'', r.plan||'', r.hasil||'', r.mulai, r.istirahatLabel||'', r.selesai, parseFloat(r.jam.toFixed(1)), Math.round(r.upah||0), Math.round(r.umrVal||0)]);
  const totalJam = data.reduce((s,r) => s+r.jam, 0);
  const totalUpah = data.reduce((s,r) => s+(r.upah||0), 0);
  const s1Footer = [[], ['','','','','','','','','','','TOTAL', parseFloat(totalJam.toFixed(1)), Math.round(totalUpah), '']];
  const ws1 = XLSX.utils.aoa_to_sheet([...s1Head, ...s1Cols, ...s1Rows, ...s1Footer]);
  ws1['!cols'] = [4,10,8,20,14,12,30,30,8,10,8,8,16,16].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb, ws1, 'Detail Lembur');

  // === SHEET 2: Rekap per Karyawan (FTW + MTD) ===
  const empMap = {};
  const addToMap = (r, key) => {
    if (!empMap[r.nama]) empMap[r.nama] = { nama:r.nama, bagian:r.bagian||'', status:r.status||'', periodJam:0, periodUpah:0, ftwJam:0, ftwUpah:0, mtdJam:0, mtdUpah:0 };
    empMap[r.nama][key + 'Jam'] += r.jam;
    empMap[r.nama][key + 'Upah'] += (r.upah||0);
  };
  data.forEach(r => { addToMap(r, 'period'); });
  ftwData.forEach(r => addToMap(r, 'ftw'));
  mtdData.forEach(r => addToMap(r, 'mtd'));

  const s2Head = [
    [`Rekap Lembur per Karyawan`],
    [`Divisi: ${divisi} | Digenerate: ${fmtTgl(today)}`],
    [`For The Week (FTW): ${fmtTgl(weekStart)} — ${fmtTgl(today)} | Month To Date (MTD): ${fmtTgl(monthStart)} — ${fmtTgl(today)}`],
    []
  ];
  const s2Cols = [['No.','Nama Karyawan','Bagian','Status','Jam Periode','Upah Periode (Rp)','Jam FTW','Upah FTW (Rp)','Jam MTD','Upah MTD (Rp)','Status Minggu Ini']];
  const s2Rows = Object.values(empMap).sort((a,b)=>b.mtdJam-a.mtdJam).map((e,i) => [
    i+1, e.nama, e.bagian, e.status,
    parseFloat(e.periodJam.toFixed(1)), Math.round(e.periodUpah),
    parseFloat(e.ftwJam.toFixed(1)), Math.round(e.ftwUpah),
    parseFloat(e.mtdJam.toFixed(1)), Math.round(e.mtdUpah),
    e.ftwJam > 14 ? 'MELEBIHI BATAS' : 'Normal'
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([...s2Head, ...s2Cols, ...s2Rows]);
  ws2['!cols'] = [4,22,14,12,10,16,10,16,10,16,16].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb, ws2, 'Rekap per Karyawan');

  // === SHEET 3: Summary FTW vs MTD ===
  const ftwJamTotal = ftwData.reduce((s,r) => s+r.jam, 0);
  const ftwUpahTotal = ftwData.reduce((s,r) => s+(r.upah||0), 0);
  const mtdJamTotal = mtdData.reduce((s,r) => s+r.jam, 0);
  const mtdUpahTotal = mtdData.reduce((s,r) => s+(r.upah||0), 0);
  const ftwEmp = [...new Set(ftwData.map(r=>r.nama))];
  const mtdEmp = [...new Set(mtdData.map(r=>r.nama))];
  const ftwByEmp = {}; ftwData.forEach(r => ftwByEmp[r.nama]=(ftwByEmp[r.nama]||0)+r.jam);
  const warnCount = Object.values(ftwByEmp).filter(j=>j>14).length;

  const s3Data = [
    [`Summary Lembur — For The Week & Month To Date`],
    [`Divisi: ${divisi} | Digenerate: ${fmtTgl(today)}`],
    [],
    ['Metrik', 'For The Week (FTW)', 'Month To Date (MTD)'],
    ['Periode', `${fmtTgl(weekStart)} — ${fmtTgl(today)}`, `${fmtTgl(monthStart)} — ${fmtTgl(today)}`],
    ['Jumlah Karyawan Lembur', ftwEmp.length, mtdEmp.length],
    ['Total Jam Lembur', parseFloat(ftwJamTotal.toFixed(1)), parseFloat(mtdJamTotal.toFixed(1))],
    ['Total Upah Lembur (Rp)', Math.round(ftwUpahTotal), Math.round(mtdUpahTotal)],
    ['Rata-rata Jam/Orang', ftwEmp.length ? parseFloat((ftwJamTotal/ftwEmp.length).toFixed(1)) : 0, mtdEmp.length ? parseFloat((mtdJamTotal/mtdEmp.length).toFixed(1)) : 0],
    ['Karyawan Melebihi 14 Jam (FTW)', warnCount, '-'],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(s3Data);
  ws3['!cols'] = [{wch:30},{wch:28},{wch:28}];
  XLSX.utils.book_append_sheet(wb, ws3, 'Summary FTW MTD');

  XLSX.writeFile(wb, `LemburMonitor_${divisi}_${dari}_${sampai}.xlsx`);
}
