// Captura o ano atual do sistema (ex: 2026) uma única vez no topo do arquivo
const ANO_ATUAL = new Date().getFullYear();

let globalMaxProfissao = 0;
let globalMaxFaixa = 0;

// Período atualmente exibido (inclusivo). Padrão: apenas o ano atual
const ANO_MIN = 2022;
let periodoSelecionado = { inicio: ANO_ATUAL, fim: ANO_ATUAL };

// 1. Função Mestre de Atualização Visual
function atualizarDashboard() {
  updateLoading('Processando agregações e ordenando...');
  
  const { inicio: anoInicio, fim: anoFim } = periodoSelecionado;

  // Agrega e ordena os dados do Heap filtrando pelo período selecionado
  const municipios = Array.from(agregaPorMunicipio(anoInicio, anoFim).values());
  window.municipiosAgregados = quickSortMunicipios(municipios);
  window.dadosNacionais      = agregaNacional(anoInicio, anoFim);

  // Manda a UI se desenhar de novo
  atualizarCards(window.dadosNacionais);
  renderTable(window.municipiosAgregados);

  if (window.dadosNacionais.topCBOs.length > 0) {
    const currentMaxProfissao = Math.max(...window.dadosNacionais.topCBOs.map(d => d.valor), 0);
    if (currentMaxProfissao > globalMaxProfissao) {
      globalMaxProfissao = currentMaxProfissao;
    }
    
    const currentMaxFaixa = Math.max(...window.dadosNacionais.faixas.map(d => d.valor), 0);
    if (currentMaxFaixa > globalMaxFaixa) {
      globalMaxFaixa = currentMaxFaixa;
    }
  }

  initCharts(window.dadosNacionais.topCBOs, window.dadosNacionais.faixas, globalMaxProfissao, globalMaxFaixa);
  
  // Se o campo de busca tiver algo, precisamos atualizar a busca
  const searchInput = document.getElementById('search-input');
  if (searchInput && searchInput.value.trim() !== '') {
    // Chama runSearch se a função estiver global, ou simula o clique do botão
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) searchBtn.click();
  }

  hideLoading();
}

// 2. Configuração dos Filtros de Período
// Carrega (se necessário) os CSVs do intervalo e redesenha o dashboard
function aplicarPeriodo(inicio, fim) {
  periodoSelecionado = { inicio, fim };
  document.dispatchEvent(new Event('periodo-alterado'));

  showLoading();
  updateLoading('Verificando dados necessários...');

  setTimeout(async () => {
    try {
      const rotulo = inicio === fim ? `${inicio}` : `${inicio}–${fim}`;
      await loadPeriod(inicio, fim, (arquivo, total) => {
        updateLoading(`Processando registros de ${rotulo}... (${total.toLocaleString('pt-BR')})`);
      });

      // Sempre atualiza o dashboard, pois o filtro mudou e precisamos recalcular as agregações (mesmo que não tenha carregado CSV novo)
      atualizarDashboard();

    } catch (error) {
      console.error('[main] Erro ao carregar período:', error);
      hideLoading();
    }
  }, 50);
}

// Marca visualmente qual controle está ativo (botões de atalho OU seletor personalizado)
function marcarControleAtivo(elemento) {
  document.querySelectorAll('.period-btn.active, .period-custom.active')
    .forEach(el => el.classList.remove('active'));
  elemento?.classList.add('active');
}

function initFiltros() {
  const botoes      = document.querySelectorAll('.period-btn');
  const custom      = document.getElementById('period-custom');
  const selectIni   = document.getElementById('period-start');
  const selectFim   = document.getElementById('period-end');

  // Atalhos: do ano do botão até o ano atual
  botoes.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;

      const anoInicio = parseInt(btn.getAttribute('data-period'));
      marcarControleAtivo(btn);

      // Mantém o seletor personalizado sincronizado com o atalho escolhido
      if (selectIni && selectFim) {
        selectIni.value = anoInicio;
        selectFim.value = ANO_ATUAL;
      }

      aplicarPeriodo(anoInicio, ANO_ATUAL);
    });
  });

  if (!custom || !selectIni || !selectFim) return;

  // Popula os anos disponíveis (ANO_MIN até o ano atual)
  for (let ano = ANO_MIN; ano <= ANO_ATUAL; ano++) {
    selectIni.add(new Option(ano, ano));
    selectFim.add(new Option(ano, ano));
  }
  selectIni.value = periodoSelecionado.inicio;
  selectFim.value = periodoSelecionado.fim;

  // Seletor personalizado: alterar o ano apenas "prepara" o período.
  // O filtro só é aplicado ao clicar em "Aplicar".
  const btnAplicar = document.getElementById('period-apply');

  // Habilita o botão somente se a seleção difere do período atualmente exibido
  const atualizarBotaoAplicar = () => {
    if (!btnAplicar) return;
    const igual = parseInt(selectIni.value) === periodoSelecionado.inicio &&
                  parseInt(selectFim.value) === periodoSelecionado.fim;
    btnAplicar.disabled = igual;
  };

  // Garante inicio <= fim ajustando o outro campo
  const aoMudar = (alterado) => {
    const inicio = parseInt(selectIni.value);
    const fim    = parseInt(selectFim.value);

    if (inicio > fim) {
      if (alterado === 'inicio') selectFim.value = inicio;
      else                       selectIni.value = fim;
    }
    atualizarBotaoAplicar();
  };

  selectIni.addEventListener('change', () => aoMudar('inicio'));
  selectFim.addEventListener('change', () => aoMudar('fim'));

  btnAplicar?.addEventListener('click', () => {
    marcarControleAtivo(custom);
    aplicarPeriodo(parseInt(selectIni.value), parseInt(selectFim.value));
  });

  // Reavalia o estado do botão sempre que o período ativo mudar (atalhos ou aplicar)
  document.addEventListener('periodo-alterado', atualizarBotaoAplicar);
  atualizarBotaoAplicar();
}

// 3. O Fluxo de Inicialização Principal
async function init() {
  console.group('[main] Inicializando aplicação');
  
  initModal();
  initAutocomplete();
  initFiltros(); 

  showLoading();
  updateLoading(`Iniciando sistema com dados de ${ANO_ATUAL}...`);

  try {
    // CARGA INICIAL DIRETA: Carrega de ANO_ATUAL até ANO_ATUAL
    const novos = await loadPeriod(ANO_ATUAL, ANO_ATUAL, (arquivo, total) => {
      updateLoading(`Carregando a base de dados... (${total.toLocaleString('pt-BR')})`);
    });
    
    console.log(`[main] Carga inicial concluída: ${novos} novos registros.`);

    // Garante que o botão correspondente ao ano atual inicie com a cor laranja
    const btnInicial = document.querySelector(`.period-btn[data-period="${ANO_ATUAL}"]`) 
                       || document.querySelector('.period-btn');
    if (btnInicial) {
      document.querySelector('.period-btn.active')?.classList.remove('active');
      btnInicial.classList.add('active');
    }

    // Só depois que os dados estão na memória, desenhamos a tela
    atualizarDashboard();

  } catch (err) {
    console.error('[main] Erro crítico na carga inicial:', err);
    hideLoading();
  }

  console.groupEnd();
}

// Dispara o motor principal
init();