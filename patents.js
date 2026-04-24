/* ═══════════════════════════════════════════════
   Patents JS – RCPIE Portal
   ═══════════════════════════════════════════════ */
'use strict';

const PATENT_COL = {
  sno:       'Sl. No.',
  appNo:     'Patent Application No.',
  status:    'Status of Patent (Published / Granted)',
  inventors: 'Inventor/s Name',
  dept:      'Department',
  title:     'Title of the Patent',
  applicant: 'Applicant/s Name',
  filedDate: 'Patent Filed Date (DD/MM/YYYY)',
  pubDate:   'Patent Published Date / Granted Date (DD/MM/YYYY)',
  proof:     'Here, attach Source Proof Screenshots/URL/ Website Links, etc.'
};

const STATUS_OPTS = ['All','Published','Filed','Granted','Not Filed'];

let allPatents = [];

// ── Build status pills ─────────────────────────
function buildStatusPills() {
  const container = document.getElementById('patentStatusPills');
  STATUS_OPTS.forEach(opt => {
    const pill = document.createElement('button');
    pill.className = `pill${opt === 'All' ? ' active' : ''}`;
    pill.textContent = opt;
    pill.setAttribute('aria-pressed', opt === 'All');
    pill.addEventListener('click', () => {
      document.querySelectorAll('#patentStatusPills .pill').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed','false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-pressed','true');
      applyPatentFilters();
    });
    container.appendChild(pill);
  });
}

// ── Build dept dropdown ───────────────────────
function buildPatentDeptDropdown(rows) {
  const depts = [...new Set(rows.map(r => (r[PATENT_COL.dept] || '').trim()).filter(Boolean))].sort();
  const sel = document.getElementById('patentDeptFilter');
  sel.innerHTML = '<option value="">All Departments</option>';
  depts.forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d;
    sel.appendChild(o);
  });
}

// ── Update counts ─────────────────────────────
function updatePatentCounts(rows) {
  const pub     = rows.filter(r => (r[PATENT_COL.status]||'').toLowerCase().includes('publish')).length;
  const granted = rows.filter(r => (r[PATENT_COL.status]||'').toLowerCase().includes('grant')).length;
  const filed   = rows.filter(r => {
    const s = (r[PATENT_COL.status]||'').toLowerCase();
    return s.includes('filed') && !s.includes('not filed') && !s.includes('grant') && !s.includes('publish');
  }).length;

  document.getElementById('pubCount').textContent     = pub;
  document.getElementById('grantedCount').textContent = granted;
  document.getElementById('filedCount').textContent   = filed;
}

// ── Render cards ──────────────────────────────
function renderPatentCards(rows) {
  const grid = document.getElementById('patentGrid');
  document.getElementById('patentCount').innerHTML =
    `Showing <strong>${rows.length}</strong> of <strong>${allPatents.length}</strong> patents`;

  if (!rows.length) {
    grid.innerHTML = '<div class="no-data" style="grid-column:1/-1">No patents match your filters.</div>';
    return;
  }

  grid.innerHTML = rows.map(r => {
    const status    = (r[PATENT_COL.status] || 'Filed').trim();
    const title     = (r[PATENT_COL.title] || 'Untitled Patent').trim();
    const inventors = (r[PATENT_COL.inventors] || '').trim();
    const dept      = (r[PATENT_COL.dept] || '').trim();
    const appNo     = (r[PATENT_COL.appNo] || '').trim();
    const filedDate = (r[PATENT_COL.filedDate] || '—').trim();
    const pubDate   = (r[PATENT_COL.pubDate] || '—').trim();
    const proof     = (r[PATENT_COL.proof] || '').trim();
    const hasProof  = proof.startsWith('http');

    const badgeCls = patentStatusBadgeClass(status);

    return `
      <article class="patent-card" aria-label="Patent: ${esc(title)}">
        <div class="patent-card-header">
          <div>
            <div class="patent-app-no">${esc(appNo) || 'App # —'}</div>
          </div>
          <span class="badge ${badgeCls}" aria-label="Status: ${esc(status)}">${esc(status)}</span>
        </div>
        <div class="patent-title" title="${esc(title)}">${esc(title)}</div>
        <div class="patent-inventors" title="${esc(inventors)}">👤 ${esc(inventors) || '—'}</div>
        <div>
          <span class="badge badge-gray">${esc(dept) || 'N/A'}</span>
        </div>
        <div class="patent-dates">
          <div>
            <span>Filed Date</span>
            <strong>${esc(filedDate)}</strong>
          </div>
          <div>
            <span>Published / Granted</span>
            <strong>${esc(pubDate)}</strong>
          </div>
        </div>
        <div class="patent-footer">
          ${hasProof
            ? `<button class="btn-proof" onclick="window.open('${esc(proof)}','_blank')" aria-label="View proof for ${esc(title)}">🔗 View Proof</button>`
            : '<span></span>'}
        </div>
      </article>`;
  }).join('');
}

// ── Apply filters ─────────────────────────────
function applyPatentFilters() {
  const search = document.getElementById('patentSearch').value.toLowerCase();
  const dept   = document.getElementById('patentDeptFilter').value;
  const status = document.querySelector('#patentStatusPills .pill.active')?.textContent || 'All';

  const filtered = allPatents.filter(r => {
    const inv   = (r[PATENT_COL.inventors] || '').toLowerCase();
    const title = (r[PATENT_COL.title] || '').toLowerCase();
    const rDept = (r[PATENT_COL.dept] || '').trim();
    const rStat = (r[PATENT_COL.status] || '').trim();

    if (search && !inv.includes(search) && !title.includes(search)) return false;
    if (dept && rDept !== dept) return false;
    if (status !== 'All') {
      const sl = rStat.toLowerCase();
      if (status === 'Published' && !sl.includes('publish')) return false;
      if (status === 'Granted'   && !sl.includes('grant'))   return false;
      if (status === 'Filed'     && !(sl.includes('filed') && !sl.includes('not filed') && !sl.includes('grant') && !sl.includes('publish'))) return false;
      if (status === 'Not Filed' && !sl.includes('not filed')) return false;
    }
    return true;
  });

  renderPatentCards(filtered);
}

// ── Load patents ──────────────────────────────
async function loadPatents() {
  const grid = document.getElementById('patentGrid');
  grid.innerHTML = '<div class="spinner-overlay" style="grid-column:1/-1"><div class="spinner"></div><span class="spinner-label">Loading…</span></div>';

  try {
    const rows = await fetchSheet(SHEET_NAMES.PATENTS);
    allPatents = rows;
    buildPatentDeptDropdown(rows);
    updatePatentCounts(rows);
    renderPatentCards(rows);

    document.getElementById('patentSearch').addEventListener('input', applyPatentFilters);
    document.getElementById('patentDeptFilter').addEventListener('change', applyPatentFilters);
  } catch(e) {
    console.error('Patents fetch error:', e);
    grid.innerHTML = `
      <div style="grid-column:1/-1">
        <div class="error-card" role="alert">
          <h3>⚠️ Unable to Load Patents</h3>
          <p>Data temporarily unavailable. Please configure SCRIPT_URL in app.js and ensure the Apps Script is deployed.</p>
          <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="location.reload()">↺ Retry</button>
        </div>
      </div>`;
  }
}

// ── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav('Patents');
  initFooter();
  buildStatusPills();

  // Pre-populate dept dropdown
  const sel = document.getElementById('patentDeptFilter');
  DEPARTMENTS.forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d;
    sel.appendChild(o);
  });

  loadPatents();
});
