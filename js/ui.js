// ============================================================
// ui.js — Renderização, eventos DOM, autocomplete, modal, paginação
// Depende de: search.js, charts.js, cboMap.js
// ============================================================

// ------------------------------------------------------------
// PAGINAÇÃO
// ------------------------------------------------------------
const PAGINA_SIZE = 50;
let paginaAtual  = 1;
let registrosAtuais = []; // todos os registros do filtro atual

function renderTable(records) {
  registrosAtuais = records || [];
  paginaAtual = 1;
  renderPagina();
}

function renderPagina() {
  const tbody   = document.getElementById('table-body');
  const countEl = document.getElementById('results-count');

  if (!tbody) { console.error('[ui] #table-body não encontrado'); return; }

  tbody.innerHTML = '';

  if (registrosAtuais.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <p>Nenhum município encontrado para essa busca.</p>
        </div>
      </td></tr>`;
    if (countEl) countEl.textContent = 'Nenhum resultado';
    renderControlesPaginacao(0);
    return;
  }

  const totalPaginas = Math.ceil(registrosAtuais.length / PAGINA_SIZE);
  paginaAtual = Math.max(1, Math.min(paginaAtual, totalPaginas));

  const inicio = (paginaAtual - 1) * PAGINA_SIZE;
  const fim    = Math.min(inicio + PAGINA_SIZE, registrosAtuais.length);
  const pagina = registrosAtuais.slice(inicio, fim);

  pagina.forEach(r => {
    const tr   = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td class="td-municipio">${r.municipio}</td>
      <td><span class="td-uf">${r.uf || '—'}</span></td>
      <td class="td-acidentes">${formatNumber(r.acidentes)}</td>
      <td class="td-fatalidades">${r.obitos ?? '—'}</td>
      <td class="td-periodo">${r.anos && r.anos.length ? r.anos[0] + '–' + r.anos[r.anos.length - 1] : '—'}</td>
    `;
    tr.addEventListener('click', () => openModal(r));
    tbody.appendChild(tr);
  });

  const total = window.municipiosAgregados ? window.municipiosAgregados.length : registrosAtuais.length;
  const filtrado = registrosAtuais.length < total ? ` de ${registrosAtuais.length} filtrados` : '';
  if (countEl) countEl.textContent =
    `Exibindo ${inicio + 1}–${fim} de ${total} municípios${filtrado}`;

  renderControlesPaginacao(totalPaginas);
  console.log(`[ui] página ${paginaAtual}/${totalPaginas} — ${pagina.length} linhas`);
}

function renderControlesPaginacao(totalPaginas) {
  let ctrl = document.getElementById('paginacao');
  if (!ctrl) {
    ctrl = document.createElement('div');
    ctrl.id = 'paginacao';
    ctrl.className = 'paginacao';
    document.querySelector('.table-wrapper').after(ctrl);
  }

  if (totalPaginas <= 1) { ctrl.innerHTML = ''; return; }

  const btnAnterior = `<button class="pag-btn" id="pag-anterior" ${paginaAtual === 1 ? 'disabled' : ''}>← Anterior</button>`;
  const btnProximo  = `<button class="pag-btn" id="pag-proximo"  ${paginaAtual === totalPaginas ? 'disabled' : ''}>Próximo →</button>`;
  const info        = `<span class="pag-info">Página ${paginaAtual} de ${totalPaginas}</span>`;
  ctrl.innerHTML    = btnAnterior + info + btnProximo;

  document.getElementById('pag-anterior').addEventListener('click', () => {
    if (paginaAtual > 1) { paginaAtual--; renderPagina(); window.scrollTo({ top: document.querySelector('.results-section').offsetTop - 80, behavior: 'smooth' }); }
  });
  document.getElementById('pag-proximo').addEventListener('click', () => {
    if (paginaAtual < totalPaginas) { paginaAtual++; renderPagina(); window.scrollTo({ top: document.querySelector('.results-section').offsetTop - 80, behavior: 'smooth' }); }
  });
}

// ------------------------------------------------------------
// CARDS DO HERO — atualiza com dados reais
// ------------------------------------------------------------
function atualizarCards(dadosNacionais) {
  const elTotal   = document.getElementById('stat-total');
  const elObitos  = document.getElementById('stat-obitos');
  const elPeriodo = document.getElementById('stat-periodo');

  if (elTotal)   elTotal.textContent   = formatNumber(dadosNacionais.totalRegistros);
  if (elObitos)  elObitos.textContent  = formatNumber(dadosNacionais.totalObitos);
  if (elPeriodo) elPeriodo.textContent = dadosNacionais.periodo;

  console.log('[ui] cards atualizados:', dadosNacionais.totalRegistros, dadosNacionais.totalObitos, dadosNacionais.periodo);
}

// ------------------------------------------------------------
// AUTOCOMPLETE
// ------------------------------------------------------------
let activeIndex = -1;

