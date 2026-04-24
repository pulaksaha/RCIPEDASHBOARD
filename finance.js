/* ═══════════════════════════════════════════════
   Finance JS – RCPIE Portal
   ═══════════════════════════════════════════════ */
'use strict';

// ── Fallback data ─────────────────────────────
const CONSULTANCY_BY_DEPT = {
  ECE: 1852965, ISE: 372357, MCA: 235505, CSE: 101400, MBA: 61384,
  MAT: 88600,   EEE: 86615,  ME: 39500,   AIML: 4250,
  PHY: 0,       CHE: 4000,   AIDS: 0,     CV: 0
};

const ELOAD_BY_DEPT = {
  ECE: 178000, CSE: 88500, MCA: 62500, EEE: 70500, ISE: 20400,
  ME: 10000,   MAT: 2000,  PHY: 2000,  CHE: 11000,
  MBA: 0,      AIML: 0,    AIDS: 0
};

const CONS_COL = {
  faculty: 'Faculty Involved',
  dept:    'Department',
  title:   'Name/Title of the work',
  agency:  'Funding Agency',
  regAmt:  'Registration Amount(If Activity)',
  participants: 'No of Participants (If Applicable)',
  amount:  'Consultancy Amount Generated',
  month:   'Month and Year',
  remarks: 'Remarks'
};

const ELOAD_COL = {
  faculty: 'Faculty Involved',
  dept:    'Department',
  startup: 'Startup Initiated',
  regAmt:  'Registration Amount per head',
  participants: 'No of Participants',
  revenue: 'Revenue Generation through Start-up',
  training:'Name of the Training Program',
  month:   'Published/Filed Month',
  coe:     'CoE'
};

let consultancyChart = null;
let eloadChart       = null;

// ── Build consultancy chart (from live data or fallback) ──
function buildConsultancyChart(byDept) {
  const labels = Object.keys(byDept).filter(d => byDept[d] > 0).sort((a,b) => byDept[b]-byDept[a]);
  const vals   = labels.map(d => byDept[d]);

  if (consultancyChart) consultancyChart.destroy();
  const ctx = document.getElementById('consultancyChart').getContext('2d');
  consultancyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Consultancy Amount (₹)',
        data: vals,
        backgroundColor: 'rgba(29,158,117,0.75)',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ₹${ctx.parsed.x.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            callback: v => v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : `₹${v.toLocaleString('en-IN')}`,
            font: { size: 11 }
          }
        },
        y: { ticks: { font: { size: 12 } } }
      }
    }
  });
}

