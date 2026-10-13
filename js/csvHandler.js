function findCol(headers, name) {
  const n = name.trim().toLowerCase();
  return headers.findIndex(h => h.trim().toLowerCase() === n);
}

function clean(val) {
  if (val === undefined || val === null) return '';
  return val.toString().trim().replace(/\r/g, '');
}

function detectFormat(headers) {
  const hasColObit = headers.some(
    h => h.trim().toLowerCase() === 'indica óbito acidente'
  );
  const formato = hasColObit ? 'novo' : 'antigo';
  console.log(`[csvLoader] Formato detectado: ${formato} | colunas: ${headers.length}`);
  return formato;
}

function extractAno(dataStr) {
  const s = clean(dataStr);
  if (!s || s === '0000/00' || s === '00/00/0000') return null;
  if (/^\d{4}\/\d{2}$/.test(s)) return parseInt(s.slice(0, 4), 10);    // antigo: AAAA/MM
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return parseInt(s.slice(6, 10), 10); // novo: DD/MM/AAAA
  console.warn(`[csvLoader] Formato de data não reconhecido: "${s}"`);
  return null;
}

function parseMunicipio(val) {
  const s = clean(val);
  const dash = s.indexOf('-');
  
  let codigo = '';
  let nome = s;

  if (dash !== -1) {
    codigo = s.slice(0, dash).trim();
    nome = s.slice(dash + 1).trim();
  } else {
    nome = s.trim();
  }

  if (nome.toLowerCase() === 'ignorado' || nome.includes('{ñ') || !nome) {
    nome = 'Municípios não informados';
  }

  return { codigo, nome };
}

function parseUF(val) {
  const s = clean(val);

  return s.toLowerCase() !== 'zerado' ? s : '-';

}

function parseCBO(val) {
  const s = clean(val);
  return s.split(/[-\s]/)[0].trim();
}

function parseObito(val, formato) {
  const s = clean(val).toLowerCase();
  if (formato === 'novo') return s === 'sim';
  return false;
}

function calcIdade(dataNasc, anoAcidente) {
  const s = clean(dataNasc);
  if (!s || s === '00/00/0000' || !anoAcidente) return null;
  const anoNasc = parseInt(s.slice(6, 10), 10);
  if (isNaN(anoNasc) || anoNasc < 1900) return null;
  return anoAcidente - anoNasc;
}

function convertLine(valores, headers, formato) {
  const get = (nome) => clean(valores[findCol(headers, nome)]);

  const municipio = parseMunicipio(get('Munic Empr'));
  const ano       = extractAno(get('Data Acidente'));

  const campoObito = formato === 'novo' ? 'Indica Óbito Acidente' : 'Indica acidente';

  const uf = parseUF(get('UF Munic. Empregador'));

  return {
    municipio:    municipio.nome,
    municipioCod: municipio.codigo,
    uf,
    ano,
    cbo:          parseCBO(get('CBO')),
    cboDesc:      clean(valores[findCol(headers, 'CBO.1')]),
    cid:          get('CID-10'),
    cidDesc:      clean(valores[findCol(headers, 'CID-10.1')]),
    tipoAcidente: get('Tipo do Acidente'),
    parteCorpo:   get('Parte Corpo Atingida'),
    natureza:     get('Natureza da Lesão'),
    agente:       get('Agente  Causador  Acidente'),
    sexo:         get('Sexo'),
    idade:        calcIdade(get('Data Nascimento'), ano),
    obito:        parseObito(get(campoObito), formato),
    cnae:         get('CNAE2.0 Empregador'),
  };
}

function lineParse(line) {
  const resultado = [];
  let atual = '';
  let dentroDe = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      dentroDe = !dentroDe;
    } else if (ch === ';' && !dentroDe) {
      resultado.push(atual);
      atual = '';
    } else {
      atual += ch;
    }
  }
  resultado.push(atual);
  return resultado;
}

