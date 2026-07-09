// ============================================================
// csvLoader.js — Carrega e normaliza os CSVs do CAT
// ============================================================

const CSV_FILES = [
  'data/cat-comp10-11-12-2019.csv',
  'data/D.SDA.PDA.005.CAT.202505.csv',
  'data/D.SDA.PDA.005.CAT.202506.csv',
  'data/D.SDA.PDA.005.CAT.202507.csv',
  'data/D.SDA.PDA.005.CAT.202508.csv',
  'data/D.SDA.PDA.005.CAT.202509.csv',
  'data/D.SDA.PDA.005.CAT.202510.csv',
  'data/D.SDA.PDA.005.CAT.202511.csv',
  'data/D.SDA.PDA.005.CAT.202512.csv',
  'data/D.SDA.PDA.005.CAT.202601.csv',
  'data/D.SDA.PDA.005.CAT.202602.csv',
  'data/D.SDA.PDA.005.CAT.202603.csv',
  'data/D.SDA.PDA.005.CAT.202604.csv',
  'data/D.SDA.PDA.005.CAT.202605.csv',
];

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

// BUG CORRIGIDO: nome da função era "extractYear" — agora "extractAno"
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
  if (dash === -1) return { codigo: '', nome: s };
  return {
    codigo: s.slice(0, dash).trim(),
    nome:   s.slice(dash + 1).trim(),
  };
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

function converteLinha(valores, headers, formato) {
  const get = (nome) => clean(valores[findCol(headers, nome)]);

  const municipio = parseMunicipio(get('Munic Empr'));
  const ano       = extractAno(get('Data Acidente'));

  const campoObito = formato === 'novo' ? 'Indica Óbito Acidente' : 'Indica acidente';

  return {
    municipio:    municipio.nome,
    municipioCod: municipio.codigo,
    uf:           get('UF Munic. Empregador'),
    ano,
    cbo:          parseCBO(get('CBO')),
    cboDesc:      clean(valores[findCol(headers, 'CBO.1')]),
    cid:          get('CID-10'),
    cidDesc:      clean(valores[findCol(headers, 'CID-10.1')]),
    tipoAcidente: get('Tipo do Acidente'),
    parteCorpo:   get('Parte Corpo Atingida'),
    natureza:     get('Natureza da Lesão'),
    // BUG CORRIGIDO: nome da coluna tem espaços duplos — 'Agente  Causador  Acidente'
    agente:       get('Agente  Causador  Acidente'),
    sexo:         get('Sexo'),
    idade:        calcIdade(get('Data Nascimento'), ano),
    obito:        parseObito(get(campoObito), formato),
    cnae:         get('CNAE2.0 Empregador'),
  };
}

function parseLinha(linha) {
  const resultado = [];
  let atual = '';
  let dentroDe = false;

  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
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
  if (!resp.ok) throw new Error(`HTTP ${resp.status} — ${url}`);
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
      const headers = parseLinha(linhas[0].replace(/\r/g, ''));
      const formato = detectFormat(headers);

      let inseridos  = 0;
      let ignorados  = 0;

      for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i].replace(/\r/g, '').trim();
        if (!linha) continue;

        const valores = parseLinha(linha);
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
      console.warn(`[csvLoader] ⚠ Falha em ${arquivo}:`, err.message);
    }
  }

  console.log(`[csvLoader] Total: ${totalRegistros} | Heap.size=${heap.size}`);
  console.groupEnd();
  return totalRegistros;
}
