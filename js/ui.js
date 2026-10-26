// ============================================================
// ui.js - Renderização, eventos DOM, autocomplete, modal, paginação
// ============================================================

// Paginação
const PAGE_SIZE = 10;
let currentPage = 1;
let currentRows = [];

function renderTable(rows) {
  currentRows = rows || [];
  currentPage = 1;
  renderPage();
}

function renderPage() {
  const tbody   = document.getElementById('table-body');
  const countEl = document.getElementById('results-count');

  if (!tbody) { console.error('[ui] #table-body não encontrado'); return; }

  tbody.innerHTML = '';

  if (currentRows.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <p>Nenhum município encontrado para essa busca.</p>
        </div>
      </td></tr>`;
    if (countEl) countEl.textContent = 'Nenhum resultado';
    renderPagination(0);
    return;
  }

  const totalPages = Math.ceil(currentRows.length / PAGE_SIZE);
  currentPage = Math.max(1, Math.min(currentPage, totalPages));

  const start = (currentPage - 1) * PAGE_SIZE;
  const end   = Math.min(start + PAGE_SIZE, currentRows.length);
  const page  = currentRows.slice(start, end);

  page.forEach(row => {
    const years = row.years;
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td class="td-municipio">${row.city}</td>
      <td><span class="td-uf">${row.state || '-'}</span></td>
      <td class="td-acidentes">${formatNumber(row.accidents)}</td>
      <td class="td-fatalidades">${row.deaths ?? '-'}</td>
      <td class="td-periodo">${years && years.length ? years[0] + '–' + years[years.length - 1] : '-'}</td>
    `;
    tr.addEventListener('click', () => openModal(row));
    tbody.appendChild(tr);
  });

  const total    = aggregatedCities.length || currentRows.length;
  const filtered = currentRows.length < total ? ` de ${currentRows.length} filtrados` : '';
  if (countEl) countEl.textContent = `Exibindo ${start + 1}–${end} de ${total} municípios${filtered}`;

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  let container = document.getElementById('paginacao');
  if (!container) {
    container = document.createElement('div');
    container.id = 'paginacao';
    container.className = 'paginacao';
    document.querySelector('.table-wrapper').after(container);
  }

  if (totalPages <= 1) { container.innerHTML = ''; return; }

  const prevBtn = `<button class="pag-btn" id="pag-anterior" ${currentPage === 1 ? 'disabled' : ''}>← Anterior</button>`;
  const nextBtn = `<button class="pag-btn" id="pag-proximo"  ${currentPage === totalPages ? 'disabled' : ''}>Próximo →</button>`;
  const info    = `<span class="pag-info">Página ${currentPage} de ${totalPages}</span>`;
  container.innerHTML = prevBtn + info + nextBtn;

  // Muda de página e rola até o topo da tabela
  const goToPage = (page) => {
    currentPage = page;
    renderPage();
    window.scrollTo({ top: document.querySelector('.results-section').offsetTop - 80, behavior: 'smooth' });
  };

  document.getElementById('pag-anterior').addEventListener('click', () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  });
  document.getElementById('pag-proximo').addEventListener('click', () => {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  });
}

function updateStatCards(nationalData) {
  const total  = document.getElementById('stat-total');
  const deaths = document.getElementById('stat-obitos');
  const period = document.getElementById('stat-periodo');

  if (total)  total.textContent  = formatNumber(nationalData.totalRecords);
  if (deaths) deaths.textContent = formatNumber(nationalData.totalDeaths);
  if (period) period.textContent = nationalData.period;
}

// ------------------------------------------------------------
// Autocomplete (busca por prefixo na Trie)
// ------------------------------------------------------------
const MAX_SUGGESTIONS = 6;
let activeIndex = -1;

function initAutocomplete() {
  const input    = document.getElementById('search-input');
  const dropdown = document.getElementById('autocomplete-dropdown');
  const button   = document.getElementById('search-btn');

  if (!input || !dropdown || !button) {
    console.error('[ui] initAutocomplete: elemento não encontrado');
    return;
  }

  input.addEventListener('input', () => {
    const query = input.value.trim();
    if (!query) { closeDropdown(); return; }
    showDropdown(trie.searchPrefix(query), query);
  });

  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown')    { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, items.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); }
    else if (e.key === 'Enter')   { e.preventDefault(); activeIndex >= 0 ? selectSuggestion(Number(items[activeIndex].dataset.idx)) : runSearch(); return; }
    else if (e.key === 'Escape')  { closeDropdown(); return; }
    items.forEach((item, i) => item.classList.toggle('active', i === activeIndex));
  });

  button.addEventListener('click', runSearch);
  document.addEventListener('click', (e) => { if (!e.target.closest('.search-wrapper')) closeDropdown(); });
}

