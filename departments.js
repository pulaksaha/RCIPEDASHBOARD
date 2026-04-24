/* ═══════════════════════════════════════════════
   Departments JS – RCPIE Portal
   Live data from Google Sheets — no dummy data
   ═══════════════════════════════════════════════ */
'use strict';

const DEPT_INFO = {
  ECE:  { faculty: 36, fullName: 'Electronics & Communication Engineering' },
  CSE:  { faculty: 31, fullName: 'Computer Science & Engineering' },
  ISE:  { faculty: 31, fullName: 'Information Science & Engineering' },
  EEE:  { faculty: 10, fullName: 'Electrical & Electronics Engineering' },
  CHE:  { faculty: 8,  fullName: 'Chemical Engineering' },
  PHY:  { faculty: 8,  fullName: 'Physics' },
  AIML: { faculty: 13, fullName: 'AI & Machine Learning' },
  AIDS: { faculty: 12, fullName: 'AI & Data Science' },
  MAT:  { faculty: 15, fullName: 'Mathematics' },
  MCA:  { faculty: 12, fullName: 'Master of Computer Applications' },
  MBA:  { faculty: 12, fullName: 'Master of Business Administration' },
  CV:   { faculty: 4,  fullName: 'Civil Engineering' },
  ME:   { faculty: 11, fullName: 'Mechanical Engineering' }
};

const PARAMS = ['R', 'C', 'P', 'I', 'E', 'MP', 'MPat'];
const PARAM_LABELS = {
  R: 'Research', C: 'Consultancy', P: 'Patents',
  I: 'Innovation/Proposals', E: 'Entrepreneurship',
  MP: 'Mandatory Paper', MPat: 'Mandatory Patent'
};

// ── Normalise param abbreviation (same logic as dashboard.js) ────────────────
const PARAM_ABBR_MAP = {
  'r': 'R', 'research': 'R',
  'c': 'C', 'consultancy': 'C',
  'p': 'P', 'patent': 'P', 'patents': 'P',
  'i': 'I', 'innovation': 'I', 'proposal': 'I', 'proposals': 'I', 'innovation/proposals': 'I',
  'e': 'E', 'entrepreneurship': 'E',
  'mp': 'MP', 'mandatory paper': 'MP', 'mandatorypaper': 'MP', 'm-paper': 'MP', 'm paper': 'MP',
  'mpat': 'MPat', 'mandatory patent': 'MPat', 'mandatorypatent': 'MPat', 'm-patent': 'MPat', 'm patent': 'MPat'
};

function normaliseParam(raw) {
  if (!raw) return null;
  const key = raw.toString().trim().toLowerCase().replace(/\s+/g, '');
  return PARAM_ABBR_MAP[key] || PARAM_ABBR_MAP[raw.toString().trim().toLowerCase()] || null;
}

function findCol(headers, keyword) {
  return headers.find(h => h && h.toString().toLowerCase().includes(keyword.toLowerCase()));
}

function parseNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? null : n;
}

// ── Parse sheet into TARGET / ACHIEVED / PCT per dept ────────────────────────
function buildMapsFromSheet(rows) {
  if (!rows || !rows.length) return null;
  const headers     = Object.keys(rows[0]);
  const deptCol     = findCol(headers, 'dept') || findCol(headers, 'department');
  const paramCol    = findCol(headers, 'param') || findCol(headers, 'parameter') || findCol(headers, 'category');
  const targetCol   = findCol(headers, 'target');
  const achievedCol = findCol(headers, 'achiev');
  const pctCol      = findCol(headers, '%') || findCol(headers, 'percent') ||
                      findCol(headers, 'achievement %') || findCol(headers, 'ach%');

  if (!deptCol || !paramCol) return null;

  const TARGET = {}, ACHIEVED = {}, PCT = {};

  rows.forEach(row => {
    const dept  = (row[deptCol] || '').toString().trim().toUpperCase();
    const param = normaliseParam(row[paramCol]);
    if (!dept || !param || !DEPARTMENTS.includes(dept)) return;

    TARGET[dept]   = TARGET[dept]   || {};
    ACHIEVED[dept] = ACHIEVED[dept] || {};
    PCT[dept]      = PCT[dept]      || {};

    if (targetCol)   TARGET[dept][param]   = parseNum(row[targetCol]);
    if (achievedCol) ACHIEVED[dept][param] = parseNum(row[achievedCol]);
    if (pctCol) {
      const pv = parseNum(row[pctCol]);
      PCT[dept][param] = pv !== null ? Math.round(pv) : null;
    } else if (targetCol && achievedCol) {
      const t = parseNum(row[targetCol]);
      const a = parseNum(row[achievedCol]);
      PCT[dept][param] = (t && t > 0) ? Math.round((a / t) * 100) : null;
    }
  });

  return { TARGET, ACHIEVED, PCT };
}

