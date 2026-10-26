// ============================================================
// search.js - Busca por prefixo e agregações (por município e nacional)
// ============================================================

const UNKNOWN_OCCUPATION = 'Profissões não identificadas/registradas';
const AGE_GROUP_ORDER    = ['< 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

// Retorna o nome legível de um CBO - "784205" → "Alimentador de linha de produção"
// Tenta exato, depois com zero à esquerda, depois retorna o código como fallback
function getCboName(code) {
  if (!code) return UNKNOWN_OCCUPATION;

  if (typeof CBO_MAP === 'undefined') return code; // cboMap.js não carregado

  const paddedCode = String(code).padStart(6, '0');
  const name = CBO_MAP[paddedCode] || CBO_MAP[code] || code;

  if (name === '000000' || String(name).includes('{ñ') || String(name).toLowerCase() === 'ignorado') {
    return UNKNOWN_OCCUPATION;
  }

  return name;
}

// Busca por prefixo usando a Trie - retorna registros AGREGADOS (sem duplicatas)
function searchByCity(prefix) {
  if (!prefix || !prefix.trim()) return aggregatedCities;

  const indices = trie.searchPrefix(prefix.trim());
  const seen    = new Set();
  const result  = [];

  for (const index of indices) {
    const raw = heap.getByIndex(index);
    if (!raw || seen.has(raw.city)) continue;
    seen.add(raw.city);
    const aggregated = aggregatedCities.find(c => c.city === raw.city);
    if (aggregated) result.push(aggregated);
  }
  return result;
}

function formatNumber(n) {
  if (n === null || n === undefined) return '-';
  return Number(n).toLocaleString('pt-BR');
}

// Agrupa os registros do Heap por município dentro do período [startYear, endYear]
function aggregateByCity(startYear, endYear) {
  console.group('[search] aggregateByCity');
  const cities = new Map();

  for (let i = 0; i < heap.size; i++) {
    const record = heap.getByIndex(i);

    // Filtra pelo período selecionado
    if (record.year < startYear || record.year > endYear) continue;

    if (!cities.has(record.city)) {
      cities.set(record.city, {
        city:     record.city,
        cityCode: record.cityCode,
        state:    record.state,
        accidents: 0,
        deaths:    0,
        byYear:    {},
        byCbo:     {},
      });
    }

    const entry = cities.get(record.city);
    entry.accidents++;
    if (record.death) entry.deaths++;

    if (record.year) {
      entry.byYear[record.year] = (entry.byYear[record.year] || 0) + 1;
    }

    if (record.cbo) {
      entry.byCbo[record.cbo] = (entry.byCbo[record.cbo] || 0) + 1;
    }
  }

  cities.forEach(entry => {
    // Profissão mais afetada no município
    const cbos = Object.entries(entry.byCbo);
    if (cbos.length > 0) {
      cbos.sort((a, b) => b[1] - a[1]);
      entry.topOccupationName = getCboName(cbos[0][0]);
    } else {
      entry.topOccupationName = '-';
    }

    // Anos com registros (usado na coluna "Período" da tabela)
    entry.years = Object.keys(entry.byYear).sort();

    // Série completa do período filtrado (anos sem registros = 0) para o gráfico do modal
    entry.periodYears = [];
    for (let y = startYear; y <= endYear; y++) entry.periodYears.push(y);
    entry.periodCounts = entry.periodYears.map(y => entry.byYear[y] || 0);
  });

  console.log(`[search] ${cities.size} municípios agregados`);
  console.groupEnd();
  return cities;
}

function getAgeGroup(age) {
  if (age === null || age < 0 || age > 120) return null;
  if (age < 18)  return '< 18';
  if (age <= 24) return '18-24';
  if (age <= 34) return '25-34';
  if (age <= 44) return '35-44';
  if (age <= 54) return '45-54';
  if (age <= 64) return '55-64';
  return '65+';
}

// Totais nacionais, top profissões e distribuição por faixa etária no período
function aggregateNational(startYear, endYear) {
  console.group('[search] aggregateNational');
  const byOccupation = {};
  const byAgeGroup   = {};
  let totalRecords   = 0;
  let totalDeaths    = 0;
  let minYear = Infinity, maxYear = -Infinity;

  AGE_GROUP_ORDER.forEach(group => byAgeGroup[group] = 0);

  for (let i = 0; i < heap.size; i++) {
    const record = heap.getByIndex(i);

    // Filtra pelo período selecionado
    if (record.year < startYear || record.year > endYear) continue;

    totalRecords++;
    if (record.death) totalDeaths++;

    if (record.year) {
      if (record.year < minYear) minYear = record.year;
      if (record.year > maxYear) maxYear = record.year;
    }

    if (record.cbo) {
      const label = getCboName(record.cbo) || record.cbo;
      if (!byOccupation[label]) byOccupation[label] = { label, value: 0 };
      byOccupation[label].value++;
    }

    const group = getAgeGroup(record.age);
    if (group) byAgeGroup[group]++;
  }

  const topOccupations = Object.values(byOccupation)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const ageGroups = AGE_GROUP_ORDER.map(label => ({ label, value: byAgeGroup[label] }));

  const period = minYear === Infinity ? '-' : formatPeriodLabel(minYear, maxYear);

  console.log(`[search] total=${totalRecords} | óbitos=${totalDeaths} | período=${period}`);
  console.groupEnd();

  return { topOccupations, ageGroups, totalRecords, totalDeaths, period };
}

// "2024" ou "2022–2026"
function formatPeriodLabel(start, end) {
  return start === end ? String(start) : `${start}–${end}`;
}