// ── Build E-load chart ─────────────────────────
function buildEloadChart(byDept) {
  const labels = Object.keys(byDept).filter(d => byDept[d] > 0).sort((a,b) => byDept[b]-byDept[a]);
  const vals   = labels.map(d => byDept[d]);

  if (eloadChart) eloadChart.destroy();
  const ctx = document.getElementById('eloadChart').getContext('2d');
  eloadChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'E-load Revenue (₹)',
        data: vals,
        backgroundColor: 'rgba(55,138,221,0.75)',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ₹${ctx.parsed.x.toLocaleString('en-IN')}` }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            callback: v => `₹${v.toLocaleString('en-IN')}`,
            font: { size: 11 }
          }
        },
        y: { ticks: { font: { size: 12 } } }
      }
    }
  });
}

// ── Render consultancy table ──────────────────
function renderConsultancyTable(rows) {
  const wrap = document.getElementById('consultancyTableWrap');
  if (!rows.length) {
    wrap.innerHTML = '<div class="no-data">No consultancy data available.</div>';
    return;
  }

  let html = '';
  rows.forEach((r, i) => {
    const amt    = parseAmount(r[CONS_COL.amount]);
    const faculty = (r[CONS_COL.faculty] || '').trim();
    const dept    = (r[CONS_COL.dept] || '').trim();
    const title   = (r[CONS_COL.title] || '').trim();
    const agency  = (r[CONS_COL.agency] || '—').trim();
    const month   = (r[CONS_COL.month] || '—').trim();

    html += `<tr class="cons-row">
      <td data-label="Faculty"><strong>${esc(faculty)}</strong></td>
      <td data-label="Dept"><span class="badge badge-gray">${esc(dept)}</span></td>
      <td data-label="Work Title" title="${esc(title)}">${esc(title.slice(0,60))}${title.length>60?'…':''}</td>
      <td data-label="Agency">${esc(agency)}</td>
      <td data-label="Amount" style="font-weight:700">${formatINR(amt, r[CONS_COL.amount])}</td>
      <td data-label="Month">${esc(month)}</td>
    </tr>`;
  });

  wrap.innerHTML = `
    <table id="consultancyTable" class="mobile-card-table">
      <caption>Faculty-level consultancy records for AY 2023–24</caption>
      <thead>
        <tr>
          <th data-sort="0">Faculty</th>
          <th data-sort="1">Dept</th>
          <th data-sort="2">Work Title</th>
          <th data-sort="3">Agency</th>
          <th data-sort="4">Amount</th>
          <th data-sort="5">Month</th>
        </tr>
      </thead>
      <tbody>${html}</tbody>
    </table>`;
  initTableSort(document.getElementById('consultancyTable'));

  // Search
  document.getElementById('consultancySearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    wrap.querySelectorAll('.cons-row').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = q && !text.includes(q) ? 'none' : '';
    });
  });
}

// ── Render E-load table ───────────────────────
function renderEloadTable(rows) {
  const wrap = document.getElementById('eloadTableWrap');
  if (!rows.length) {
    wrap.innerHTML = '<div class="no-data">No E-load data available.</div>';
    return;
  }

  let html = '';
  rows.forEach(r => {
    const rev     = parseAmount(r[ELOAD_COL.revenue]);
    const faculty = (r[ELOAD_COL.faculty] || '').trim();
    const dept    = (r[ELOAD_COL.dept] || '').trim();
    const startup = (r[ELOAD_COL.startup] || '—').trim();
    const training= (r[ELOAD_COL.training] || '—').trim();
    const month   = (r[ELOAD_COL.month] || '—').trim();

    html += `<tr>
      <td data-label="Faculty"><strong>${esc(faculty)}</strong></td>
      <td data-label="Dept"><span class="badge badge-gray">${esc(dept)}</span></td>
      <td data-label="Startup">${esc(startup)}</td>
      <td data-label="Training">${esc(training.slice(0,60))}${training.length>60?'…':''}</td>
      <td data-label="Revenue" style="font-weight:700">${formatINR(rev, r[ELOAD_COL.revenue])}</td>
      <td data-label="Month">${esc(month)}</td>
    </tr>`;
  });

  wrap.innerHTML = `
    <table id="eloadTable" class="mobile-card-table">
      <caption>Entrepreneurship and E-load activities for AY 2023–24</caption>
      <thead>
        <tr>
          <th data-sort="0">Faculty</th>
          <th data-sort="1">Dept</th>
          <th data-sort="2">Startup</th>
          <th data-sort="3">Training Program</th>
          <th data-sort="4">Revenue</th>
          <th data-sort="5">Month</th>
        </tr>
      </thead>
      <tbody>${html}</tbody>
    </table>`;
  initTableSort(document.getElementById('eloadTable'));
}

// ── Aggregate from rows ───────────────────────
function aggregateByDept(rows, amtCol) {
  const byDept = {};
  rows.forEach(r => {
    const dept = (r['Department'] || '').trim();
    const amt  = parseAmount(r[amtCol]);
    if (dept && amt !== null) {
      byDept[dept] = (byDept[dept] || 0) + amt;
    }
  });
  return byDept;
}

// ── Load consultancy ──────────────────────────
async function loadConsultancy() {
  const wrap = document.getElementById('consultancyTableWrap');
  showSpinner(wrap);
  try {
    const rows = await fetchSheet(SHEET_NAMES.CONSULTANCY);
    if (rows.length) {
      const byDept = aggregateByDept(rows, CONS_COL.amount);
      // Merge with fallback for any missing depts
      const merged = { ...CONSULTANCY_BY_DEPT, ...byDept };
      buildConsultancyChart(merged);
      renderConsultancyTable(rows);
    } else {
      buildConsultancyChart(CONSULTANCY_BY_DEPT);
      wrap.innerHTML = '<div class="no-data">No consultancy rows returned. Showing chart from known totals.</div>';
    }
  } catch(e) {
    console.warn('Consultancy fetch error, using fallback:', e);
    buildConsultancyChart(CONSULTANCY_BY_DEPT);
    showError(wrap, 'Unable to load live consultancy data. Chart shows known totals. Configure SCRIPT_URL in app.js.');
  }
}

// ── Load E-load ───────────────────────────────
async function loadEload() {
  const wrap = document.getElementById('eloadTableWrap');
  showSpinner(wrap);
  try {
    const rows = await fetchSheet(SHEET_NAMES.ENTREPRENEURSHIP);
    if (rows.length) {
      const byDept = aggregateByDept(rows, ELOAD_COL.revenue);
      const merged = { ...ELOAD_BY_DEPT, ...byDept };
      buildEloadChart(merged);
      renderEloadTable(rows);
    } else {
      buildEloadChart(ELOAD_BY_DEPT);
      wrap.innerHTML = '<div class="no-data">No E-load rows returned. Showing chart from known totals.</div>';
    }
  } catch(e) {
    console.warn('E-load fetch error, using fallback:', e);
    buildEloadChart(ELOAD_BY_DEPT);
    showError(wrap, 'Unable to load live E-load data. Chart shows known totals. Configure SCRIPT_URL in app.js.');
  }
}

// ── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav('Finance');
  initFooter();
  loadConsultancy();
  loadEload();
});