async function fetchLatin1(url) {
  console.log(`[csvLoader] Fetch: ${url}`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} - ${url}`);
  const buffer  = await resp.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-1');
  console.log(`[csvLoader] OK: ${(buffer.byteLength / 1024).toFixed(1)} KB`);
  return decoder.decode(buffer);
}

async function loadCSVs(onProgress) {
  let totalRegistros = 0;

  console.group('[csvLoader] Iniciando carga');

  for (const arquivo of CSV_FILES) {
    try {
      const texto   = await fetchLatin1(arquivo);
      const linhas  = texto.split('\n');
      const headers = lineParse(linhas[0].replace(/\r/g, ''));
      const formato = detectFormat(headers);

      let inseridos  = 0;
      let ignorados  = 0;

      for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i].replace(/\r/g, '').trim();
        if (!linha) continue;

        const valores = lineParse(linha);
        if (valores.length < 10) { ignorados++; continue; }

        const registro = converteLinha(valores, headers, formato);
        if (!registro.municipio || !registro.ano) { ignorados++; continue; }

        const heapIndex = heap.size;
        heap.insert(registro);
        trie.insert(registro.municipio, heapIndex);

        totalRegistros++;
        inseridos++;
      }

      console.log(`[csvLoader] ${arquivo.split('/').pop()} → ${inseridos} inseridos, ${ignorados} ignorados`);
      if (onProgress) onProgress(arquivo, totalRegistros);

    } catch (err) {
      console.warn(`[csvLoader] Falha em ${arquivo}:`, err.message);
    }
  }

  console.log(`[csvLoader] Total: ${totalRegistros} | Heap.size=${heap.size}`);
  console.groupEnd();
  return totalRegistros;
}

function generateFileList(path, startYear, startMonth, endYear, endMonth) {
  const files = [];
  let currentYear = startYear;
  let currentMonth = startMonth;

  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {

    const formattedMonth = currentMonth.toString().padStart(2, '0');
    
    files.push(`${path}${currentYear}${formattedMonth}.csv`);

    currentMonth++;
    
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  return files;
}

const loadedFiles = new Set();

async function loadPeriod(anoInicio, anoFim, onProgress) {
  let newRecords = 0;
  
  const allFiles = generateFileList('data/D.SDA.PDA.005.CAT.', anoInicio, 1, anoFim, 12);
  const filesRemaining = allFiles.filter(file => !loadedFiles.has(file));
  
  if (filesRemaining.length === 0) return 0;

  for (const file of filesRemaining) {
    try {
      const text = await fetchLatin1(file);
      const lines = text.split('\n');
      
      // Correções aplicadas: referenciando o array lines e a função lineParse correta
      const headers = lineParse(lines[0].replace(/\r/g, ''));
      const format = detectFormat(headers);

      for (let i = 1; i < lines.length; i++) {
        const lineStr = lines[i].replace(/\r/g, '').trim();
        if (!lineStr) continue;

        const values = lineParse(lineStr);
        if (values.length < 10) continue;

        // Correção: remoção dos parênteses duplos
        const record = convertLine(values, headers, format);
        if (!record.municipio || !record.ano) continue;

        const heapIndex = heap.size;
        heap.insert(record);
        trie.insert(record.municipio, heapIndex);

        newRecords++;
      }
      
      loadedFiles.add(file);

      if (onProgress) {
        onProgress(file, heap.size);
      }
    } catch (err) {
      if (err.message.includes('404')) {
        // Tratamento elegante do 404: avisa no log e marca como lido para não repetir a requisição
        console.info(`[csvLoader] Mês ainda não publicado ignorado: ${file}`);
        loadedFiles.add(file);
      } else {
        // Erros de sintaxe ou leitura não serão mais engolidos em silêncio
        console.error(`[csvLoader] Erro crítico ao processar ${file}:`, err);
      }
    }
  }
  
  if (newRecords > 0) unificarMunicipios();

  return newRecords;
}

// ------------------------------------------------------------
// Unificação de grafias de município
// Os CSVs do INSS truncam alguns nomes (ex.: "Rio de Janeir") e algumas linhas
// vêm sem código. O código IBGE é a identidade confiável da cidade, então:
//   1) para cada código, o nome canônico é o MAIOR já visto (o não truncado);
//   2) linhas sem código são resolvidas pelo par (nome normalizado + UF).
// ------------------------------------------------------------
const nomePorCodigo   = new Map(); // codigo IBGE -> nome canônico
const codigoPorNomeUF = new Map(); // "NOME NORMALIZADO|UF" -> codigo IBGE

function codigoValido(cod) {
  return /^\d{6,7}$/.test(cod) && !/^0+$/.test(cod);
}

function chaveNomeUF(nome, uf) {
  return `${trie._normalize(nome)}|${uf}`;
}

function unificarMunicipios() {
  // 1ª passada: aprende o melhor nome de cada código
  for (let i = 0; i < heap.size; i++) {
    const r = heap.getByIndex(i);
    if (!codigoValido(r.municipioCod)) continue;

    const atual = nomePorCodigo.get(r.municipioCod);
    if (!atual || r.municipio.length > atual.length) {
      nomePorCodigo.set(r.municipioCod, r.municipio);
    }
    codigoPorNomeUF.set(chaveNomeUF(r.municipio, r.uf), r.municipioCod);
  }

  // 2ª passada: aplica o nome canônico aos registros
  let corrigidos = 0;
  for (let i = 0; i < heap.size; i++) {
    const r = heap.getByIndex(i);

    let cod = r.municipioCod;
    if (!codigoValido(cod)) {
      cod = codigoPorNomeUF.get(chaveNomeUF(r.municipio, r.uf));
      if (!cod) continue;
      r.municipioCod = cod;
    }

    const canonico = nomePorCodigo.get(cod);
    if (canonico && canonico !== r.municipio) {
      r.municipio = canonico;
      trie.insert(canonico, i); // permite achar o registro pelo nome completo
      corrigidos++;
    }
  }

  if (corrigidos > 0) {
    console.log(`[csvLoader] ${corrigidos} registros com nome de município unificado`);
  }
}