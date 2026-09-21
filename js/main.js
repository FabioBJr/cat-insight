// 1. FUNÇÃO REUTILIZÁVEL PARA RECALCULAR TUDO
function atualizarDashboard() {
  updateLoading('Processando agregações e ordenando...');
  
  // Como o Heap cresceu, precisamos agregar os dados novamente
  // (Essas funções estão no seu data.js)
  const municipios = Array.from(agregaPorMunicipio().values());
  window.municipiosAgregados = quickSortMunicipios(municipios);
  window.dadosNacionais      = agregaNacional();

  // Manda a UI se desenhar de novo com os dados atualizados
  atualizarCards(window.dadosNacionais);
  renderTable(window.municipiosAgregados);
  initCharts(window.dadosNacionais.topCBOs, window.dadosNacionais.faixas);
  
  hideLoading();
}

// 2. OUVINTE DOS BOTÕES DE PERÍODO
function initFiltros() {
  const botoes = document.querySelectorAll('.period-btn');
  
  botoes.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (btn.classList.contains('active')) return;

      // Troca o visual do botão ativo
      document.querySelector('.period-btn.active')?.classList.remove('active');
      btn.classList.add('active');

      const anoInicio = parseInt(btn.getAttribute('data-period'));
      
      showLoading();
      updateLoading('Verificando dados necessários...');

      // Pequeno delay para o navegador conseguir pintar a tela de loading antes de travar no fetch
      setTimeout(async () => {
        try {
          // Chama a nova função do csvLoader
          const novos = await carregarPeriodo(anoInicio, 2026, (arquivo, total) => {
             updateLoading(`Processando ${arquivo.split('/').pop()}... (${total.toLocaleString('pt-BR')} registros)`);
          });

          // Se baixou dados novos, recalcula tudo. Se não, apenas esconde o loading.
          if (novos > 0) {
            atualizarDashboard();
          } else {
            hideLoading();
          }
        } catch (error) {
          console.error('[main] Erro ao carregar período:', error);
          hideLoading();
        }
      }, 50);
    });
  });
}

// 3. O SEU NOVO INIT ENXUTO
async function init() {
  console.group('[main] Inicializando aplicação');
  
  initModal();
  initAutocomplete();
  initFiltros(); // Habilita os botões de ano

  // Simula o clique no botão inicial de 2026 para dar a partida na aplicação
  const btnInicial = document.querySelector('.period-btn[data-period="2026"]');
  if (btnInicial) {
    btnInicial.click();
  }

  console.groupEnd();
}

init();