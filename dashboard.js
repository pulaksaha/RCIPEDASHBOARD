/* ═══════════════════════════════════════════════
   Dashboard JS – RCPIE Portal
   ═══════════════════════════════════════════════ */
'use strict';

// ── Static data embedded (mirror of live sheet) ──────────────
const DEPT_DATA = {
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

const PENDING_DATA = {
  ECE:  { R:-4.44, C:-0.89, P:-0.60, I:-0.84, E:0.67  },
  CSE:  { R:-0.01, C:3.36,  P:0.51,  I:0.38,  E:0.65  },
  ISE:  { R:0.71,  C:2.01,  P:0.23,  I:0.45,  E:1.07  },
  EEE:  { R:0.96,  C:2.71,  P:-0.02, I:-0.46, E:0.04  },
  CHE:  { R:4.15,  C:2.33,  P:-0.15, I:0.44,  E:0.60  },
  PHY:  { R:5.14,  C:2.46,  P:0.19,  I:1.96,  E:0.70  },
  AIML: { R:4.65,  C:1.77,  P:1.75,  I:0.94,  E:1.52  },
  AIDS: { R:3.15,  C:1.16,  P:0.94,  I:0.54,  E:0.48  },
  MAT:  { R:1.62,  C:2.31,  P:1.05,  I:0.08,  E:0.57  },
  MCA:  { R:1.63,  C:-0.28, P:-0.31, I:0.43,  E:0.18  },
  MBA:  { R:15.11, C:0.45,  P:0.70,  I:0.39,  E:0.72  },
  CV:   { R:2.49,  C:0.49,  P:0.00,  I:1.37,  E:0.22  },
  ME:   { R:2.44,  C:2.04,  P:0.36,  I:0.35,  E:0.64  }
};

// ── Build Achievement Table ──────────────────────
function buildDeptTable() {
  const wrap = document.getElementById('deptTableWrap');
  const depts = Object.keys(DEPT_DATA);

  let rows = '';
  depts.forEach(dept => {
    const d = DEPT_DATA[dept];
    const vals = [d.R, d.C, d.P, d.I, d.E].filter(v => v !== null);
    const avg = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;

    function cell(v) {
      if (v === null || v === undefined) return `<td class="pct-gray" style="background:var(--gray-bg);color:var(--gray-text)">N/A</td>`;
      const cls = pctClass(v);
      return `<td class="${cls}" data-label="${v}%">${v}%</td>`;
    }

    const overallCls = pctClass(avg);
    rows += `
      <tr>
        <td data-label="Dept"><a href="departments.html?dept=${dept}" style="font-weight:600;color:var(--brand-dark)">${esc(dept)}</a></td>
        ${cell(d.R)}${cell(d.C)}${cell(d.P)}${cell(d.I)}${cell(d.E)}${cell(d.MP)}${cell(d.MPat)}
        <td class="${overallCls}" style="font-weight:700" data-label="Overall">${avg}%</td>
      </tr>`;
  });

  wrap.innerHTML = `
    <table id="deptTable" class="mobile-card-table">
      <caption>Department-wise achievement percentages across 5 core parameters</caption>
      <thead>
        <tr>
          <th data-sort="0">Dept</th>
          <th data-sort="1">R%</th>
          <th data-sort="2">C%</th>
          <th data-sort="3">P%</th>
          <th data-sort="4">I%</th>
          <th data-sort="5">E%</th>
          <th data-sort="6">M-Paper%</th>
          <th data-sort="7">M-Patent%</th>
          <th data-sort="8">Overall</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  initTableSort(document.getElementById('deptTable'));
}

// ── Build Pending Table ──────────────────────────
function buildPendingTable() {
  const wrap = document.getElementById('pendingTableWrap');
  const depts = Object.keys(PENDING_DATA);

  function pendingCell(v, label) {
    if (v < 0) {
      return `<td data-label="${label}"><span class="badge badge-green pending-exceeded" title="Target exceeded by ${Math.abs(v).toFixed(2)}">✓ Exceeded</span></td>`;
    }
    const magnitude = v > 2 ? 'pct-red' : 'pct-orange';
    return `<td class="${magnitude}" data-label="${label}"><span style="font-weight:700">${v.toFixed(2)}</span></td>`;
  }

  let rows = '';
  depts.forEach(dept => {
    const d = PENDING_DATA[dept];
    rows += `<tr>
      <td data-label="Dept"><strong>${esc(dept)}</strong></td>
      ${pendingCell(d.R,'R Pending')}
      ${pendingCell(d.C,'C Pending')}
      ${pendingCell(d.P,'P Pending')}
      ${pendingCell(d.I,'I Pending')}
      ${pendingCell(d.E,'E Pending')}
    </tr>`;
  });

  wrap.innerHTML = `
    <table id="pendingTable" class="mobile-card-table">
      <caption>Remaining targets per department. Green = target exceeded, color intensity reflects magnitude of pending amount.</caption>
      <thead>
        <tr>
          <th data-sort="0">Dept</th>
          <th data-sort="1">R Pending</th>
          <th data-sort="2">C Pending</th>
          <th data-sort="3">P Pending</th>
          <th data-sort="4">I Pending</th>
          <th data-sort="5">E Pending</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  initTableSort(document.getElementById('pendingTable'));
}

// ── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav('Dashboard');
  initFooter();
  buildDeptTable();
  buildPendingTable();
});
