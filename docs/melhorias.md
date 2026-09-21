# Limitações e Ideias de Melhorias

## Limitações Atuais

- **Ausência de taxa relativa de acidentes**: a falta de dados de população ocupada por município impede o cálculo de acidentes por 100 mil trabalhadores, indicador mais representativo que o volume absoluto. Optou-se por não usar fontes externas, para manter o foco nos dados do próprio portal.
- **Carregamento sem cache**: a aplicação carrega todos os dados no navegador a cada acesso. Conforme o período coberto cresce, isso pode se tornar um desafio de desempenho.
- **Inconsistência de nomes de municípios**: o parsing atual não normaliza todas as variações de grafia usadas ao longo dos anos de arquivos, resultando em municípios duplicados. Atualmente a tabela apresenta 5.751 municípios, alguns repetidos por falta de um padrão consistente entre os anos.

## Ideias de Melhorias Futuras

- Implementar cache no navegador (ex.: `localStorage`/`IndexedDB` ou Service Worker) para acelerar carregamentos subsequentes e permitir cobertura de um período maior
- Curadoria mais minuciosa dos dados na etapa de coleta, agrupando corretamente todas as variações de nomes de municípios
- Buscar, no futuro, fontes complementares de dados de população ocupada para viabilizar indicadores relativos (taxa por 100 mil trabalhadores)
