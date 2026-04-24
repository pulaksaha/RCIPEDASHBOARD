/* ═══════════════════════════════════════════════
   Dashboard JS – RCPIE Portal
   Live data from Google Sheets — no dummy data
   ═══════════════════════════════════════════════ */
'use strict';

// ── Parse the "Tar. vs Ach." sheet into structured maps ──────────────────────
// Expected columns (flexible matching):
//   Dept | Parameter | Target | Achieved | Achievement %
// Some sheets may use abbreviated param names (R, C, P, I, E, MP, MPat)
// or full names. We normalise them here.

const PARAM_ABBR_MAP = {
  'r': 'R', 'research': 'R',
  'c': 'C', 'consultancy': 'C',
  'p': 'P', 'patent': 'P', 'patents': 'P',
  'i': 'I', 'innovation': 'I', 'proposal': 'I', 'proposals': 'I', 'innovation/proposals': 'I',
  'e': 'E', 'entrepreneurship': 'E',
  'mp': 'MP', 'mandatory paper': 'MP', 'mandatorypaper': 'MP', 'm-paper': 'MP', 'm paper': 'MP',
  'mpat': 'MPat', 'mandatory patent': 'MPat', 'mandatorypatent': 'MPat', 'm-patent': 'MPat', 'm patent': 'MPat'
};

const PARAM_LABELS = {
  R: 'Research', C: 'Consultancy', P: 'Patents',
  I: 'Innovation/Proposals', E: 'Entrepreneurship',
  MP: 'Mandatory Paper', MPat: 'Mandatory Patent'
};

const PARAMS = ['R', 'C', 'P', 'I', 'E', 'MP', 'MPat'];

function normaliseParam(raw) {
  if (!raw) return null;
  const key = raw.toString().trim().toLowerCase().replace(/\s+/g, '');
  return PARAM_ABBR_MAP[key] || PARAM_ABBR_MAP[raw.toString().trim().toLowerCase()] || null;
}

// Detect which column contains a given keyword (case-insensitive)
function findCol(headers, keyword) {
  return headers.find(h => h && h.toString().toLowerCase().includes(keyword.toLowerCase()));
}

function parseNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? null : n;
}

// ── Build TARGET / ACHIEVED / PCT maps from sheet rows ───────────────────────
function buildMapsFromSheet(rows) {
  if (!rows || !rows.length) return null;

  // Detect column headers from the keys of the first row
  const headers = Object.keys(rows[0]);

  // Try to identify columns
  const deptCol   = findCol(headers, 'dept') || findCol(headers, 'department');
  const paramCol  = findCol(headers, 'param') || findCol(headers, 'parameter') || findCol(headers, 'category');
  const targetCol = findCol(headers, 'target');
  const achievedCol = findCol(headers, 'achiev');
  const pctCol    = findCol(headers, '%') || findCol(headers, 'percent') || findCol(headers, 'achievement %') || findCol(headers, 'ach%');

  if (!deptCol || !paramCol) return null; // Can't parse without dept + param

  const TARGET   = {};
  const ACHIEVED = {};
  const PCT      = {};

  rows.forEach(row => {
    const dept  = (row[deptCol] || '').toString().trim().toUpperCase();
    const param = normaliseParam(row[paramCol]);
    if (!dept || !param || !DEPARTMENTS.includes(dept)) return;

    if (!TARGET[dept])   TARGET[dept]   = {};
    if (!ACHIEVED[dept]) ACHIEVED[dept] = {};
    if (!PCT[dept])      PCT[dept]      = {};

    if (targetCol)   TARGET[dept][param]   = parseNum(row[targetCol]);
    if (achievedCol) ACHIEVED[dept][param] = parseNum(row[achievedCol]);
    if (pctCol) {
      const pRaw = parseNum(row[pctCol]);
      PCT[dept][param] = pRaw !== null ? Math.round(pRaw) : null;
    } else if (targetCol && achievedCol) {
      // Calculate % ourselves
      const t = parseNum(row[targetCol]);
      const a = parseNum(row[achievedCol]);
      PCT[dept][param] = (t && t > 0) ? Math.round((a / t) * 100) : null;
    }
  });

  return { TARGET, ACHIEVED, PCT };
}

