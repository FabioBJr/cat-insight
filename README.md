# CAT Insight

Uma página que torna os dados públicos sobre acidentes de trabalho no Brasil mais acessíveis e transparentes para a população. 
<br>
<br>

  *Projeto desenvolvido para a disciplina **Estrutura de Dados** `INF01203`, Instituto de Informática, UFRGS.*
  <br>
  *Autor: Fábio Brito Júnior - Professora: Dra. Renata Galante - Porto Alegre, 2026/1.*

## Problema
### **Como tornar mais transparente e acessível para a população a ocorrência de acidentes de trabalho no país?**

Os acidentes de trabalho no Brasil são publicados pelo INSS em planilhas com grande volume de dados mensalmente, o que dificulta responder perguntas simples como:

- Os acidentes têm diminuído ao longo dos anos?
- Qual é a profissão com maior índice de incidentes?
- As fatalidades estão aumentando?

Este projeto propõe uma plataforma web que permite **consultar, filtrar e visualizar** os registros de **Comunicação de Acidente de Trabalho** (CAT) sem que a população precise lidar diretamente com a pilha de arquivos, e **sem banco de dados**.

## Funcionalidades

- Leitura de arquivos CSV do CAT nos dois formatos existentes (anterior e posterior a jul/2021).
- Cards de resumo: **total de registros**, **fatalidades** e período de filtro.
- Panorama nacional: gráficos de **profissões mais afetadas** e distribuição por faixa etária.
- Tabela de **municípios ordenada por fatalidades**.
- Busca com autocomplete por prefixo de município.
- Detalhamento por município: **total de acidentes, fatalidades, profissão mais afetada** e **evolução anual**.
- Hospedagem estática via GitHub Pages, **sem banco de dados**.

## Estruturas de Dados implementadas

| Estrutura | Uso no projeto |
|---|---|
| **Arquivo serial (Heap)** | Armazenamento em memória dos registros, em ordem de chegada |
| **Índice invertido** | Agregação por CBO (profissão) e faixa etária |
| **Trie** | Indexação e busca por prefixo de município |
| **QuickSort** | Ordenação da tabela de municípios por fatalidades |

## Fonte de dados

- **Comunicação de Acidente de Trabalho (CAT)**: [Portal Brasileiro de Dados Abertos](https://dados.gov.br/dados/conjuntos-dados/inss-comunicacao-de-acidente-de-trabalho-cat1)
  - Período coberto: janeiro de 2022 a dezembro de 2026.
- **Classificação Brasileira de Ocupações (CBO)**: [Ministério do Trabalho e Emprego](http://www.mtecbo.gov.br)

## Como usar

1. Acesse a URL da aplicação publicada no [GitHub Pages](https://github.com/FabioBJr/cat-insight).
2. Aguarde o carregamento dos arquivos CSV.
3. Explore o panorama nacional nas primeiras seções.
4. Use a barra de busca para procurar um município.
5. Clique em uma linha da tabela para ver detalhes do município.

## Tecnologias

- **HTML, CSS e JavaScript**.
- **Canvas API** para renderização dos gráficos.
- Hospedagem estática com **GitHub Pages**.
- Sem dependências externas
- Completamente client-side


## Estrutura do Projeto
```
├── css/
│   └── style.css             # Estilização da interface.
├── data/
│   └── ...                   # Arquivos CSV mensais do CAT
├── js/
│   ├── cboMap.js             # Mapeamento dos códigos CBO
│   ├── charts.js             # Renderização dos gráficos
│   ├── csvLoader.js          # Leitura e parsing dos arquivos CSV
│   ├── main.js               # Orquestração da aplicação e filtros de período
│   ├── search.js             # Lógica da consulta e filtragem por município
│   ├── structures.js         # Estruturas de dados e algoritmos
│   └── ui.js                 # Manipulação do DOM, tabela, paginação e modais
└── index.html                # HTML principal
```

## Uso de Inteligência Artificial Generativa

Durante o desenvolvimento foi utilizado o modelo Claude Sonnet 4.6 (Anthropic) como ferramenta auxiliar para geração de layout, identificação/correção de bugs, estruturação de funções de parsing e na construção dos algoritmos e estruturas de dados. Todo o código resultante foi revisado e validado por mim.

## Referências

- GALANTE, Renata. *Estrutura de Dados*. UFRGS, 2026. Material de aula.
- MINISTÉRIO DO TRABALHO E EMPREGO. *Classificação Brasileira de Ocupações - CBO 2002*.
- INSTITUTO NACIONAL DO SEGURO SOCIAL. *Comunicação de Acidente de Trabalho - CAT*. Portal Brasileiro de Dados Abertos.
- ANTHROPIC. *Claude 4.6 Sonnet. São Francisco: Anthropic*, 2026. Ferramenta de inteligência artificial utilizada no auxílio do desenvolvimento.

## Outros sites interessantes
- Durante o desenvolvimento descobri esta plataforma que traz diversos outros insights sobre o tema. Achei legal compartilhar para quem gostou ou se interessou mais sobre o assunto:  [Observatório de Segurança e Saúde no Trabalho](https://smartlab.mpt.mp.br/sst)
