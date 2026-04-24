/* ═══════════════════════════════════════════════
   RCPIE Portal – Shared App Logic
   CMR Institute of Technology · AY 2023–24
   ═══════════════════════════════════════════════ */

'use strict';

// ── CONFIG ──────────────────────────────────────
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzkd6QyspXOEzADfVnKBLCwktuFqMGUiJSJKGCZX_c7LrkpxCA5jLwMMjUv8ZUjxYG87Q/exec';

const SHEET_NAMES = {
  TARGETS: 'Tar. vs Ach.',
  CONSOLIDATED: 'Consolidated Sheet',
  PROPOSALS: 'Proposal',
  PAPERS: 'Journal PaperConference paper',
  PATENTS: 'Patent',
  CONSULTANCY: 'Consultancy',
  ENTREPRENEURSHIP: 'Entrepreneurship'
};

const DEPARTMENTS = ['ECE','CSE','ISE','EEE','CHE','PHY','AIML','AIDS','MAT','MCA','MBA','CV','ME'];

// ── CACHE ────────────────────────────────────────
function cacheKey(sheet) { return `rcpie_cache_${sheet}`; }

function getCached(sheet) {
  try {
    const raw = sessionStorage.getItem(cacheKey(sheet));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function setCache(sheet, data) {
  try {
    sessionStorage.setItem(cacheKey(sheet), JSON.stringify(data));
  } catch { /* quota exceeded — ignore */ }
}

// ── FETCH ────────────────────────────────────────
async function fetchSheet(sheetName) {
  const cached = getCached(sheetName);
  if (cached) return cached;

  const url = `${SCRIPT_URL}?sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const rows = json.rows || [];
  setCache(sheetName, rows);
  return rows;
}

// ── SPINNER / ERROR HELPERS ───────────────────────
function showSpinner(container, message = 'Loading data…') {
  container.innerHTML = `
    <div class="spinner-overlay" role="status" aria-live="polite">
      <div class="spinner" aria-hidden="true"></div>
      <span class="spinner-label">${message}</span>
    </div>`;
}

function showError(container, message = 'Data temporarily unavailable. Please refresh or contact IT support.') {
  container.innerHTML = `
    <div class="error-card" role="alert">
      <h3>⚠️ Unable to Load Data</h3>
      <p>${message}</p>
      <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="location.reload()">
        ↺ Retry
      </button>
    </div>`;
}

// ── COLOR HELPERS ─────────────────────────────────
function pctClass(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return '';
  if (pct >= 100) return 'pct-green';
  if (pct >= 80)  return 'pct-amber';
  if (pct >= 60)  return 'pct-orange';
  return 'pct-red';
}

function pctBadgeClass(pct) {
  if (pct === null || isNaN(pct)) return 'badge-gray';
  if (pct >= 100) return 'badge-green';
  if (pct >= 80)  return 'badge-amber';
  if (pct >= 60)  return 'badge-orange';
  return 'badge-red';
}

function statusBadgeClass(status) {
  if (!status) return 'badge-gray';
  const s = status.toLowerCase();
  if (s.includes('sanction') || s.includes('approv') || s.includes('grant')) return 'badge-green';
  if (s.includes('submit')) return 'badge-blue';
  if (s.includes('process') || s.includes('review')) return 'badge-amber';
  if (s.includes('reject')) return 'badge-red';
  if (s.includes('publish')) return 'badge-teal';
  if (s.includes('filed') || s.includes('not filed')) return 'badge-gray';
  return 'badge-gray';
}

function patentStatusBadgeClass(status) {
  if (!status) return 'badge-gray';
  const s = status.toLowerCase();
  if (s.includes('grant')) return 'badge-green';
  if (s.includes('publish')) return 'badge-teal';
  if (s === 'filed' || s.includes('filed') && !s.includes('not')) return 'badge-blue';
  if (s.includes('not filed')) return 'badge-gray';
  return 'badge-gray';
}

// ── CURRENCY FORMATTING ───────────────────────────
function parseAmount(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  let s = String(raw).replace(/Rs\.?|₹/gi, '').replace(/\s/g, '').replace(/,/g, '');
  const lMatch = s.match(/^([\d.]+)\s*L$/i);
  if (lMatch) return parseFloat(lMatch[1]) * 100000;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function formatINR(amount, raw) {
  if (amount === null) return raw || '—';
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount > 0) return `₹${amount.toLocaleString('en-IN')}`;
  return '₹0';
}

// ── TABLE SORT ────────────────────────────────────
function initTableSort(table) {
  const headers = table.querySelectorAll('th[data-sort]');
  headers.forEach(th => {
    th.addEventListener('click', () => {
      const col = parseInt(th.dataset.sort);
      const asc = th.classList.contains('sort-asc');
      headers.forEach(h => h.classList.remove('sort-asc','sort-desc'));
      th.classList.add(asc ? 'sort-desc' : 'sort-asc');
      sortTable(table, col, !asc);
    });
  });
}

function sortTable(table, colIdx, asc) {
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a, b) => {
    const av = a.cells[colIdx]?.textContent.trim() || '';
    const bv = b.cells[colIdx]?.textContent.trim() || '';
    const an = parseFloat(av.replace(/[^0-9.-]/g,''));
    const bn = parseFloat(bv.replace(/[^0-9.-]/g,''));
    if (!isNaN(an) && !isNaN(bn)) return asc ? an - bn : bn - an;
    return asc ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  rows.forEach(r => tbody.appendChild(r));
}

// ── EXPORT CSV ────────────────────────────────────
function exportTableCSV(table, filename = 'rcpie-export.csv') {
  const rows = [];
  const headers = Array.from(table.querySelectorAll('thead th')).map(th => `"${th.textContent.trim()}"`);
  rows.push(headers.join(','));
  table.querySelectorAll('tbody tr').forEach(tr => {
    if (tr.style.display === 'none') return;
    const cells = Array.from(tr.querySelectorAll('td')).map(td => `"${td.textContent.trim().replace(/"/g,'""')}"`);
    rows.push(cells.join(','));
  });
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── NAV BAR ───────────────────────────────────────
function initNav(activePage) {
  const pages = [
    { name: 'Dashboard',       href: 'index.html' },
    { name: 'Departments',     href: 'departments.html' },
    { name: 'Research Papers', href: 'papers.html' },
    { name: 'Patents',         href: 'patents.html' },
    { name: 'Funding',         href: 'funding.html' },
    { name: 'Finance',         href: 'finance.html' },
  ];

  const nav = document.getElementById('navbar');
  if (!nav) return;

  const links = pages.map(p =>
    `<a href="${p.href}" aria-label="Navigate to ${p.name}" class="${p.name === activePage ? 'active' : ''}">${p.name}</a>`
  ).join('');

  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  nav.innerHTML = `
    <div class="nav-inner">
      <div class="nav-crest" aria-label="CMR Institute of Technology crest">CMR</div>
      <div class="nav-title">RCPIE <span>Portal</span></div>
      <nav class="nav-links" aria-label="Main navigation">${links}</nav>
      <div class="nav-meta" aria-live="polite">Last refreshed: ${now}</div>
      <button class="nav-hamburger" id="navHamburger" aria-label="Toggle navigation menu" aria-expanded="false">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="nav-mobile-menu" id="navMobileMenu" aria-label="Mobile navigation">
      ${pages.map(p =>
        `<a href="${p.href}" class="${p.name === activePage ? 'active' : ''}">${p.name}</a>`
      ).join('')}
    </div>`;

  document.getElementById('navHamburger')?.addEventListener('click', () => {
    const menu = document.getElementById('navMobileMenu');
    const btn  = document.getElementById('navHamburger');
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
}

// ── FOOTER ────────────────────────────────────────
function initFooter() {
  const f = document.getElementById('footer');
  if (!f) return;
  f.innerHTML = `
    <strong>RCPIE Portal</strong> · CMR Institute of Technology · AY 2023–24 ·
    Data sourced live from Google Sheets`;
}

// ── UTILITY ───────────────────────────────────────
function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function pctDisplay(v) {
  if (v === 'NA' || v === null || v === undefined) return 'N/A';
  return `${v}%`;
}
