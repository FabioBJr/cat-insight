# CAT Insight

Aplicação web estática que torna os dados públicos de Comunicação de Acidente de Trabalho (**CAT**) mais acessíveis e navegáveis para a população em geral.

> Trabalho desenvolvido para a disciplina **INF01203 — Estrutura de Dados**, Instituto de Informática, UFRGS.<br>
> Autor: **Fábio Brito Júnior** — Professora: Dra. Renata Galante — Porto Alegre, 2026.

## Problema
> Como tornar mais **transparente** e **acessível** para a população a **ocorrência de acidentes de trabalho** no país?

Os dados de acidentes de trabalho no Brasil são publicados pelo INSS em arquivos CSV mensais, o que dificulta responder perguntas simples como:

- Os acidentes têm diminuído ao longo dos anos?
- Qual é a profissão com maior índice de incidentes?
- As fatalidades estão aumentando?

Este projeto oferece uma interface web que permite consultar, filtrar e visualizar os registros do CAT sem que o usuário precise lidar diretamente com os arquivos brutos.

## Funcionalidades

- Leitura de arquivos CSV do CAT nos dois formatos existentes (anterior e posterior a jul/2021)
- Panorama nacional: gráficos de profissões mais afetadas e distribuição por faixa etária
- Cards de resumo: total de registros, fatalidades e período coberto
- Tabela paginada de municípios ordenada por fatalidades (10 registros/página)
- Busca com autocomplete por prefixo de município (estrutura Trie)
- Detalhamento por município: total de acidentes, fatalidades, profissão mais afetada e evolução anual
- Página "Sobre o projeto" com objetivos, estruturas implementadas e fontes dos dados
- Hospedagem estática via GitHub Pages, sem backend ou banco de dados

## Estruturas de Dados Implementadas

| Estrutura | Uso no projeto |
|---|---|
| **Arquivo serial (Heap)** | Armazenamento em memória dos registros, em ordem de chegada |
| **Trie (árvore digital)** | Indexação e busca por prefixo de município, O(k) |
| **Índice invertido** | Agregação por CBO (profissão) e faixa etária |
| **QuickSort** | Ordenação da tabela de municípios por fatalidades |

Veja detalhes de cada estrutura em [`docs/implementacao.md`](docs/implementacao.md).

## Fonte dos Dados

- **CAT — Comunicação de Acidente de Trabalho**: [Portal Brasileiro de Dados Abertos / INSS](https://dados.gov.br/dados/conjuntos-dados/inss-comunicacao-de-acidente-de-trabalho-cat1)
- **CBO 2002**: [Ministério do Trabalho e Emprego](http://www.mtecbo.gov.br)
- Período coberto: janeiro de 2022 a dezembro de 2026

## Como usar

1. Acesse a URL da aplicação publicada no GitHub Pages
2. Aguarde o carregamento dos arquivos CSV (o progresso é exibido na tela)
3. Explore o panorama nacional na página inicial
4. Use a busca para localizar um município (autocomplete a partir de 1 caractere)
5. Clique em uma linha da tabela para ver o detalhamento do município

Veja o passo a passo completo com capturas em [`docs/exemplo-de-uso.md`](docs/exemplo-de-uso.md).

## Tecnologias

- HTML, CSS e JavaScript
- Canvas API para renderização dos gráficos
- GitHub Pages (hospedagem estática, sem backend/banco de dados)

## Estrutura do Projeto

```
.
├── README.md
├── docs/
│   ├── implementacao.md      # Detalhes técnicos das estruturas de dados
│   ├── exemplo-de-uso.md     # Passo a passo de uso da aplicação
│   └── limitacoes.md         # Limitações conhecidas e melhorias futuras
├── src/
│   ├── csvLoader.js          # Leitura e parsing dos arquivos CSV
│   ├── cboMap.js             # Mapa de códigos CBO para títulos legíveis
│   └── ...
└── index.html
```

## Melhorias (ideias)

- Não há cálculo de taxa de acidentes por 100 mil trabalhadores (exigiria dados externos de população ocupada)
- O carregamento dos dados ocorre no navegador a cada acesso, sem cache
- Pequenas inconsistências na grafia de nomes de municípios entre arquivos de anos diferentes

Detalhes em [`docs/melhorias.md`](docs/melhorias.md).

## Uso de Inteligência Artificial Generativa

Durante o desenvolvimento foi utilizado o modelo Claude Sonnet 4.6 (Anthropic) como ferramenta auxiliar para geração de layout, identificação/correção de bugs, apoio na estruturação de funções de parsing e auxílio na construção dos algoritmos e estruturas de dados. Veja a declaração completa em [`docs/uso-de-ia.md`](docs/uso-de-ia.md).

## Referências

- GALANTE, Renata. *Estrutura de Dados*. UFRGS, 2026. Material de aula.
- MINISTÉRIO DO TRABALHO E EMPREGO. *Classificação Brasileira de Ocupações - CBO 2002*.
- INSTITUTO NACIONAL DO SEGURO SOCIAL. *Comunicação de Acidente de Trabalho - CAT*. Portal Brasileiro de Dados Abertos.

## Licença

Adicione aqui a licença do projeto (ex.: MIT), se aplicável.


## Outros sites interessantes
- [Observatório de Segurança e Saúde no Trabalho](https://smartlab.mpt.mp.br/sst)