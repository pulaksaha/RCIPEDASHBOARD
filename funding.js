/* ═══════════════════════════════════════════════
   Funding JS – RCPIE Portal
   ═══════════════════════════════════════════════ */
'use strict';

const PROP_COL = {
  sno:        'S.No.',
  dept:       'Dept.',
  faculty:    'Name of Faculty',
  propAmt:    'Proposal Amount Submitted',
  date:       'Date of Submission (DD-MM-YYYY)',
  appId:      'Application ID',
  agency:     'Agency Name',
  agencyType: 'Agency Type',
  status:     'Current status',
  sanctioned: 'Sanctioned Amount',
  received:   'Amount Received',
  remarks:    'Remarks'
};

const FUNDING_STATUS_OPTS = ['All','Sanctioned','Submitted','In-Process','Rejected','Under Review','Approved'];

let allProposals = [];
let agencyChart  = null;

// ── Status pills ──────────────────────────────
function buildFundingStatusPills() {
  const c = document.getElementById('fundingStatusPills');
  FUNDING_STATUS_OPTS.forEach(opt => {
    const pill = document.createElement('button');
    pill.className = `pill${opt === 'All' ? ' active' : ''}`;
    pill.textContent = opt;
    pill.setAttribute('aria-pressed', opt === 'All');
    pill.addEventListener('click', () => {
      document.querySelectorAll('#fundingStatusPills .pill').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed','false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-pressed','true');
      applyFundingFilters();
    });
    c.appendChild(pill);
  });
}

// ── Build dept dropdown ───────────────────────
function buildFundingDeptDropdown(rows) {
  const depts = [...new Set(rows.map(r => (r[PROP_COL.dept] || '').trim()).filter(Boolean))].sort();
  const sel   = document.getElementById('fundingDeptFilter');
  sel.innerHTML = '<option value="">All Departments</option>';
  depts.forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d;
    sel.appendChild(o);
  });
}

// ── Update summary counts ─────────────────────
function updateFundingSummary(rows) {
  const pending = rows.filter(r => {
    const s = (r[PROP_COL.status] || '').toLowerCase();
    return s.includes('process') || s.includes('review') || s.includes('submit');
  }).length;
  document.getElementById('pendingReviewCount').textContent = pending;
}

// ── Render table ──────────────────────────────
function renderFundingTable(rows) {
  const wrap = document.getElementById('fundingTableWrap');
  document.getElementById('fundingCount').innerHTML =
    `Showing <strong>${rows.length}</strong> of <strong>${allProposals.length}</strong> proposals`;

  if (!rows.length) {
    wrap.innerHTML = '<div class="no-data">No proposals match your filters.</div>';
    return;
  }

  let tbodyHtml = '';
  rows.forEach((r, idx) => {
    const status   = (r[PROP_COL.status] || '').trim();
    const badgeCls = statusBadgeClass(status);

    const propRaw  = r[PROP_COL.propAmt];
    const sanctRaw = r[PROP_COL.sanctioned];
    const recvRaw  = r[PROP_COL.received];
    const propAmt  = parseAmount(propRaw);
    const sanctAmt = parseAmount(sanctRaw);
    const recvAmt  = parseAmount(recvRaw);

    tbodyHtml += `
      <tr>
        <td data-label="#">${idx+1}</td>
        <td data-label="Dept"><span class="badge badge-gray">${esc(r[PROP_COL.dept] || '—')}</span></td>
        <td data-label="Faculty"><strong>${esc(r[PROP_COL.faculty] || '—')}</strong></td>
        <td data-label="Proposal Amount" style="font-weight:700">${formatINR(propAmt, propRaw)}</td>
        <td data-label="Agency">${esc(r[PROP_COL.agency] || '—')}</td>
        <td data-label="Agency Type">${esc(r[PROP_COL.agencyType] || '—')}</td>
        <td data-label="Status"><span class="badge ${badgeCls}" aria-label="Status: ${esc(status)}">${esc(status) || '—'}</span></td>
        <td data-label="Sanctioned" style="font-weight:700">${sanctAmt !== null ? formatINR(sanctAmt, sanctRaw) : '—'}</td>
        <td data-label="Received">${recvAmt !== null ? formatINR(recvAmt, recvRaw) : '—'}</td>
      </tr>`;
  });

  wrap.innerHTML = `
    <table id="fundingTable" class="mobile-card-table">
      <caption>Research funding proposals submitted by CMR Institute of Technology faculty</caption>
      <thead>
        <tr>
          <th data-sort="0" style="width:40px">#</th>
          <th data-sort="1">Dept</th>
          <th data-sort="2">Faculty</th>
          <th data-sort="3">Proposal Amt</th>
          <th data-sort="4">Agency</th>
          <th data-sort="5">Agency Type</th>
          <th data-sort="6">Status</th>
          <th data-sort="7">Sanctioned</th>
          <th data-sort="8">Received</th>
        </tr>
      </thead>
      <tbody>${tbodyHtml}</tbody>
    </table>`;
  initTableSort(document.getElementById('fundingTable'));
}

