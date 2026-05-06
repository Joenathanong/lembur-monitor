// ============================================================
// DASHBOARD MODULE
// ============================================================

let dailyChart = null, deptChart = null;

async function renderDashboard(divisi) {
  const today = getToday();
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  // Load semua data yang diperlukan
  const [todayData, weekData, monthData] = await Promise.all([
    loadLembur(divisi, { dari: today, sampai: today }),
    loadLembur(divisi, { dari: weekStart, sampai: today }),
    loadLembur(divisi, { dari: monthStart, sampai: today }),
  ]);

  // Metrics
  document.getElementById('m-today').textContent = todayData.length;
  document.getElementById('m-week').textContent = weekData.reduce((s,r) => s+r.jam, 0).toFixed(1);
  document.getElementById('m-mtd').textContent = monthData.reduce((s,r) => s+r.jam, 0).toFixed(1);

  const byEmpWeek = {};
  weekData.forEach(r => byEmpWeek[r.nama] = (byEmpWeek[r.nama]||0) + r.jam);
  document.getElementById('m-warn').textContent = Object.values(byEmpWeek).filter(j=>j>14).length;

  // Charts
  await renderDailyChart(divisi);
  renderDeptChart(monthData);
  renderTopEmpTable(monthData, weekData);
}

async function renderDailyChart(divisi) {
  const labels = [], vals = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const tgl = d.toISOString().split('T')[0];
    const dayData = await loadLembur(divisi, { dari: tgl, sampai: tgl });
    labels.push(d.toLocaleDateString('id-ID', { weekday:'short', day:'numeric' }));
    vals.push(parseFloat(dayData.reduce((s,r) => s+r.jam, 0).toFixed(1)));
  }
  if (dailyChart) dailyChart.destroy();
  const ctx = document.getElementById('chart-daily').getContext('2d');
  dailyChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Jam', data: vals, backgroundColor: '#B5D4F4', borderColor: '#378ADD', borderWidth: 1, borderRadius: 4 }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,ticks:{font:{size:10}}},x:{ticks:{font:{size:10}},grid:{display:false}}} }
  });
}

function renderDeptChart(monthData) {
  const byDept = {};
  monthData.forEach(r => { const k = r.bagian||'Lainnya'; byDept[k] = (byDept[k]||0) + r.jam; });
  const labels = Object.keys(byDept);
  const vals = Object.values(byDept).map(v => parseFloat(v.toFixed(1)));
  if (deptChart) deptChart.destroy();
  const colors = ['#378ADD','#1D9E75','#BA7517','#D4537E','#7F77DD','#D85A30','#639922'];
  deptChart = new Chart(document.getElementById('chart-dept').getContext('2d'), {
    type: 'doughnut',
    data: { labels: labels.length?labels:['Belum ada data'], datasets: [{ data:vals.length?vals:[1], backgroundColor:labels.length?colors.slice(0,labels.length):['#E8E8E8'], borderWidth:0 }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{font:{size:10},padding:6} } } }
  });
}

function renderTopEmpTable(monthData, weekData) {
  const empMap = {};
  monthData.forEach(r => {
    if (!empMap[r.nama]) empMap[r.nama] = { nama:r.nama, bagian:r.bagian, status:r.status, mtd:0, mtdUpah:0, week:0, umrVal:r.umrVal };
    empMap[r.nama].mtd += r.jam;
    empMap[r.nama].mtdUpah += (r.upah||0);
  });
  weekData.forEach(r => {
    if (!empMap[r.nama]) empMap[r.nama] = { nama:r.nama, bagian:r.bagian, status:r.status, mtd:0, mtdUpah:0, week:0, umrVal:r.umrVal };
    empMap[r.nama].week += r.jam;
  });

  const list = Object.values(empMap).sort((a,b) => b.mtd - a.mtd).slice(0, 15);
  const tbody = document.getElementById('top-emp-body');
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="8" class="empty">Belum ada data</td></tr>'; return; }

  tbody.innerHTML = list.map(e => `
    <tr>
      <td><strong>${e.nama}</strong></td>
      <td>${e.bagian||'-'}</td>
      <td>${badgeStatus(e.status)}</td>
      <td>${e.mtd.toFixed(1)} jam</td>
      <td style="color:${e.week>14?'#E24B4A':'inherit'}">${e.week.toFixed(1)} jam</td>
      <td><strong>${fmtRp(e.mtdUpah)}</strong></td>
      <td class="small text-muted">${e.umrVal ? fmtRp(e.umrVal) : '-'}</td>
      <td>${e.week>14 ? '<span class="badge badge-red">Melebihi batas</span>' : '<span class="badge badge-green">Normal</span>'}</td>
    </tr>`).join('');
}