// ── Alternative: parse if the sheet is a "wide" format (each param is a column) ──
// Columns: Dept | R_Target | R_Achieved | R_% | C_Target | C_Achieved | C_% …
function buildMapsFromWideSheet(rows) {
  if (!rows || !rows.length) return null;
  const headers = Object.keys(rows[0]);
  const deptCol = findCol(headers, 'dept') || findCol(headers, 'department');
  if (!deptCol) return null;

  // Check if there are separate Target/Achieved/% columns per param
  // or if columns are just param names mapping to pct values directly
  const TARGET   = {};
  const ACHIEVED = {};
  const PCT      = {};

  rows.forEach(row => {
    const dept = (row[deptCol] || '').toString().trim().toUpperCase();
    if (!dept || !DEPARTMENTS.includes(dept)) return;
    TARGET[dept]   = TARGET[dept]   || {};
    ACHIEVED[dept] = ACHIEVED[dept] || {};
    PCT[dept]      = PCT[dept]      || {};

    headers.forEach(h => {
      if (!h || h === deptCol) return;
      const hl = h.toString().toLowerCase().trim();

      // Match "R Target" / "R_target" / "Target_R" etc.
      for (const param of PARAMS) {
        const pl = param.toLowerCase();
        if (hl.includes(pl + '_target') || hl.includes(pl + ' target') ||
            hl.includes('target_' + pl) || hl.includes('target ' + pl)) {
          TARGET[dept][param] = parseNum(row[h]);
          return;
        }
        if (hl.includes(pl + '_achiev') || hl.includes(pl + ' achiev') ||
            hl.includes('achiev_' + pl) || hl.includes('achiev ' + pl)) {
          ACHIEVED[dept][param] = parseNum(row[h]);
          return;
        }
        if ((hl.includes(pl + '_%') || hl.includes(pl + ' %') ||
             hl === pl) && !hl.includes('target') && !hl.includes('achiev')) {
          const pv = parseNum(row[h]);
          PCT[dept][param] = pv !== null ? Math.round(pv) : null;
          return;
        }
      }
    });
  });

  return { TARGET, ACHIEVED, PCT };
}

// ── Compute PENDING (Target - Achieved) ──────────────────────────────────────
function buildPending(TARGET, ACHIEVED) {
  const PENDING = {};
  DEPARTMENTS.forEach(dept => {
    PENDING[dept] = {};
    PARAMS.forEach(param => {
      const t = TARGET[dept]?.[param] ?? null;
      const a = ACHIEVED[dept]?.[param] ?? null;
      if (t === null || a === null) {
        PENDING[dept][param] = null;
      } else {
        PENDING[dept][param] = parseFloat((t - a).toFixed(2));
      }
    });
  });
  return PENDING;
}

// ── Build Achievement Table ──────────────────────────────────────────────────
function buildDeptTable(PCT) {
  const wrap = document.getElementById('deptTableWrap');

  let rows = '';
  DEPARTMENTS.forEach(dept => {
    const p = PCT[dept] || {};
    const vals = [p.R, p.C, p.P, p.I, p.E].filter(v => v !== null && v !== undefined);
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;

    function cell(v) {
      if (v === null || v === undefined) return `<td class="pct-gray" style="background:var(--gray-bg);color:var(--gray-text)">N/A</td>`;
      const cls = pctClass(v);
      return `<td class="${cls}" data-label="${v}%">${v}%</td>`;
    }

    const overallCls = pctClass(avg);
    rows += `
      <tr>
        <td data-label="Dept"><a href="departments.html?dept=${dept}" style="font-weight:600;color:var(--brand-dark)">${esc(dept)}</a></td>
        ${cell(p.R)}${cell(p.C)}${cell(p.P)}${cell(p.I)}${cell(p.E)}${cell(p.MP)}${cell(p.MPat)}
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

// ── Build Pending Table ──────────────────────────────────────────────────────
function buildPendingTable(PENDING) {
  const wrap = document.getElementById('pendingTableWrap');

  function pendingCell(v, label) {
    if (v === null) return `<td data-label="${label}">—</td>`;
    if (v <= 0) {
      return `<td data-label="${label}"><span class="badge badge-green pending-exceeded" title="Target exceeded by ${Math.abs(v).toFixed(2)}">✓ Exceeded</span></td>`;
    }
    const magnitude = v > 2 ? 'pct-red' : 'pct-orange';
    return `<td class="${magnitude}" data-label="${label}"><span style="font-weight:700">${v.toFixed(2)}</span></td>`;
  }

  let rows = '';
  DEPARTMENTS.forEach(dept => {
    const d = PENDING[dept] || {};
    rows += `<tr>
      <td data-label="Dept"><strong>${esc(dept)}</strong></td>
      ${pendingCell(d.R,  'R Pending')}
      ${pendingCell(d.C,  'C Pending')}
      ${pendingCell(d.P,  'P Pending')}
      ${pendingCell(d.I,  'I Pending')}
      ${pendingCell(d.E,  'E Pending')}
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

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initNav('Dashboard');
  initFooter();

  const deptWrap    = document.getElementById('deptTableWrap');
  const pendingWrap = document.getElementById('pendingTableWrap');
  showSpinner(deptWrap,    'Loading achievement data…');
  showSpinner(pendingWrap, 'Loading pending data…');

  try {
    const rows = await fetchSheet(SHEET_NAMES.TARGETS);

    let maps = null;

    // Try long (row-per-param) format first
    if (rows.length) {
      maps = buildMapsFromSheet(rows);
    }

    // Fallback: try wide (one row per dept) format
    if (!maps && rows.length) {
      maps = buildMapsFromWideSheet(rows);
    }

    if (!maps) {
      throw new Error('Could not parse sheet structure. Check column headers in "Tar. vs Ach." sheet.');
    }

    const { TARGET, ACHIEVED, PCT } = maps;
    const PENDING = buildPending(TARGET, ACHIEVED);

    buildDeptTable(PCT);
    buildPendingTable(PENDING);

  } catch (err) {
    console.error('Dashboard fetch error:', err);
    showError(deptWrap,    `Unable to load achievement data: ${err.message}`);
    showError(pendingWrap, `Unable to load pending data: ${err.message}`);
  }
});
