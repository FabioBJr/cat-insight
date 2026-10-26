// ============================================================
// csvHandler.js - Download, parsing e carga dos CSVs de CAT (INSS) no Heap/Trie
// ============================================================

const CSV_PATH_PREFIX = 'data/D.SDA.PDA.005.CAT.';
const UNKNOWN_CITY    = 'Municípios não informados';

// Localiza o índice de uma coluna pelo nome (ignora maiúsculas e espaços nas pontas)
function findColumn(headers, name) {
  const target = name.trim().toLowerCase();
  return headers.findIndex(h => h.trim().toLowerCase() === target);
}

function clean(value) {
  if (value === undefined || value === null) return '';
  return value.toString().trim().replace(/\r/g, '');
}

// Os CSVs mudaram de layout ao longo do tempo: o formato novo possui a coluna de óbito
function detectFormat(headers) {
  const hasDeathColumn = headers.some(
    h => h.trim().toLowerCase() === 'indica óbito acidente'
  );
  const format = hasDeathColumn ? 'new' : 'old';
  console.log(`[csvHandler] Formato detectado: ${format} | colunas: ${headers.length}`);
  return format;
}

function extractYear(dateStr) {
  const s = clean(dateStr);
  if (!s || s === '0000/00' || s === '00/00/0000') return null;
  if (/^\d{4}\/\d{2}$/.test(s))       return parseInt(s.slice(0, 4), 10);  // antigo: AAAA/MM
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return parseInt(s.slice(6, 10), 10); // novo: DD/MM/AAAA
  console.warn(`[csvHandler] Formato de data não reconhecido: "${s}"`);
  return null;
}

// "330455-Rio de Janeiro" -> { code: "330455", name: "Rio de Janeiro" }
function parseCity(value) {
  const s    = clean(value);
  const dash = s.indexOf('-');

  let code = '';
  let name = s;

  if (dash !== -1) {
    code = s.slice(0, dash).trim();
    name = s.slice(dash + 1).trim();
  }

  if (!name || name.toLowerCase() === 'ignorado' || name.includes('{ñ')) {
    name = UNKNOWN_CITY;
  }

  return { code, name };
}

function parseState(value) {
  const s = clean(value);
  return s.toLowerCase() !== 'zerado' ? s : '-';
}

// "784205-Alimentador de linha" -> "784205"
function parseCbo(value) {
  return clean(value).split(/[-\s]/)[0].trim();
}

// O formato antigo não informa óbito; nesse caso o registro é contado como não fatal
function parseDeath(value, format) {
  if (format !== 'new') return false;
  return clean(value).toLowerCase() === 'sim';
}

function calcAge(birthDate, accidentYear) {
  const s = clean(birthDate);
  if (!s || s === '00/00/0000' || !accidentYear) return null;
  const birthYear = parseInt(s.slice(6, 10), 10);
  if (isNaN(birthYear) || birthYear < 1900) return null;
  return accidentYear - birthYear;
}

// Converte uma linha do CSV em um registro do Heap.
function convertLine(values, headers, format) {
  const get = (column) => clean(values[findColumn(headers, column)]);

  const city        = parseCity(get('Munic Empr'));
  const year        = extractYear(get('Data Acidente'));
  const deathColumn = format === 'new' ? 'Indica Óbito Acidente' : 'Indica acidente';

  return {
    city:         city.name,
    cityCode:     city.code,
    state:        parseState(get('UF Munic. Empregador')),
    year,
    cbo:          parseCbo(get('CBO')),
    cboDesc:      get('CBO.1'),
    cid:          get('CID-10'),
    cidDesc:      get('CID-10.1'),
    accidentType: get('Tipo do Acidente'),
    bodyPart:     get('Parte Corpo Atingida'),
    injuryNature: get('Natureza da Lesão'),
    causingAgent: get('Agente  Causador  Acidente'),
    sex:          get('Sexo'),
    age:          calcAge(get('Data Nascimento'), year),
    death:        parseDeath(get(deathColumn), format),
    cnae:         get('CNAE2.0 Empregador'),
  };
}

