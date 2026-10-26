// ============================================================
// main.js - Estado da aplicação, filtros de período e inicialização
// ============================================================

// Ano atual do sistema (ex: 2026), capturado uma única vez
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR     = 2022;

// Período atualmente exibido (inclusivo). Padrão: apenas o ano atual
let selectedPeriod = { start: CURRENT_YEAR, end: CURRENT_YEAR };

// Resultado das agregações do período selecionado (lido por search.js e ui.js)
let aggregatedCities = [];
let nationalData     = null;

// Maior valor já exibido em cada gráfico: mantém a mesma escala entre filtros,
// para que um período menor apareça visualmente menor
let maxOccupationValue = 0;
let maxAgeGroupValue   = 0;

// 1. Atualização visual completa do dashboard
function refreshDashboard() {
  updateLoading('Processando agregações e ordenando...');

  const { start, end } = selectedPeriod;

  // Agrega e ordena os dados do Heap filtrando pelo período selecionado
  aggregatedCities = quickSortCities(Array.from(aggregateByCity(start, end).values()));
  nationalData     = aggregateNational(start, end);

  updateStatCards(nationalData);
  renderTable(aggregatedCities);

  // Escala "high-water mark": só cresce
  const { topOccupations, ageGroups } = nationalData;
  maxOccupationValue = Math.max(maxOccupationValue, ...topOccupations.map(d => d.value));
  maxAgeGroupValue   = Math.max(maxAgeGroupValue,   ...ageGroups.map(d => d.value));

  renderCharts(topOccupations, ageGroups, maxOccupationValue, maxAgeGroupValue);

  // Se o campo de busca tiver algo, reaplica a busca sobre os novos dados
  const searchInput = document.getElementById('search-input');
  if (searchInput && searchInput.value.trim() !== '') runSearch();

  hideLoading();
}

// 2. Filtros de período
// Carrega (se necessário) os CSVs do intervalo e redesenha o dashboard
function applyPeriod(start, end) {
  selectedPeriod = { start, end };
  document.dispatchEvent(new Event('period-changed'));

  showLoading();
  updateLoading('Verificando dados necessários...');

  // setTimeout permite que a tela de carregamento seja pintada antes do processamento
  setTimeout(async () => {
    try {
      const label = formatPeriodLabel(start, end);
      await loadPeriod(start, end, (file, total) => {
        updateLoading(`Processando registros de ${label}... (${total.toLocaleString('pt-BR')})`);
      });

      // Sempre atualiza: mesmo sem CSV novo, as agregações mudam com o filtro
      refreshDashboard();

    } catch (error) {
      console.error('[main] Erro ao carregar período:', error);
      hideLoading();
    }
  }, 50);
}

// Marca visualmente qual controle está ativo (botão de atalho OU seletor personalizado)
function setActiveControl(element) {
  document.querySelectorAll('.period-btn.active, .period-custom.active')
    .forEach(el => el.classList.remove('active'));
  element?.classList.add('active');
}

function initPeriodFilters() {
  const buttons     = document.querySelectorAll('.period-btn');
  const custom      = document.getElementById('period-custom');
  const startSelect = document.getElementById('period-start');
  const endSelect   = document.getElementById('period-end');
  const applyButton = document.getElementById('period-apply');

  // Atalhos: do ano do botão até o ano atual
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      if (button.classList.contains('active')) return;

      const start = parseInt(button.dataset.period, 10);
      setActiveControl(button);

      // Mantém o seletor personalizado sincronizado com o atalho escolhido
      if (startSelect && endSelect) {
        startSelect.value = start;
        endSelect.value   = CURRENT_YEAR;
      }

      applyPeriod(start, CURRENT_YEAR);
    });
  });

  if (!custom || !startSelect || !endSelect) return;

  // Popula os anos disponíveis (MIN_YEAR até o ano atual)
  for (let year = MIN_YEAR; year <= CURRENT_YEAR; year++) {
    startSelect.add(new Option(year, year));
    endSelect.add(new Option(year, year));
  }
  startSelect.value = selectedPeriod.start;
  endSelect.value   = selectedPeriod.end;

  // Seletor personalizado: alterar o ano apenas "prepara" o período.
  // O filtro só é aplicado ao clicar em "Aplicar".

  // Habilita o botão somente se a seleção difere do período atualmente exibido
  const updateApplyButton = () => {
    if (!applyButton) return;
    applyButton.disabled =
      parseInt(startSelect.value, 10) === selectedPeriod.start &&
      parseInt(endSelect.value, 10)   === selectedPeriod.end;
  };

  // Garante início <= fim ajustando o outro campo
  const onSelectChange = (changed) => {
    const start = parseInt(startSelect.value, 10);
    const end   = parseInt(endSelect.value, 10);

    if (start > end) {
      if (changed === 'start') endSelect.value   = start;
      else                     startSelect.value = end;
    }
    updateApplyButton();
  };

  startSelect.addEventListener('change', () => onSelectChange('start'));
  endSelect.addEventListener('change',   () => onSelectChange('end'));

  applyButton?.addEventListener('click', () => {
    setActiveControl(custom);
    applyPeriod(parseInt(startSelect.value, 10), parseInt(endSelect.value, 10));
  });

  // Reavalia o estado do botão sempre que o período ativo mudar (atalho ou aplicar)
  document.addEventListener('period-changed', updateApplyButton);
  updateApplyButton();
}

// 3. Fluxo de inicialização principal
async function init() {
  initModals();
  initAutocomplete();
  initPeriodFilters();

  showLoading();
  updateLoading(`Iniciando sistema com dados de ${CURRENT_YEAR}...`);

  try {
    // Carga inicial: apenas o ano atual (os demais são carregados sob demanda pelo filtro)
    const newRecords = await loadPeriod(CURRENT_YEAR, CURRENT_YEAR, (file, total) => {
      updateLoading(`Carregando a base de dados... (${total.toLocaleString('pt-BR')})`);
    });

    console.log(`[main] Carga inicial concluída: ${newRecords} novos registros.`);

    // Garante que o botão do ano atual inicie destacado
    setActiveControl(document.querySelector(`.period-btn[data-period="${CURRENT_YEAR}"]`));

    // Só depois que os dados estão na memória, desenhamos a tela
    refreshDashboard();

  } catch (err) {
    console.error('[main] Erro crítico na carga inicial:', err);
    hideLoading();
  }
}

init();
