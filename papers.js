/* ═══════════════════════════════════════════════
   Papers JS – RCPIE Portal
   ═══════════════════════════════════════════════ */
'use strict';

const INDEXING_OPTS = ['All','Q1','Q2','Q3','Q4','Scopus','IEEE','Springer'];
let allPapers = [];
let filteredPapers = [];
let papersTable = null;

// ── Column keys from sheet ────────────────────
const COL = {
  sno:     'S.No.',
  faculty: 'Faculty Involved',
  dept:    'Department',
  journal: 'Name of the Journal / International conference',
  index:   'Q1/Q2 /Q3/Q4',
  wos:     'Is it Indexed on WoS',
  title:   'Title of the paper',
  month:   'Presented/published in the Month and Year (Sep/Oct/Nov/Dec/Jan/Feb)',
  coe:     'Specify the CoE name if it is under CoE'
};

// ── Build dept dropdown ───────────────────────
function buildDeptDropdown(rows) {
  const depts = [...new Set(rows.map(r => (r[COL.dept] || '').trim()).filter(Boolean))].sort();
  const sel = document.getElementById('deptFilter');
  depts.forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d;
    sel.appendChild(o);
  });
}

// ── Build indexing pills ──────────────────────
function buildIndexingPills() {
  const container = document.getElementById('indexingPills');
  container.innerHTML = '<span>Indexing:</span>';
  INDEXING_OPTS.forEach(opt => {
    const pill = document.createElement('button');
    pill.className = `pill${opt === 'All' ? ' active' : ''}`;
    pill.textContent = opt;
    pill.setAttribute('aria-pressed', opt === 'All');
    pill.addEventListener('click', () => {
      document.querySelectorAll('#indexingPills .pill').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed','false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-pressed','true');
      applyFilters();
    });
    container.appendChild(pill);
  });
}

// ── Is journal? ───────────────────────────────
function isJournal(row) {
  const idx = (row[COL.index] || '').trim();
  return /^Q[1-4]$/i.test(idx);
}

// ── Update summary counts ─────────────────────
function updateSummary(rows) {
  const journals = rows.filter(isJournal).length;
  const confs = rows.length - journals;
  document.getElementById('journalCount').textContent  = journals;
  document.getElementById('confCount').textContent = confs;
}

// ── Render table ──────────────────────────────
function renderTable(rows) {
  const wrap = document.getElementById('papersTableWrap');
  filteredPapers = rows;

  document.getElementById('paperCount').innerHTML =
    `Showing <strong>${rows.length}</strong> of <strong>${allPapers.length}</strong> papers`;

  if (!rows.length) {
    wrap.innerHTML = '<div class="no-data">No papers match your filters.</div>';
    return;
  }

  let tbodyHtml = '';
  rows.forEach((r, idx) => {
    const title = (r[COL.title] || '').trim();
    const shortTitle = title.length > 80 ? title.slice(0,80) + '…' : title;
    const dept = (r[COL.dept] || '').trim();
    const indexVal = (r[COL.index] || '').trim();
    const wos = (r[COL.wos] || '').trim();

    tbodyHtml += `
      <tr class="paper-row" style="cursor:pointer" data-idx="${idx}">
        <td data-label="#">${idx+1}</td>
        <td data-label="Faculty"><strong>${esc(r[COL.faculty] || '')}</strong></td>
        <td data-label="Dept"><span class="badge badge-gray">${esc(dept)}</span></td>
        <td data-label="Journal/Conference">${esc((r[COL.journal] || '').slice(0,60))}${(r[COL.journal]||'').length>60?'…':''}</td>
        <td data-label="Indexing">${indexVal ? `<span class="badge ${indexVal.startsWith('Q') ? 'badge-teal' : 'badge-blue'}">${esc(indexVal)}</span>` : '—'}</td>
        <td data-label="Title" class="text-clamp-1" data-tooltip="${esc(title)}">${esc(shortTitle)}</td>
        <td data-label="Month/Year">${esc(r[COL.month] || '—')}</td>
        <td data-label="CoE">${esc(r[COL.coe] || '—')}</td>
      </tr>
      <tr class="paper-expand" id="expand-${idx}" style="display:none">
        <td colspan="8" style="padding:12px 16px;background:var(--bg-subtle);border-top:none">
          <strong>Full Title:</strong> ${esc(title)}<br>
          <strong>WoS Indexed:</strong> ${esc(wos || 'No')}<br>
          <strong>Journal:</strong> ${esc(r[COL.journal] || '—')}
        </td>
      </tr>`;
  });

  wrap.innerHTML = `
    <table id="papersTable" class="mobile-card-table">
      <caption>Research papers published by CMR Institute of Technology faculty in AY 2023–24</caption>
      <thead>
        <tr>
          <th data-sort="0" style="width:40px">#</th>
          <th data-sort="1">Faculty</th>
          <th data-sort="2">Dept</th>
          <th data-sort="3">Journal / Conference</th>
          <th data-sort="4">Indexing</th>
          <th data-sort="5">Title</th>
          <th data-sort="6">Month/Year</th>
          <th data-sort="7">CoE</th>
        </tr>
      </thead>
      <tbody>${tbodyHtml}</tbody>
    </table>`;

  papersTable = document.getElementById('papersTable');
  initTableSort(papersTable);

  // Row expand on click
  wrap.querySelectorAll('.paper-row').forEach(row => {
    row.addEventListener('click', () => {
      const idx = row.dataset.idx;
      const expRow = document.getElementById(`expand-${idx}`);
      if (expRow) expRow.style.display = expRow.style.display === 'none' ? '' : 'none';
    });
  });
}

// ── Apply filters ─────────────────────────────
function applyFilters() {
  const search = document.getElementById('paperSearch').value.toLowerCase();
  const dept   = document.getElementById('deptFilter').value;
  const indexing = document.querySelector('#indexingPills .pill.active')?.textContent || 'All';

  const filtered = allPapers.filter(r => {
    const faculty = (r[COL.faculty] || '').toLowerCase();
    const title   = (r[COL.title] || '').toLowerCase();
    const rDept   = (r[COL.dept] || '').trim();
    const rIndex  = (r[COL.index] || '').trim();

    if (search && !faculty.includes(search) && !title.includes(search)) return false;
    if (dept && rDept !== dept) return false;
    if (indexing !== 'All' && !rIndex.toLowerCase().includes(indexing.toLowerCase())) return false;
    return true;
  });

  renderTable(filtered);
}

// ── Load data ─────────────────────────────────
async function loadPapers() {
  const wrap = document.getElementById('papersTableWrap');
  showSpinner(wrap);
  try {
    const rows = await fetchSheet(SHEET_NAMES.PAPERS);
    allPapers = rows;
    buildDeptDropdown(rows);
    buildIndexingPills();
    updateSummary(rows);
    renderTable(rows);

    document.getElementById('paperSearch').addEventListener('input', applyFilters);
    document.getElementById('deptFilter').addEventListener('change', applyFilters);

    document.getElementById('exportCsvBtn').addEventListener('click', () => {
      if (papersTable) exportTableCSV(papersTable, 'rcpie-papers.csv');
    });
  } catch(e) {
    console.error('Papers fetch error:', e);
    // Show placeholder table with info
    showError(wrap, 'Unable to load papers from Google Sheets. Please configure SCRIPT_URL in app.js and ensure the Apps Script is deployed.');
  }
}

// ── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav('Research Papers');
  initFooter();
  buildIndexingPills();

  // Populate depts from known list as fallback
  const sel = document.getElementById('deptFilter');
  DEPARTMENTS.forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d;
    sel.appendChild(o);
  });

  loadPapers();
});