// ── Wide format parser (one row per dept) ─────────────────────────────────────
function buildMapsFromWideSheet(rows) {
  if (!rows || !rows.length) return null;
  const headers = Object.keys(rows[0]);
  const deptCol = findCol(headers, 'dept') || findCol(headers, 'department');
  if (!deptCol) return null;

  const TARGET = {}, ACHIEVED = {}, PCT = {};

  rows.forEach(row => {
    const dept = (row[deptCol] || '').toString().trim().toUpperCase();
    if (!dept || !DEPARTMENTS.includes(dept)) return;
    TARGET[dept]   = TARGET[dept]   || {};
    ACHIEVED[dept] = ACHIEVED[dept] || {};
    PCT[dept]      = PCT[dept]      || {};

    headers.forEach(h => {
      if (!h || h === deptCol) return;
      const hl = h.toString().toLowerCase().trim();
      for (const param of PARAMS) {
        const pl = param.toLowerCase();
        if (hl.includes(pl + '_target') || hl.includes(pl + ' target') ||
            hl.includes('target_' + pl) || hl.includes('target ' + pl)) {
          TARGET[dept][param] = parseNum(row[h]); return;
        }
        if (hl.includes(pl + '_achiev') || hl.includes(pl + ' achiev') ||
            hl.includes('achiev_' + pl) || hl.includes('achiev ' + pl)) {
          ACHIEVED[dept][param] = parseNum(row[h]); return;
        }
        if ((hl.includes(pl + '_%') || hl.includes(pl + ' %') || hl === pl) &&
            !hl.includes('target') && !hl.includes('achiev')) {
          const pv = parseNum(row[h]);
          PCT[dept][param] = pv !== null ? Math.round(pv) : null;
          return;
        }
      }
    });
  });

  return { TARGET, ACHIEVED, PCT };
}

// ── Shared live data (fetched once, reused across dept switches) ──────────────
let liveTarget   = null;
let liveAchieved = null;
let livePct      = null;

let radarChart = null;
let barChart   = null;
let currentDept = null;

// ── Render department using live data ────────────────────────────────────────
function renderDept(dept) {
  currentDept = dept;
  const info = DEPT_INFO[dept] || { faculty: '—', fullName: dept };
  const t = liveTarget[dept]   || {};
  const a = liveAchieved[dept] || {};
  const p = livePct[dept]      || {};

  // Overall % (average of R,C,P,I,E)
  const pcts  = [p.R, p.C, p.P, p.I, p.E].filter(v => v !== null && v !== undefined);
  const overall = pcts.length ? Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length) : 0;
  const ovClass = pctBadgeClass(overall);

  const container = document.getElementById('deptMainContent');
  container.innerHTML = `
    <!-- Header -->
    <div class="dept-header">
      <div class="dept-avatar" aria-hidden="true">${esc(dept.slice(0, 2))}</div>
      <div class="dept-info">
        <h2>${esc(dept)} — ${esc(info.fullName)}</h2>
        <p>Faculty: <strong>${info.faculty}</strong> &nbsp;|&nbsp; Overall Achievement: <span class="badge ${ovClass}" style="font-size:14px">${overall}%</span></p>
      </div>
    </div>

    <!-- Charts Row -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px" class="charts-row">
      <!-- Radar -->
      <div class="chart-card" style="margin-bottom:0">
        <h3>Target vs Achieved — Radar View</h3>
        <div class="chart-canvas-wrap" style="height:280px;position:relative">
          <canvas id="radarChart" aria-label="Radar chart comparing target and achieved values for ${esc(dept)}"></canvas>
        </div>
      </div>
      <!-- Bar -->
      <div class="chart-card" style="margin-bottom:0">
        <h3>Target vs Achieved — Bar Chart</h3>
        <div class="chart-canvas-wrap" style="height:280px;position:relative">
          <canvas id="barChart" aria-label="Bar chart comparing target and achieved values for each parameter in ${esc(dept)}"></canvas>
        </div>
      </div>
    </div>

    <!-- Pending Details Card -->
    <div class="chart-card">
      <h3>Pending Items Detail</h3>
      <div class="table-wrap">
        <table>
          <caption>Remaining targets for ${esc(dept)}. Negative values mean the target was exceeded.</caption>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Target</th>
              <th>Achieved</th>
              <th>Achievement %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="pendingBody"></tbody>
        </table>
      </div>
    </div>
  `;

  // Responsive charts on mobile
  if (window.innerWidth < 768) {
    container.querySelector('.charts-row').style.gridTemplateColumns = '1fr';
  }

  buildRadar(dept, t, a);
  buildBar(dept, t, a);
  buildPendingBody(dept, t, a, p);
}

