// Retorna o nome legível de um CBO - "784205" → "Alimentador de linha de produção"
// Tenta exato, depois com zero à esquerda, depois retorna o código como fallback
function getCboNome(codigo) {
  if (!codigo) return 'Profissões não identificadas/registradas';
  
  if (typeof CBO_MAP === 'undefined') return codigo; // cboMap.js não carregado
  
  const c6 = String(codigo).padStart(6, '0');
  let nome = CBO_MAP[c6] || CBO_MAP[codigo] || codigo;
  
  if (nome === '000000' || String(nome).includes('{ñ') || String(nome).toLowerCase() === 'ignorado') {
    return 'Profissões não identificadas/registradas';
  }
  
  return nome;
}

// Busca por prefixo usando a Trie - retorna registros AGREGADOS (sem duplicatas)
function searchByMunicipio(prefix) {
  if (!prefix || !prefix.trim()) return window.municipiosAgregados || [];

  const indices = trie.searchPrefix(prefix.trim());
  const vistos  = new Set();
  const resultado = [];

  for (const idx of indices) {
    const bruto = heap.getByIndex(idx);
    if (!bruto || vistos.has(bruto.municipio)) continue;
    vistos.add(bruto.municipio);
    const agregado = (window.municipiosAgregados || []).find(
      m => m.municipio === bruto.municipio
    );
    if (agregado) resultado.push(agregado);
  }
  return resultado;
}


function formatNumber(n) {
  if (n === null || n === undefined) return '-';
  return Number(n).toLocaleString('pt-BR');
}

function agregaPorMunicipio(anoInicio = 2022, anoFim = new Date().getFullYear()) {
  console.group('[search] agregaPorMunicipio');
  const mapa = new Map();

  for (let i = 0; i < heap.size; i++) {
    const r = heap.getByIndex(i);

    // Filter by selected period
    if (r.ano < anoInicio || r.ano > anoFim) continue;

    if (!mapa.has(r.municipio)) {
      mapa.set(r.municipio, {
        municipio:    r.municipio,
        municipioCod: r.municipioCod,
        uf:           r.uf,
        acidentes:    0,
        obitos:       0,
        porAno:       {},
        porCBO:       {},
      });
    }

    const entry = mapa.get(r.municipio);
    entry.acidentes++;
    if (r.obito) entry.obitos++;

    if (r.ano) {
      entry.porAno[r.ano] = (entry.porAno[r.ano] || 0) + 1;
    }

    if (r.cbo) {
      entry.porCBO[r.cbo] = (entry.porCBO[r.cbo] || 0) + 1;
    }
  }

  mapa.forEach(entry => {
    const cbos = Object.entries(entry.porCBO);
    if (cbos.length > 0) {
      cbos.sort((a, b) => b[1] - a[1]);
      const codigoTop = cbos[0][0];
      entry.profissaoCodigo  = codigoTop;
      entry.profissaoNome    = getCboNome(codigoTop); // nome legível
    } else {
      entry.profissaoCodigo = '-';
      entry.profissaoNome   = '-';
    }
    entry.anos     = Object.keys(entry.porAno).sort();
    entry.evolucao = entry.anos.map(ano => entry.porAno[ano]);

    // Série completa do período filtrado (anos sem registros = 0) para o gráfico do modal
    entry.anosPeriodo = [];
    for (let a = anoInicio; a <= anoFim; a++) entry.anosPeriodo.push(a);
    entry.evolucaoPeriodo = entry.anosPeriodo.map(a => entry.porAno[a] || 0);
  });

  console.log(`[search] ${mapa.size} municípios agregados`);
  let n = 0;
  mapa.forEach((v, k) => {
    if (n++ < 2) console.log(`  ${k}: ${v.acidentes} acidentes | ${v.obitos} óbitos | profissão: ${v.profissaoNome}`);
  });
  console.groupEnd();
  return mapa;
}

function faixaEtaria(idade) {
  if (idade === null || idade < 0 || idade > 120) return null;
  if (idade < 18)  return '< 18';
  if (idade <= 24) return '18-24';
  if (idade <= 34) return '25-34';
  if (idade <= 44) return '35-44';
  if (idade <= 54) return '45-54';
  if (idade <= 64) return '55-64';
  return '65+';
}

function agregaNacional(anoInicio = 2022, anoFim = new Date().getFullYear()) {
  console.group('[search] agregaNacional');
  const porCBO   = {};
  const porFaixa = {};
  let   totalObitos = 0;
  let   anoMin = Infinity, anoMax = -Infinity;
  let   totalRegistrosFiltrados = 0;

  const ordemFaixas = ['< 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  ordemFaixas.forEach(f => porFaixa[f] = 0);

  for (let i = 0; i < heap.size; i++) {
    const r = heap.getByIndex(i);

    // Filter by selected period
    if (r.ano < anoInicio || r.ano > anoFim) continue;

    totalRegistrosFiltrados++;

    if (r.obito) totalObitos++;
    if (r.ano) {
      if (r.ano < anoMin) anoMin = r.ano;
      if (r.ano > anoMax) anoMax = r.ano;
    }

    if (r.cbo) {
      const nome  = getCboNome(r.cbo);
      const chave = nome || r.cbo;
      if (!porCBO[chave]) porCBO[chave] = { label: chave, valor: 0 };
      porCBO[chave].valor++;
    }

    const faixa = faixaEtaria(r.idade);
    if (faixa) porFaixa[faixa]++;
  }

  const topCBOs = Object.values(porCBO)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);

  const faixas = ordemFaixas.map(label => ({ label, valor: porFaixa[label] }));

  const periodo = anoMin === Infinity ? '-' : (anoMin === anoMax ? String(anoMin) : `${anoMin}–${anoMax}`);

  console.log(`[search] total=${totalRegistrosFiltrados} | óbitos=${totalObitos} | período=${periodo}`);
  console.groupEnd();

  return {
    topCBOs,
    faixas,
    totalRegistros: totalRegistrosFiltrados,
    totalObitos,
    periodo,
  };
}