function initAutocomplete() {
  const input    = document.getElementById('search-input');
  const dropdown = document.getElementById('autocomplete-dropdown');
  const btn      = document.getElementById('search-btn');

  if (!input || !dropdown || !btn) {
    console.error('[ui] initAutocomplete: elemento não encontrado');
    return;
  }

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q) { closeDropdown(); return; }
    showDropdown(trie.searchPrefix(q), q);
  });

  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, items.length - 1); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); }
    else if (e.key === 'Enter')     { e.preventDefault(); activeIndex >= 0 ? selectItem(Number(items[activeIndex].dataset.idx)) : runSearch(); return; }
    else if (e.key === 'Escape')    { closeDropdown(); return; }
    items.forEach((item, i) => item.classList.toggle('active', i === activeIndex));
  });

  btn.addEventListener('click', runSearch);
  document.addEventListener('click', (e) => { if (!e.target.closest('.search-wrapper')) closeDropdown(); });
  console.log('[ui] initAutocomplete: ok');
}

function showDropdown(indices, query) {
  const dropdown = document.getElementById('autocomplete-dropdown');
  dropdown.innerHTML = '';
  activeIndex = -1;

  if (!indices.length) { closeDropdown(); return; }

  const vistos = new Set();
  const itens  = [];
  for (const idx of indices) {
    const bruto = heap.getByIndex(idx);
    if (!bruto || vistos.has(bruto.municipio)) continue;
    vistos.add(bruto.municipio);
    itens.push({ idx, municipio: bruto.municipio, uf: bruto.uf });
    if (itens.length >= 6) break;
  }

  itens.forEach(({ idx, municipio, uf }) => {
    const norm      = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    const mStart    = norm(municipio).indexOf(norm(query));
    let highlighted = municipio;
    if (mStart !== -1) {
      highlighted = municipio.slice(0, mStart) +
        `<em>${municipio.slice(mStart, mStart + query.length)}</em>` +
        municipio.slice(mStart + query.length);
    }
    const item = document.createElement('div');
    item.className   = 'autocomplete-item';
    item.dataset.idx = idx;
    item.innerHTML   = `<span class="autocomplete-item-name">${highlighted}</span><span class="autocomplete-item-uf">${uf || ''}</span>`;
    item.addEventListener('mousedown', (e) => { e.preventDefault(); selectItem(idx); });
    dropdown.appendChild(item);
  });

  dropdown.classList.add('visible');
}

function selectItem(idx) {
  const bruto    = heap.getByIndex(idx);
  if (!bruto) return;
  const agregado = (window.municipiosAgregados || []).find(m => m.municipio === bruto.municipio) || bruto;
  document.getElementById('search-input').value = agregado.municipio;
  closeDropdown();
  renderTable([agregado]);
}

function closeDropdown() {
  const el = document.getElementById('autocomplete-dropdown');
  if (el) el.classList.remove('visible');
  activeIndex = -1;
}

function runSearch() {
  closeDropdown();
  const q = document.getElementById('search-input').value.trim();
  console.log(`[ui] runSearch: "${q}"`);
  renderTable(searchByMunicipio(q));
}

// ------------------------------------------------------------
// MODAL DA CIDADE
// ------------------------------------------------------------
function openModal(record) {
  console.log('[ui] openModal:', record.municipio);
  const overlay = document.getElementById('modal-overlay');

  document.getElementById('modal-title').textContent       = record.municipio;
  document.getElementById('modal-uf').textContent          = record.uf || '—';
  document.getElementById('modal-acidentes').textContent   = formatNumber(record.acidentes);
  document.getElementById('modal-fatalidades').textContent = record.obitos ?? '—';
  // Usa o nome legível da profissão (getCboNome já foi aplicado na agregação)
  document.getElementById('modal-profissao').textContent   = record.profissaoNome || record.profissaoMaisAfetada || '—';

  overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    const canvas = document.getElementById('modal-chart');
    if (record.evolucao?.length && record.anos?.length) {
      drawLineChart(canvas, record.evolucao, record.anos);
    } else {
      console.warn('[ui] openModal: sem dados de evolução para', record.municipio);
    }
  });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('visible');
  document.body.style.overflow = '';
}

function initModal() {
  const overlay  = document.getElementById('modal-overlay');
  const btnClose = document.getElementById('modal-close');
  if (!overlay || !btnClose) { console.error('[ui] initModal: elemento não encontrado'); return; }
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  btnClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  console.log('[ui] initModal: ok');
}

// ------------------------------------------------------------
// LOADING
// ------------------------------------------------------------
function showLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.add('visible');
}

function updateLoading(msg) {
  const el = document.getElementById('loading-message');
  if (el) el.textContent = msg;
}

function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.remove('visible');
}

// ------------------------------------------------------------
// GRÁFICOS NACIONAIS
// ------------------------------------------------------------
function initCharts(topCBOs, faixas) {
  const canvasProfissoes = document.getElementById('chart-profissoes');
  const canvasFaixa      = document.getElementById('chart-faixa');
  if (!canvasProfissoes || !canvasFaixa) { console.error('[ui] initCharts: canvas não encontrado'); return; }
  if (!topCBOs?.length) { console.warn('[ui] initCharts: topCBOs vazio'); return; }
  if (!faixas?.length)  { console.warn('[ui] initCharts: faixas vazio');  return; }

  function draw() {
    drawBarChart(canvasProfissoes, topCBOs, '#f59e0b');
    drawBarChart(canvasFaixa,      faixas,  '#60a5fa');
  }
  draw();
  initChartResize(draw);
  console.log('[ui] initCharts: ok');
}