function showDropdown(indices, query) {
  const dropdown = document.getElementById('autocomplete-dropdown');
  dropdown.innerHTML = '';
  activeIndex = -1;

  if (!indices.length) { closeDropdown(); return; }

  // A Trie retorna um índice por registro: mantém apenas um por município
  const seen  = new Set();
  const items = [];
  for (const index of indices) {
    const raw = heap.getByIndex(index);
    if (!raw || seen.has(raw.city)) continue;
    seen.add(raw.city);
    items.push({ index, city: raw.city, state: raw.state });
    if (items.length >= MAX_SUGGESTIONS) break;
  }

  const normalizedQuery = normalizeText(query);

  items.forEach(({ index, city, state }) => {
    // Destaca o trecho digitado (comparação sem acentos)
    const matchStart = normalizeText(city).indexOf(normalizedQuery);
    let highlighted  = city;
    if (matchStart !== -1) {
      highlighted = city.slice(0, matchStart) +
        `<em>${city.slice(matchStart, matchStart + query.length)}</em>` +
        city.slice(matchStart + query.length);
    }
    const item = document.createElement('div');
    item.className   = 'autocomplete-item';
    item.dataset.idx = index;
    item.innerHTML   = `<span class="autocomplete-item-name">${highlighted}</span><span class="autocomplete-item-uf">${state || ''}</span>`;
    item.addEventListener('mousedown', (e) => { e.preventDefault(); selectSuggestion(index); });
    dropdown.appendChild(item);
  });

  dropdown.classList.add('visible');
}

function selectSuggestion(heapIndex) {
  const raw = heap.getByIndex(heapIndex);
  if (!raw) return;
  const aggregated = aggregatedCities.find(c => c.city === raw.city);
  if (!aggregated) return; // cidade sem registros no período selecionado
  document.getElementById('search-input').value = aggregated.city;
  closeDropdown();
  renderTable([aggregated]);
}

function closeDropdown() {
  const el = document.getElementById('autocomplete-dropdown');
  if (el) el.classList.remove('visible');
  activeIndex = -1;
}

function runSearch() {
  closeDropdown();
  const query = document.getElementById('search-input').value.trim();
  renderTable(searchByCity(query));
}

// ------------------------------------------------------------
// Modal da cidade
// ------------------------------------------------------------
function openModal(row) {
  const overlay = document.getElementById('modal-overlay');

  document.getElementById('modal-title').textContent       = row.city;
  document.getElementById('modal-uf').textContent          = row.state || '-';
  document.getElementById('modal-acidentes').textContent   = formatNumber(row.accidents);
  document.getElementById('modal-fatalidades').textContent = row.deaths ?? '-';
  document.getElementById('modal-profissao').textContent   = row.topOccupationName || '-';

  const chartTitle = document.getElementById('modal-chart-title');
  if (chartTitle) {
    chartTitle.textContent = `Evolução anual de acidentes (${formatPeriodLabel(selectedPeriod.start, selectedPeriod.end)})`;
  }

  overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';

  // Desenha após o modal estar visível, para o canvas já ter dimensões
  requestAnimationFrame(() => {
    const canvas = document.getElementById('modal-chart');
    if (row.periodCounts?.length) {
      drawLineChart(canvas, row.periodCounts, row.periodYears);
    } else {
      console.warn('[ui] openModal: sem dados de evolução para', row.city);
    }
  });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('visible');
  document.body.style.overflow = '';
}

function initAboutModal() {
  const overlay  = document.getElementById('modal-sobre-overlay');
  const openBtn  = document.getElementById('btn-sobre');
  const closeBtn = document.getElementById('modal-sobre-close');
  if (!overlay || !openBtn || !closeBtn) return;

  const close = () => {
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  };

  openBtn.addEventListener('click', () => {
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  });
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

function initModals() {
  const overlay  = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close');
  if (!overlay || !closeBtn) { console.error('[ui] initModals: elemento não encontrado'); return; }
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  initAboutModal();
}

// ------------------------------------------------------------
// Tela de carregamento
// ------------------------------------------------------------
function showLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.add('visible');
}

function updateLoading(message) {
  const el = document.getElementById('loading-message');
  if (el) el.textContent = message;
}

function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.remove('visible');
}

// ------------------------------------------------------------
// Gráficos principais
// ------------------------------------------------------------
let redrawCharts       = null;
let resizeListenerSet  = false;

function renderCharts(topOccupations, ageGroups, maxOccupation = null, maxAgeGroup = null) {
  const occupationCanvas = document.getElementById('chart-profissoes');
  const ageGroupCanvas   = document.getElementById('chart-faixa');
  if (!occupationCanvas || !ageGroupCanvas) { console.error('[ui] renderCharts: canvas não encontrado'); return; }
  if (!topOccupations?.length) { console.warn('[ui] renderCharts: topOccupations vazio'); return; }
  if (!ageGroups?.length)      { console.warn('[ui] renderCharts: ageGroups vazio');      return; }

  function draw() {
    drawBarChart(occupationCanvas, topOccupations, '#f59e0b', maxOccupation);
    drawVerticalBarChart(ageGroupCanvas, ageGroups, '#60a5fa', maxAgeGroup);
  }
  draw();

  // Guarda o desenho mais recente; o listener de resize é registrado uma única vez
  redrawCharts = draw;
  if (!resizeListenerSet) {
    initChartResize(() => redrawCharts && redrawCharts());
    resizeListenerSet = true;
  }
}
