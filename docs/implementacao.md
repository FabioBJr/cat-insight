# Implementação

## 1. Extração e Carregamento dos Dados

Os dados são provenientes do Portal Brasileiro de Dados Abertos, conjunto **CAT — Comunicação de Acidente de Trabalho**, disponibilizado pelo INSS. Foram utilizados arquivos mensais em CSV, cobrindo janeiro de 2022 a maio de 2026.

O carregamento é feito pelo módulo `csvLoader.js`, que para cada arquivo:

1. Executa um `fetch` para obter o conteúdo binário (`ArrayBuffer`)
2. Converte para string usando `TextDecoder` com encoding `iso-8859-1`
3. Processa linha a linha com um parser CSV próprio, que trata campos entre aspas e separador ponto e vírgula

### Formatos de arquivo

Foram identificados dois formatos distintos, detectados automaticamente ao ler o cabeçalho de cada arquivo:

| | Formato antigo (anterior a 2023) | Formato novo (a partir de 2023) |
|---|---|---|
| Data do acidente | `AAAA/MM` | `DD/MM/AAAA` |
| Campo de óbito | não existe explicitamente | coluna "Indica Óbito Acidente" |

## 2. Arquivo Serial — Heap

Estrutura de armazenamento implementada como array em memória (`Heap`). Cada registro lido do CSV é inserido no final do array, em ordem de chegada, sem ordenação ou comparação.

**Motivação**: como a aplicação precisa carregar todos os dados a cada acesso e o volume já é alto para 5 anos de dados, priorizou-se a velocidade de carga. Uma ordenação prévia não traria benefício, já que apenas a tabela de municípios precisa ser ordenada, e apenas uma vez.

## 3. Índice por Prefixo — Trie

Implementada para a busca por município. Permite recuperação por prefixo em **O(k)**, onde k é o tamanho do prefixo digitado.

- Durante o carregamento, para cada registro inserido no Heap, o nome do município é inserido na Trie, associado ao índice de posição no Heap
- Cada nó armazena um mapa de caracteres filhos e uma lista de índices dos registros que passam por aquele nó
- Normalização (maiúsculas, sem acento) garante que "São Paulo", "SAO PAULO" e "sao paulo" resultem na mesma chave

O método `searchPrefix()` é compartilhado entre autocomplete e busca final:

- **Autocomplete**: exibe os primeiros 6 municípios únicos encontrados
- **Busca final**: retorna todos os registros agregados cujo município começa com o prefixo, renderizados na tabela

## 4. Índice Invertido — Agregação por Profissão e Faixa Etária

Os gráficos nacionais (profissões mais afetadas e distribuição por faixa etária) são construídos por um índice invertido em memória, mapeando um atributo não-chave (código CBO ou faixa etária) para a contagem de ocorrências.

A função `agregaNacional()` realiza uma única varredura do Heap:

- Acumula contagens por CBO e por faixa etária
- A faixa etária é calculada subtraindo o ano de nascimento (campo "Data Nascimento", formato `DD/MM/AAAA` em ambos os formatos) do ano do acidente, classificando em 7 faixas
- Resultado: os 8 CBOs com mais registros + distribuição completa por faixa, alimentando gráficos de barras horizontais via Canvas API

As descrições dos CBOs vêm de `cboMap.js`, gerado a partir da tabela CBO 2002 do Ministério do Trabalho, mapeando 2.694 códigos para títulos legíveis.

## 5. Ordenação — QuickSort

A tabela de municípios é ordenada por número de fatalidades, de forma decrescente, usando QuickSort implementado com comparador genérico.

**Motivação**: o array de municípios agregados tem em torno de 4 mil entradas e não vem ordenado. O volume é previsível e limitado, então o QuickSort atende bem tanto no caso médio quanto no volume máximo, sem exigir alocação extra de memória.