// ── Radar Chart ───────────────────────────────────────────────────────────────
function buildRadar(dept, t, a) {
  if (radarChart) { radarChart.destroy(); radarChart = null; }

  const pctVals = PARAMS.map(k => {
    const tv = t[k] ?? 0;
    const av = a[k] ?? 0;
    if (tv === 0) return { target: 100, achieved: av === 0 ? 0 : 100 };
    return { target: 100, achieved: Math.round((av / tv) * 100) };
  });

  const ctx = document.getElementById('radarChart').getContext('2d');
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: PARAMS.map(k => PARAM_LABELS[k]),
      datasets: [
        {
          label: 'Target (100%)',
          data: pctVals.map(v => v.target),
          borderColor: 'rgba(180,180,180,0.9)',
          borderDash: [5, 4],
          borderWidth: 2,
          backgroundColor: 'rgba(180,180,180,0.1)',
          pointRadius: 3
        },
        {
          label: 'Achieved %',
          data: pctVals.map(v => Math.min(v.achieved, 200)),
          borderColor: '#1D9E75',
          borderWidth: 2.5,
          backgroundColor: 'rgba(30,158,117,0.2)',
          pointBackgroundColor: '#1D9E75',
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        r: {
          min: 0, max: 150,
          ticks: { stepSize: 50, font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,0.07)' },
          pointLabels: { font: { size: 11, weight: '600' } }
        }
      },
      plugins: {
        legend: { labels: { font: { size: 12 } } },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.r}%` } }
      }
    }
  });
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function buildBar(dept, t, a) {
  if (barChart) { barChart.destroy(); barChart = null; }

  const labels       = PARAMS.map(k => PARAM_LABELS[k]);
  const targetVals   = PARAMS.map(k => t[k] ?? 0);
  const achievedVals = PARAMS.map(k => a[k] ?? 0);

  const barColors = achievedVals.map((av, i) =>
    av >= targetVals[i] ? 'rgba(30,158,117,0.8)' : 'rgba(220,60,60,0.7)'
  );

  const ctx = document.getElementById('barChart').getContext('2d');
  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Target',
          data: targetVals,
          backgroundColor: 'rgba(180,180,180,0.4)',
          borderColor: 'rgba(140,140,140,0.7)',
          borderWidth: 1,
          borderRadius: 3
        },
        {
          label: 'Achieved',
          data: achievedVals,
          backgroundColor: barColors,
          borderRadius: 3
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { size: 12 } } },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.x}` } }
      },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 } } },
        y: { ticks: { font: { size: 11 } } }
      }
    }
  });
}

