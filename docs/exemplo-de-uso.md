# Exemplo de Uso

Passo a passo de utilização da aplicação.

## Passo 1 — Carregamento inicial

Ao acessar a URL da aplicação no GitHub Pages, é exibida uma tela de carregamento. O sistema executa o `fetch` de cada arquivo CSV em sequência, mostrando o nome do arquivo atual e o total acumulado de registros. Após o carregamento, os dados são agregados e a página é populada com os valores reais.

## Passo 2 — Panorama nacional

Os cards de resumo exibem:

- Total de registros CAT carregados
- Número de fatalidades registradas
- Período coberto pelos dados

Abaixo, dois gráficos de barras horizontais mostram as 8 profissões com mais acidentes e a distribuição por faixa etária, ambos calculados diretamente a partir do Heap.

## Passo 3 — Busca por município

O usuário digita o nome (ou parte do nome) de um município no campo de busca.

- O autocomplete exibe até 6 sugestões
- Navegação pelas sugestões com as teclas ↑ / ↓
- Seleção com `Enter` ou clique
- A tabela filtra automaticamente, pois os dados já foram processados

## Passo 4 — Tabela de resultados

A tabela exibe os municípios ordenados por fatalidades, com colunas:

- Município
- UF
- Total de acidentes
- Fatalidades
- Período

Paginação com 10 registros por página e controles de navegação.

## Passo 5 — Modal do município

Ao clicar em qualquer linha da tabela, é exibido um modal com:

- Total de acidentes
- Fatalidades
- Profissão mais afetada (com nome legível do CBO)
- Gráfico de linha com a evolução anual de acidentes no período

## Passo 6 — Sobre o projeto

O botão **"Sobre o projeto"**, no cabeçalho, abre um modal com mais detalhes sobre objetivos, estruturas implementadas e fonte dos dados.
