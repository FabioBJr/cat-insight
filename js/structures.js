// ============================================================
// structures.js - Estruturas de dados (Heap, Trie) e ordenação (QuickSort)
// ============================================================

// Normaliza texto para comparação: maiúsculas e sem acentos ("São Paulo" -> "SAO PAULO")
function normalizeText(str) {
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ------------------------------------------------------------
// HEAP - arquivo serial (inserção na ordem de chegada)
// Simula um arquivo heap em disco: sem ordenação, acesso por índice
// ------------------------------------------------------------
class Heap {
  constructor() {
    this.records = [];
  }

  insert(record) {
    this.records.push(record);
  }

  getByIndex(index) {
    return this.records[index] ?? null;
  }

  get size() {
    return this.records.length;
  }
}

// ------------------------------------------------------------
// TRIE - índice digital para busca por prefixo de município
// Cada nó armazena os índices dos registros que passam por ele,
// permitindo recuperação O(n) onde n = tamanho do prefixo
// ------------------------------------------------------------
class TrieNode {
  constructor() {
    this.children = {}; // caractere -> TrieNode
    this.indices  = []; // índices no Heap dos registros que passam por aqui
    this.isEnd    = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // Insere a string e associa ao índice do registro no Heap - O(n)
  insert(str, heapIndex) {
    let node = this.root;
    for (const char of normalizeText(str)) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
      node.indices.push(heapIndex);
    }
    node.isEnd = true;
  }

  // Retorna os índices de todos os registros cujo município começa com o prefixo - O(n)
  searchPrefix(prefix) {
    if (!prefix) return [];
    let node = this.root;
    for (const char of normalizeText(prefix)) {
      if (!node.children[char]) return [];
      node = node.children[char];
    }
    return node.indices;
  }
}

// ============================================================
// QUICKSORT - Ordenação de municípios por número de óbitos (decrescente)
// ============================================================
function quickSortCities(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    const pivotIndex = partition(arr, left, right);
    // Ordena recursivamente a sublista à esquerda do pivô
    quickSortCities(arr, left, pivotIndex - 1);
    // Ordena recursivamente a sublista à direita do pivô
    quickSortCities(arr, pivotIndex + 1, right);
  }
  return arr;
}

function partition(arr, left, right) {
  const pivotValue = arr[right].deaths ?? 0;
  let i = left - 1;

  for (let j = left; j < right; j++) {
    const currentDeaths = arr[j].deaths ?? 0;

    // Ordem decrescente
    if (currentDeaths > pivotValue) {
      i++;
      // Troca os elementos de lugar
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Coloca o pivô na posição correta
  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
  return i + 1;
}

const heap = new Heap();
const trie = new Trie();