// ── Pending Body ──────────────────────────────────────────────────────────────
function buildPendingBody(dept, t, a, p) {
  const tbody = document.getElementById('pendingBody');
  let html = '';
  PARAMS.forEach(k => {
    const tv  = t[k] ?? 0;
    const av  = a[k] ?? 0;
    const pct = p[k];
    const diff = av - tv;
    const pctCls = pctClass(pct);
    let statusCell;
    if (diff >= 0) {
      statusCell = `<td><span class="badge badge-green">✓ Exceeded by ${Math.abs(diff).toFixed(2)}</span></td>`;
    } else {
      const magnitude = Math.abs(diff) > 2 ? 'badge-red' : 'badge-orange';
      statusCell = `<td><span class="badge ${magnitude}">⏳ Pending: ${Math.abs(diff).toFixed(2)}</span></td>`;
    }
    html += `<tr>
      <td><strong>${PARAM_LABELS[k]}</strong></td>
      <td>${tv.toFixed(2)}</td>
      <td>${av.toFixed(2)}</td>
      <td class="${pctCls}">${pct !== null && pct !== undefined ? pct + '%' : 'N/A'}</td>
      ${statusCell}
    </tr>`;
  });
  tbody.innerHTML = html;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function buildSidebar(selected) {
  const container = document.getElementById('sidebarBtns');
  const dropdown  = document.getElementById('deptDropdown');
  container.innerHTML = '';
  dropdown.innerHTML  = '';

  DEPARTMENTS.forEach(dept => {
    const btn = document.createElement('button');
    btn.className = `sidebar-btn${dept === selected ? ' active' : ''}`;
    btn.textContent = dept;
    btn.title = DEPT_INFO[dept]?.fullName || dept;
    btn.setAttribute('aria-label', `View ${DEPT_INFO[dept]?.fullName || dept}`);
    btn.addEventListener('click', () => selectDept(dept));
    container.appendChild(btn);

    const opt = document.createElement('option');
    opt.value = dept;
    opt.textContent = `${dept} — ${DEPT_INFO[dept]?.fullName || ''}`;
    if (dept === selected) opt.selected = true;
    dropdown.appendChild(opt);
  });

  dropdown.addEventListener('change', e => selectDept(e.target.value));
}

function selectDept(dept) {
  currentDept = dept;
  document.querySelectorAll('.sidebar-btn').forEach(b => {
    b.classList.toggle('active', b.textContent === dept);
  });
  const dd = document.getElementById('deptDropdown');
  if (dd) dd.value = dept;
  renderDept(dept);
}

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initNav('Departments');
  initFooter();

  const params   = new URLSearchParams(window.location.search);
  const initial  = params.get('dept') || 'ECE';
  const safeDept = DEPARTMENTS.includes(initial) ? initial : 'ECE';

  // Show loading state
  const container = document.getElementById('deptMainContent');
  if (container) {
    container.innerHTML = `
      <div class="spinner-overlay" role="status" aria-live="polite" style="min-height:300px">
        <div class="spinner" aria-hidden="true"></div>
        <span class="spinner-label">Loading department data from Google Sheets…</span>
      </div>`;
  }

  buildSidebar(safeDept);

  try {
    const rows = await fetchSheet(SHEET_NAMES.TARGETS);

    let maps = null;
    if (rows.length) maps = buildMapsFromSheet(rows);
    if (!maps && rows.length) maps = buildMapsFromWideSheet(rows);

    if (!maps) throw new Error('Could not parse sheet structure. Check column headers in "Tar. vs Ach." sheet.');

    liveTarget   = maps.TARGET;
    liveAchieved = maps.ACHIEVED;
    livePct      = maps.PCT;

    // Fill in missing depts with empty objects
    DEPARTMENTS.forEach(d => {
      liveTarget[d]   = liveTarget[d]   || {};
      liveAchieved[d] = liveAchieved[d] || {};
      livePct[d]      = livePct[d]      || {};
    });

    renderDept(safeDept);

  } catch (err) {
    console.error('Departments fetch error:', err);
    if (container) {
      container.innerHTML = `
        <div class="error-card" role="alert">
          <h3>⚠️ Unable to Load Data</h3>
          <p>${esc(err.message)}</p>
          <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="location.reload()">↺ Retry</button>
        </div>`;
    }
  }
});
