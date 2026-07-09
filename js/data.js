// ============================================================
// data.js — Dados hardcoded (substituir pelo loader de CSV real)
// ============================================================

// Dados por município
const MUNICIPIOS_DATA = [
  {
    municipio: "São Paulo",     uf: "SP", acidentes: 48312, fatalidades: 127, periodo: "2019-2023",
    populacaoOcupada: 5800000,
    profissaoMaisAfetada: "Operador de Produção",
    tipoMaisComum: "Típico",
    evolucao: [8200, 9100, 7800, 11400, 11812],
  },
  {
    municipio: "Rio de Janeiro", uf: "RJ", acidentes: 29841, fatalidades: 98, periodo: "2019-2023",
    populacaoOcupada: 3100000,
    profissaoMaisAfetada: "Auxiliar de Serviços Gerais",
    tipoMaisComum: "Típico",
    evolucao: [5200, 5800, 4900, 7100, 6841],
  },
  {
    municipio: "Belo Horizonte", uf: "MG", acidentes: 18204, fatalidades: 61, periodo: "2019-2023",
    populacaoOcupada: 1400000,
    profissaoMaisAfetada: "Pedreiro",
    tipoMaisComum: "Típico",
    evolucao: [3100, 3500, 2900, 4300, 4404],
  },
  {
    municipio: "Porto Alegre",  uf: "RS", acidentes: 14673, fatalidades: 44, periodo: "2019-2023",
    populacaoOcupada: 870000,
    profissaoMaisAfetada: "Motorista de Caminhão",
    tipoMaisComum: "Trajeto",
    evolucao: [2600, 2900, 2500, 3400, 3273],
  },
  {
    municipio: "Curitiba",      uf: "PR", acidentes: 16541, fatalidades: 52, periodo: "2019-2023",
    populacaoOcupada: 1020000,
    profissaoMaisAfetada: "Operador de Máquinas",
    tipoMaisComum: "Típico",
    evolucao: [2900, 3200, 2700, 3900, 3841],
  },
  {
    municipio: "Salvador",      uf: "BA", acidentes: 10298, fatalidades: 37, periodo: "2019-2023",
    populacaoOcupada: 890000,
    profissaoMaisAfetada: "Pedreiro",
    tipoMaisComum: "Típico",
    evolucao: [1800, 2000, 1700, 2400, 2398],
  },
  {
    municipio: "Recife",        uf: "PE", acidentes: 9874,  fatalidades: 33, periodo: "2019-2023",
    populacaoOcupada: 780000,
    profissaoMaisAfetada: "Auxiliar de Serviços Gerais",
    tipoMaisComum: "Típico",
    evolucao: [1700, 1900, 1600, 2300, 2374],
  },
  {
    municipio: "Fortaleza",     uf: "CE", acidentes: 11203, fatalidades: 40, periodo: "2019-2023",
    populacaoOcupada: 1050000,
    profissaoMaisAfetada: "Operador de Produção",
    tipoMaisComum: "Trajeto",
    evolucao: [1900, 2200, 1900, 2600, 2603],
  },
  {
    municipio: "Campinas",      uf: "SP", acidentes: 12045, fatalidades: 29, periodo: "2019-2023",
    populacaoOcupada: 680000,
    profissaoMaisAfetada: "Operador de Máquinas",
    tipoMaisComum: "Típico",
    evolucao: [2100, 2400, 2000, 2800, 2745],
  },
  {
    municipio: "Manaus",        uf: "AM", acidentes: 7831,  fatalidades: 28, periodo: "2019-2023",
    populacaoOcupada: 610000,
    profissaoMaisAfetada: "Operador de Produção",
    tipoMaisComum: "Típico",
    evolucao: [1300, 1500, 1200, 1900, 1931],
  },
  {
    municipio: "Goiânia",       uf: "GO", acidentes: 8902,  fatalidades: 25, periodo: "2019-2023",
    populacaoOcupada: 720000,
    profissaoMaisAfetada: "Motorista de Caminhão",
    tipoMaisComum: "Trajeto",
    evolucao: [1500, 1700, 1400, 2100, 2202],
  },
  {
    municipio: "Florianópolis", uf: "SC", acidentes: 5214,  fatalidades: 12, periodo: "2019-2023",
    populacaoOcupada: 310000,
    profissaoMaisAfetada: "Auxiliar de Serviços Gerais",
    tipoMaisComum: "Típico",
    evolucao: [880, 980, 820, 1230, 1304],
  },
  {
    municipio: "Vitória",       uf: "ES", acidentes: 4302,  fatalidades: 11, periodo: "2019-2023",
    populacaoOcupada: 220000,
    profissaoMaisAfetada: "Estivador",
    tipoMaisComum: "Típico",
    evolucao: [720, 810, 680, 1020, 1072],
  },
  {
    municipio: "Belém",         uf: "PA", acidentes: 6103,  fatalidades: 19, periodo: "2019-2023",
    populacaoOcupada: 480000,
    profissaoMaisAfetada: "Pedreiro",
    tipoMaisComum: "Típico",
    evolucao: [1020, 1150, 970, 1450, 1513],
  },
  {
    municipio: "Natal",         uf: "RN", acidentes: 3987,  fatalidades: 9,  periodo: "2019-2023",
    populacaoOcupada: 290000,
    profissaoMaisAfetada: "Auxiliar de Serviços Gerais",
    tipoMaisComum: "Trajeto",
    evolucao: [660, 750, 630, 950, 997],
  },
];

// Dados nacionais — profissões mais afetadas
const PROFISSOES_NACIONAL = [
  { label: "Op. de Produção",       valor: 312400 },
  { label: "Pedreiro",              valor: 287100 },
  { label: "Motorista de Caminhão", valor: 241800 },
  { label: "Aux. Serviços Gerais",  valor: 198600 },
  { label: "Op. de Máquinas",       valor: 176300 },
  { label: "Eletricista",           valor: 134700 },
  { label: "Estivador",             valor: 98200  },
  { label: "Enfermeiro/Técnico",    valor: 87400  },
];

// Dados nacionais — distribuição por faixa etária
const FAIXA_ETARIA_NACIONAL = [
  { label: "18-24",  valor: 187400 },
  { label: "25-34",  valor: 498700 },
  { label: "35-44",  valor: 612300 },
  { label: "45-54",  valor: 489100 },
  { label: "55-64",  valor: 287600 },
  { label: "65+",    valor: 89300  },
];

// Anos cobertos (para o mini-gráfico de evolução)
const ANOS = [2019, 2020, 2021, 2022, 2023];
