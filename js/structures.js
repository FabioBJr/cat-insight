// ------------------------------------------------------------
// HEAP — arquivo serial (inserção na ordem de chegada)
// Simula um arquivo heap em disco: sem ordenação, acesso por índice
// ------------------------------------------------------------
class Heap {
	constructor() {
		this.records = [];
	}

	// Insere registro no final O(1)
	insert(record) {
		this.records.push(record);
	}

	// Retorna todos os registros na ordem de insercao
	getAll() {
		return this.records;
	}

	// Acesso direto por índice (equivalente ao fseek em arquivo binário)
	getByIndex(index) {
		return this.records[index] ?? null;
	}

	get size() {
		return this.records.length;
	}
}

// ------------------------------------------------------------
// TRIE — índice digital para busca por prefixo de município
// Cada nó armazena os índices dos registros que passam por ele,
// permitindo recuperação O(k) onde k = tamanho do prefixo
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

	// Insere string e associa ao indice do registro no Heap O(k)
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

	// Retorna indices de todos os registros cujo municipio comeca com prefix O(k)
	searchPrefix(prefix) {
		if (!prefix) return [];
		let node = this.root;
		for (const char of this._normalize(prefix)) {
			if (!node.children[char]) return [];
			node = node.children[char];
		}
		return node.indices;
	}

	// Normaliza para comparação uniforme: maiúsculas sem acento
	_normalize(str) {
	return str
	  .toUpperCase()
	  .normalize('NFD')
	  .replace(/[\u0300-\u036f]/g, '');
  }
}

// ------------------------------------------------------------
// Instâncias globais — inicializadas em main.js
// ------------------------------------------------------------
const heap = new Heap();
const trie = new Trie();