// Divide uma linha separada por ";" respeitando campos entre aspas
function parseLine(line) {
  const result   = [];
  let current    = '';
  let inQuotes   = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ';' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// Os arquivos do INSS são codificados em ISO-8859-1 (Latin-1)
async function fetchLatin1(url) {
  console.log(`[csvHandler] Fetch: ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} - ${url}`);
  const buffer  = await response.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-1');
  console.log(`[csvHandler] OK: ${(buffer.byteLength / 1024).toFixed(1)} KB`);
  return decoder.decode(buffer);
}

// Gera a lista de arquivos mensais (AAAAMM) entre duas datas, inclusive
function generateFileList(prefix, startYear, startMonth, endYear, endMonth) {
  const files = [];
  let year  = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    files.push(`${prefix}${year}${String(month).padStart(2, '0')}.csv`);

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return files;
}

// Arquivos já processados: evita baixar/inserir o mesmo mês duas vezes
const loadedFiles = new Set();

// Carrega no Heap/Trie todos os meses do período que ainda não estão em memória
async function loadPeriod(startYear, endYear, onProgress) {
  let newRecords = 0;

  const allFiles     = generateFileList(CSV_PATH_PREFIX, startYear, 1, endYear, 12);
  const pendingFiles = allFiles.filter(file => !loadedFiles.has(file));

  if (pendingFiles.length === 0) return 0;

  for (const file of pendingFiles) {
    try {
      const text    = await fetchLatin1(file);
      const lines   = text.split('\n');
      const headers = parseLine(lines[0].replace(/\r/g, ''));
      const format  = detectFormat(headers);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].replace(/\r/g, '').trim();
        if (!line) continue;

        const values = parseLine(line);
        if (values.length < 10) continue;

        const record = convertLine(values, headers, format);
        if (!record.city || !record.year) continue;

        const heapIndex = heap.size;
        heap.insert(record);
        trie.insert(record.city, heapIndex);

        newRecords++;
      }

      loadedFiles.add(file);

      if (onProgress) onProgress(file, heap.size);

    } catch (err) {
      if (err.message.includes('404')) {
        // Mês ainda não publicado: registra no log e marca como lido para não repetir a requisição
        console.info(`[csvHandler] Mês ainda não publicado ignorado: ${file}`);
        loadedFiles.add(file);
      } else {
        console.error(`[csvHandler] Erro crítico ao processar ${file}:`, err);
      }
    }
  }

  if (newRecords > 0) unifyCityNames();

  return newRecords;
}

// ------------------------------------------------------------
// Unificação de grafias de município
// Os CSVs do INSS truncam alguns nomes (ex.: "Rio de Janeir") e algumas linhas
// vêm sem código. O código IBGE é a identidade confiável da cidade, então:
//   1) para cada código, o nome canônico é o MAIOR já visto (o não truncado);
//   2) linhas sem código são resolvidas pelo par (nome normalizado + UF).
// ------------------------------------------------------------
const canonicalNameByCode = new Map(); // código IBGE -> nome canônico
const codeByNameAndState  = new Map(); // "NOME NORMALIZADO|UF" -> código IBGE

function isValidCityCode(code) {
  return /^\d{6,7}$/.test(code) && !/^0+$/.test(code);
}

function nameStateKey(name, state) {
  return `${normalizeText(name)}|${state}`;
}

function unifyCityNames() {
  // 1ª passada: aprende o melhor nome de cada código
  for (let i = 0; i < heap.size; i++) {
    const record = heap.getByIndex(i);
    if (!isValidCityCode(record.cityCode)) continue;

    const current = canonicalNameByCode.get(record.cityCode);
    if (!current || record.city.length > current.length) {
      canonicalNameByCode.set(record.cityCode, record.city);
    }
    codeByNameAndState.set(nameStateKey(record.city, record.state), record.cityCode);
  }

  // 2ª passada: aplica o nome canônico aos registros
  let fixedCount = 0;
  for (let i = 0; i < heap.size; i++) {
    const record = heap.getByIndex(i);

    let code = record.cityCode;
    if (!isValidCityCode(code)) {
      code = codeByNameAndState.get(nameStateKey(record.city, record.state));
      if (!code) continue;
      record.cityCode = code;
    }

    const canonical = canonicalNameByCode.get(code);
    if (canonical && canonical !== record.city) {
      record.city = canonical;
      trie.insert(canonical, i); // permite achar o registro pelo nome completo
      fixedCount++;
    }
  }

  if (fixedCount > 0) {
    console.log(`[csvHandler] ${fixedCount} registros com nome de município unificado`);
  }
}
