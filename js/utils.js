// ============================================================
// UTILITIES
// ============================================================

const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const DIVISI_LIST = ['FGWH','RMWH','PMWH'];

function fmtTgl(t) {
  if (!t) return '-';
  return new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}

function fmtRp(n) {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
}

function fmtJam(j) {
  return parseFloat(j || 0).toFixed(1) + ' jam';
}

function calcJam(mulai, selesai, istirahat) {
  if (!mulai || !selesai) return 0;
  const [mh, mm] = mulai.split(':').map(Number);
  const [sh, sm] = selesai.split(':').map(Number);
  let tot = (sh * 60 + sm) - (mh * 60 + mm);
  if (tot < 0) tot += 1440;
  return Math.max(0, tot / 60 - parseFloat(istirahat || 0));
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date().setDate(diff)).toISOString().split('T')[0];
}

function getMonthStart() {
  return new Date().toISOString().substring(0, 7) + '-01';
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function showAlert(elId, type, msg) {
  const el = document.getElementById(elId);
  if (!el) return;
  const cls = { success: 'alert-success', error: 'alert-error', warn: 'alert-warn' }[type] || 'alert-warn';
  el.innerHTML = `<div class="alert ${cls}">${msg}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4500);
}

function badgeStatus(status) {
  const map = { PKWT: 'badge-blue', PKWTT: 'badge-green', Outsourcing: 'badge-amber', Magang: 'badge-gray' };
  return `<span class="badge ${map[status] || 'badge-gray'}">${status || '-'}</span>`;
}
