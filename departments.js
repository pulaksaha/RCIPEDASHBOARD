/* ═══════════════════════════════════════════════
   Departments JS – RCPIE Portal
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

const TARGET = {
  ECE:  { R:20.81, C:6.9,  P:2.86, I:2.68, E:1.8,  MP:40.42, MPat:36.47 },
  CSE:  { R:13.57, C:4.2,  P:2.37, I:1.04, E:1.48, MP:29.4,  MPat:27.4  },
  ISE:  { R:9.29,  C:3.39, P:1.81, I:1.13, E:1.28, MP:22.72, MPat:21.72 },
  EEE:  { R:2.84,  C:3.26, P:0.58, I:0.99, E:0.65, MP:11.0,  MPat:10.25 },
  CHE:  { R:5.24,  C:2.36, P:0.7,  I:0.89, E:0.67, MP:12.0,  MPat:11.0  },
  PHY:  { R:7.64,  C:2.46, P:0.59, I:2.5,  E:0.71, MP:14.33, MPat:9.33  },
  AIML: { R:5.4,   C:1.8,  P:1.8,  I:1.27, E:1.52, MP:11.27, MPat:10.27 },
  AIDS: { R:6.15,  C:1.16, P:0.99, I:0.87, E:0.48, MP:9.15,  MPat:9.25  },
  MAT:  { R:6.87,  C:2.9,  P:1.25, I:0.41, E:0.58, MP:13.46, MPat:16.46 },
  MCA:  { R:9.38,  C:1.31, P:1.09, I:3.74, E:0.53, MP:11.5,  MPat:10.5  },
  MBA:  { R:21.06, C:0.86, P:1.0,  I:2.05, E:0.72, MP:18.58, MPat:20.33 },
  CV:   { R:3.24,  C:0.49, P:0.0,  I:1.37, E:0.22, MP:6.58,  MPat:7.58  },
  ME:   { R:6.94,  C:2.39, P:0.91, I:0.68, E:0.75, MP:18.78, MPat:17.78 }
};

const ACHIEVED = {
  ECE:  { R:25.25, C:7.79, P:3.46, I:3.52, E:1.14, MP:34.5,  MPat:34.5  },
  CSE:  { R:13.58, C:0.84, P:1.86, I:0.66, E:0.83, MP:22.5,  MPat:18.5  },
  ISE:  { R:8.59,  C:1.38, P:1.58, I:0.68, E:0.21, MP:15.37, MPat:18.0  },
  EEE:  { R:1.88,  C:0.55, P:0.6,  I:1.45, E:0.61, MP:7.5,   MPat:9.0   },
  CHE:  { R:1.09,  C:0.03, P:0.85, I:0.45, E:0.07, MP:4.33,  MPat:8.0   },
  PHY:  { R:2.5,   C:0.0,  P:0.4,  I:0.54, E:0.01, MP:4.0,   MPat:6.0   },
  AIML: { R:0.75,  C:0.03, P:0.05, I:0.33, E:0.0,  MP:2.5,   MPat:5.0   },
  AIDS: { R:3.0,   C:0.0,  P:0.05, I:0.33, E:0.0,  MP:3.0,   MPat:1.0   },
  MAT:  { R:5.25,  C:0.59, P:0.2,  I:0.33, E:0.01, MP:11.82, MPat:15.5  },
  MCA:  { R:7.75,  C:1.59, P:1.4,  I:3.31, E:0.35, MP:7.5,   MPat:11.0  },
  MBA:  { R:5.95,  C:0.41, P:0.3,  I:1.66, E:0.0,  MP:12.0,  MPat:5.0   },
  CV:   { R:0.75,  C:0.0,  P:0.0,  I:0.0,  E:0.0,  MP:2.0,   MPat:2.0   },
  ME:   { R:4.5,   C:0.35, P:0.55, I:0.33, E:0.11, MP:6.0,   MPat:7.0   }
};

const PCT = {
  ECE:  { R:121, C:113, P:121, I:131, E:63,  MP:85,  MPat:95  },
  CSE:  { R:100, C:20,  P:78,  I:63,  E:56,  MP:77,  MPat:68  },
  ISE:  { R:92,  C:41,  P:87,  I:60,  E:16,  MP:68,  MPat:83  },
  EEE:  { R:66,  C:17,  P:103, I:146, E:93,  MP:68,  MPat:88  },
  CHE:  { R:21,  C:1,   P:121, I:51,  E:11,  MP:36,  MPat:73  },
  PHY:  { R:33,  C:0,   P:68,  I:22,  E:2,   MP:28,  MPat:64  },
  AIML: { R:14,  C:2,   P:3,   I:26,  E:0,   MP:22,  MPat:49  },
  AIDS: { R:49,  C:0,   P:5,   I:38,  E:0,   MP:33,  MPat:11  },
  MAT:  { R:76,  C:20,  P:16,  I:80,  E:2,   MP:88,  MPat:94  },
  MCA:  { R:83,  C:121, P:128, I:89,  E:66,  MP:65,  MPat:105 },
  MBA:  { R:28,  C:48,  P:30,  I:81,  E:0,   MP:65,  MPat:25  },
  CV:   { R:23,  C:0,   P:null,I:0,   E:0,   MP:30,  MPat:26  },
  ME:   { R:65,  C:15,  P:60,  I:49,  E:14,  MP:32,  MPat:39  }
};

const PARAMS = ['R','C','P','I','E','MP','MPat'];
const PARAM_LABELS = {
  R:'Research', C:'Consultancy', P:'Patents',
  I:'Innovation/Proposals', E:'Entrepreneurship',
  MP:'Mandatory Paper', MPat:'Mandatory Patent'
};

let radarChart = null;
let barChart   = null;
let currentDept = null;

// ── Render department ──────────────────────────
function renderDept(dept) {
  currentDept = dept;
  const info = DEPT_INFO[dept];
  const t = TARGET[dept];
  const a = ACHIEVED[dept];
  const p = PCT[dept];

  // Overall %
  const pcts = [p.R, p.C, p.P, p.I, p.E].filter(v => v !== null && v !== undefined);
  const overall = Math.round(pcts.reduce((s,v) => s+v, 0) / pcts.length);
  const ovClass = pctBadgeClass(overall);

  const container = document.getElementById('deptMainContent');
  container.innerHTML = `
    <!-- Header -->
    <div class="dept-header">
      <div class="dept-avatar" aria-hidden="true">${esc(dept.slice(0,2))}</div>
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

  // Responsive radar/bar height on mobile
  const charts = container.querySelector('.charts-row');
  if (window.innerWidth < 768) {
    charts.style.gridTemplateColumns = '1fr';
  }

  buildRadar(dept, t, a);
  buildBar(dept, t, a);
  buildPendingBody(dept, t, a, p);
}

function buildRadar(dept, t, a) {
  if (radarChart) { radarChart.destroy(); radarChart = null; }

  // Normalize to percentage of max for radar (use % values)
  const pctVals = PARAMS.map(k => {
    const tv = t[k] || 0;
    const av = a[k] || 0;
    if (tv === 0) return { target: 100, achieved: av === 0 ? 0 : 100 };
    return { target: 100, achieved: Math.round((av/tv)*100) };
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
          borderDash: [5,4],
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
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.r}%`
          }
        }
      }
    }
  });
}

function buildBar(dept, t, a) {
  if (barChart) { barChart.destroy(); barChart = null; }

  const labels = PARAMS.map(k => PARAM_LABELS[k]);
  const targetVals   = PARAMS.map(k => t[k] || 0);
  const achievedVals = PARAMS.map(k => a[k] || 0);

  const barColors = achievedVals.map((av, i) => {
    const tv = targetVals[i];
    return av >= tv ? 'rgba(30,158,117,0.8)' : 'rgba(220,60,60,0.7)';
  });

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
        tooltip: {
          callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.x}` }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 } } },
        y: { ticks: { font: { size: 11 } } }
      }
    }
  });
}

function buildPendingBody(dept, t, a, p) {
  const tbody = document.getElementById('pendingBody');
  let html = '';
  PARAMS.forEach(k => {
    const tv = t[k] || 0;
    const av = a[k] || 0;
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
      <td class="${pctCls}">${pct !== null && pct !== undefined ? pct+'%' : 'N/A'}</td>
      ${statusCell}
    </tr>`;
  });
  tbody.innerHTML = html;
}

// ── Sidebar ───────────────────────────────────
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
  // Update active state
  document.querySelectorAll('.sidebar-btn').forEach(b => {
    b.classList.toggle('active', b.textContent === dept);
  });
  const dd = document.getElementById('deptDropdown');
  if (dd) dd.value = dept;
  renderDept(dept);
}

// ── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav('Departments');
  initFooter();

  // Read ?dept= param
  const params = new URLSearchParams(window.location.search);
  const initial = params.get('dept') || 'ECE';
  const safeDept = DEPARTMENTS.includes(initial) ? initial : 'ECE';

  buildSidebar(safeDept);
  renderDept(safeDept);
});
