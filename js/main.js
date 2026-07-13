async function init() {
  console.group('[main] init()');

  initModal();
  initAutocomplete();
  showLoading();

  try {
    const total = await loadCSVs((arquivo, totalCarregado) => {
      const nome = arquivo.split('/').pop();
      updateLoading(`Carregando ${nome}… (${totalCarregado.toLocaleString('pt-BR')} registros)`);
    });
    console.log(`[main] loadCSVs: ${total} registros`);
  } catch (err) {
    console.error('[main] Erro em loadCSVs:', err);
  }

  if (heap.size === 0) {
    console.warn('[main] Heap vazio - usando MUNICIPIOS_DATA de data.js');
    if (typeof MUNICIPIOS_DATA !== 'undefined') {
      MUNICIPIOS_DATA.forEach((r, i) => {
        r.obitos = r.obitos ?? r.fatalidades ?? 0;
        r.anos   = r.anos   ?? ['2022','2023','2024','2025','2026'];
        heap.insert(r);
        trie.insert(r.municipio, i);
      });
      console.log(`[main] Fallback: ${heap.size} registros`);
    }
  }

  updateLoading('Processando dados…');

  const municipios = Array.from(agregaPorMunicipio().values());
  window.municipiosAgregados = quickSortMunicipios(municipios);
  window.dadosNacionais      = agregaNacional();

  console.log(`[main] ${window.municipiosAgregados.length} municípios | total=${window.dadosNacionais.totalRegistros}`);

  hideLoading();

  // Atualiza os cards com dados reais
  atualizarCards(window.dadosNacionais);

  renderTable(window.municipiosAgregados);
  initCharts(window.dadosNacionais.topCBOs, window.dadosNacionais.faixas);

  console.groupEnd();
}

init();
