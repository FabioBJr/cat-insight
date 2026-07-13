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

	getAll() {
		return this.records;
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
		this.children = {}; // char -> TrieNode
		this.indices = []; // indices no Heap dos registros que passam por aqui
		this.isEnd = false;
	}
}

class Trie {
	constructor() {
		this.root = new TrieNode();
	}

	// Insere string e associa ao indice do registro no Heap O(n)
	insert(str, heapIndex) {
		let node = this.root;
		for (const char of this._normalize(str)) {
			if (!node.children[char]) {
				node.children[char] = new TrieNode();
			}
			node = node.children[char];
			node.indices.push(heapIndex);
		}
		node.isEnd = true;
	}

	// Retorna indices de todos os registros cujo municipio comeca com prefix O(n)
	searchPrefix(prefix) {
		if (!prefix) return [];
		let node = this.root;
		for (const char of this._normalize(prefix)) {
			if (!node.children[char]) return [];
			node = node.children[char];
		}
		return node.indices;
	}

	_normalize(str) {
	return str
	  .toUpperCase()
	  .normalize('NFD')
	  .replace(/[\u0300-\u036f]/g, '');
  }
}

// ============================================================
// QUICKSORT - Ordenação de municípios por número de óbitos
// ============================================================
function quickSortMunicipios(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    const pivotIndex = partition(arr, left, right);
    // Ordena recursivamente a sublista à esquerda do pivô
    quickSortMunicipios(arr, left, pivotIndex - 1);
    // Ordena recursivamente a sublista à direita do pivô
    quickSortMunicipios(arr, pivotIndex + 1, right);
  }
  return arr;
}

function partition(arr, left, right) {
  const pivotValue = arr[right].obitos ?? 0;
  let i = left - 1;

  for (let j = left; j < right; j++) {
    const currentObitos = arr[j].obitos ?? 0;
    
    // Ordem decrescente
    if (currentObitos > pivotValue) {
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