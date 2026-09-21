const MUNICIPIOS_DATA = [
  {
    municipio: "São Paulo",     uf: "SP", acidentes: 0, fatalidades: 0, periodo: "2022-2026",
    populacaoOcupada: 99999,
    profissaoMaisAfetada: "Operador de Produção",
    tipoMaisComum: "Típico",
    evolucao: [0, 0, 0, 0, 0],
  },
  {
    municipio: "Rio de Janeiro", uf: "RJ", acidentes: 0, fatalidades: 0, periodo: "2022-2026",
    populacaoOcupada: 99999,
    profissaoMaisAfetada: "Auxiliar de Serviços Gerais",
    tipoMaisComum: "Típico",
    evolucao: [0, 0, 0, 0, 0],
  },
  {
    municipio: "Porto Alegre",  uf: "RS", acidentes: 0, fatalidades: 0, periodo: "2022-2026",
    populacaoOcupada: 99999,
    profissaoMaisAfetada: "Motorista de Caminhão",
    tipoMaisComum: "Trajeto",
    evolucao: [0, 0, 0, 0, 0],
  },

];

const PROFISSOES_NACIONAL = [
  { label: "-",       valor: 0 },
  { label: "-",              valor: 0 },
  { label: "-", valor: 0 },
  { label: "-",  valor: 0 },
  { label: "-",       valor: 0 },
  { label: "-",           valor: 0 },
  { label: "-",             valor: 0  },
  { label: "-",    valor: 0  },
];

const FAIXA_ETARIA_NACIONAL = [
  { label: "18-24",  valor: 0 },
  { label: "25-34",  valor: 0 },
  { label: "35-44",  valor: 0 },
  { label: "45-54",  valor: 0 },
  { label: "55-64",  valor: 0 },
  { label: "65+",    valor: 0  },
];

const ANOS = [2022, 2023, 2024, 2025, 2026];