// ── Apply filters ─────────────────────────────
function applyFundingFilters() {
  const search = document.getElementById('fundingSearch').value.toLowerCase();
  const dept   = document.getElementById('fundingDeptFilter').value;
  const aType  = document.getElementById('agencyTypeFilter').value;
  const status = document.querySelector('#fundingStatusPills .pill.active')?.textContent || 'All';

  const filtered = allProposals.filter(r => {
    const faculty = (r[PROP_COL.faculty] || '').toLowerCase();
    const agency  = (r[PROP_COL.agency] || '').toLowerCase();
    const rDept   = (r[PROP_COL.dept] || '').trim();
    const rAType  = (r[PROP_COL.agencyType] || '').trim();
    const rStatus = (r[PROP_COL.status] || '').trim().toLowerCase();

    if (search && !faculty.includes(search) && !agency.includes(search)) return false;
    if (dept && rDept !== dept) return false;
    if (aType && rAType !== aType) return false;
    if (status !== 'All' && !rStatus.includes(status.toLowerCase())) return false;
    return true;
  });

  renderFundingTable(filtered);
}

// ── Agency chart ──────────────────────────────
function buildAgencyChart(rows) {
  const counts = {};
  rows.forEach(r => {
    const at = (r[PROP_COL.agencyType] || 'Other').trim();
    counts[at] = (counts[at] || 0) + 1;
  });

  const labels = Object.keys(counts).sort((a,b) => counts[b]-counts[a]);
  const data   = labels.map(l => counts[l]);

  if (agencyChart) agencyChart.destroy();
  const ctx = document.getElementById('agencyChart').getContext('2d');
  agencyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Proposals',
        data,
        backgroundColor: 'rgba(30,158,117,0.75)',
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} proposals` } }
      },
      scales: {
        x: { ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
        y: { ticks: { font: { size: 12 } } }
      }
    }
  });
}

// ── Load data ─────────────────────────────────
async function loadFunding() {
  const wrap = document.getElementById('fundingTableWrap');
  showSpinner(wrap);
  try {
    const rows = await fetchSheet(SHEET_NAMES.PROPOSALS);
    allProposals = rows;
    buildFundingDeptDropdown(rows);
    updateFundingSummary(rows);
    renderFundingTable(rows);
    buildAgencyChart(rows);

    document.getElementById('fundingSearch').addEventListener('input', applyFundingFilters);
    document.getElementById('fundingDeptFilter').addEventListener('change', applyFundingFilters);
    document.getElementById('agencyTypeFilter').addEventListener('change', applyFundingFilters);
  } catch(e) {
    console.error('Funding fetch error:', e);
    showError(wrap, 'Unable to load funding proposals. Please configure SCRIPT_URL in app.js.');
  }
}

// ── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav('Funding');
  initFooter();
  buildFundingStatusPills();

  DEPARTMENTS.forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d;
    document.getElementById('fundingDeptFilter').appendChild(o);
  });

  loadFunding();
});
