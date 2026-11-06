import type { Source, NewsItem } from "@/types";

export const DEFAULT_SOURCES: Source[] = [
  // Governo Federal (Educação, Saúde, Meio Ambiente, Cultura, Esporte)
  {
    id: "src-agencia-brasil",
    name: "Agência Brasil (EBC)",
    url: "https://agenciabrasil.ebc.com.br",
    rss_url: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml",
    group: "Governo Federal",
    active: true,
    is_social: false,
    last_status: "ok",
    last_error: null,
  },
  {
    id: "src-mec-gov",
    name: "Ministério da Educação (MEC)",
    url: "https://www.gov.br/mec/pt-br/assuntos/noticias",
    rss_url: null,
    group: "Governo Federal",
    active: true,
    is_social: false,
    last_status: "ok",
    last_error: null,
  },
  {
    id: "src-saude-gov",
    name: "Ministério da Saúde",
    url: "https://www.gov.br/saude/pt-br/assuntos/noticias",
    rss_url: null,
    group: "Governo Federal",
    active: true,
    is_social: false,
    last_status: "ok",
    last_error: null,
  },
  {
    id: "src-mma-gov",
    name: "Ministério do Meio Ambiente (MMA)",
    url: "https://www.gov.br/mma/pt-br/assuntos/noticias",
    rss_url: null,
    group: "Governo Federal",
    active: true,
    is_social: false,
    last_status: "ok",
    last_error: null,
  },

  // Faculdades e Universidades
  {
    id: "src-jornal-usp",
    name: "Jornal da USP",
    url: "https://jornal.usp.br",
    rss_url: "https://jornal.usp.br/feed/",
    group: "Faculdades",
    active: true,
    is_social: false,
    last_status: "ok",
    last_error: null,
  },
  {
    id: "src-unb-noticias",
    name: "UnB Notícias",
    url: "https://noticias.unb.br",
    rss_url: null,
    group: "Faculdades",
    active: true,
    is_social: false,
    last_status: "ok",
    last_error: null,
  },
  {
    id: "src-ufrj-noticias",
    name: "Conexão UFRJ",
    url: "https://conexao.ufrj.br",
    rss_url: "https://conexao.ufrj.br/feed/",
    group: "Faculdades",
    active: true,
    is_social: false,
    last_status: "ok",
    last_error: null,
  },

  // Portais Regionais e Educação/Saúde
  {
    id: "src-g1-educacao",
    name: "G1 Educação",
    url: "https://g1.globo.com/educacao/",
    rss_url: "https://g1.globo.com/rss/g1/educacao/",
    group: "Regionais",
    active: true,
    is_social: false,
    last_status: "ok",
    last_error: null,
  },
  {
    id: "src-g1-saude",
    name: "G1 Ciência e Saúde",
    url: "https://g1.globo.com/ciencia-e-saude/",
    rss_url: "https://g1.globo.com/rss/g1/ciencia-e-saude/",
    group: "Regionais",
    active: true,
    is_social: false,
    last_status: "ok",
    last_error: null,
  },

  // Redes Sociais / Instagram Institucional (monitoramento de Login Wall)
  {
    id: "src-insta-mec",
    name: "Instagram @mineducacao",
    url: "https://www.instagram.com/mineducacao/",
    rss_url: null,
    group: "Redes Sociais",
    active: true,
    is_social: true,
    last_status: "login_wall",
    last_error: "warning: login required (Instagram bloqueou acesso anônimo)",
  },
];

export function getInitialSeedNews(): NewsItem[] {
  const now = Date.now();
  const oneHourAgo = new Date(now - 1 * 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
  const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000).toISOString();
  const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000).toISOString();
  const eightHoursAgo = new Date(now - 8 * 60 * 60 * 1000).toISOString();
  const twelveHoursAgo = new Date(now - 12 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "news-seed-1",
      title:
        "MEC amplia programa Pé-de-Meia e garante incentivo financeiro para mais um milhão de estudantes do ensino médio",
      radio_headline:
        "Ministério da Educação amplia Pé-de-Meia para mais um milhão de alunos da rede pública",
      radio_lead:
        "O Ministério da Educação anunciou nesta semana a ampliação do programa Pé-de-Meia para mais um milhão de estudantes do ensino médio público em todo o país. A iniciativa garante o depósito mensal de duzentos reais como poupança educacional para combater a evasão escolar e incentivar a conclusão dos estudos. Os novos contemplados começam a receber o benefício já no próximo calendário de pagamentos da Caixa Econômica Federal.",
      source_name: "Ministério da Educação (MEC)",
      source_url: "https://www.gov.br/mec/pt-br/assuntos/noticias/pe-de-meia-ampliacao",
      published_at: oneHourAgo,
      captured_at: oneHourAgo,
      category: "Educação",
      is_read: false,
      read_at: null,
    },
    {
      id: "news-seed-2",
      title:
        "Ministério da Saúde inicia mobilização nacional de atualização da caderneta de vacinação nas escolas públicas",
      radio_headline:
        "Saúde leva mutirão de vacinação para dentro das escolas públicas em todo o país",
      radio_lead:
        "O Ministério da Saúde deu início à campanha nacional de multivacinação diretamente nas escolas da rede pública de ensino. A ação busca imunizar crianças e adolescentes menores de quinze anos contra doenças como poliomielite, sarampo, meningite e febre amarela. Os pais ou responsáveis devem enviar a caderneta de vacinação atualizada e o termo de autorização assinado para as unidades escolares.",
      source_name: "Ministério da Saúde",
      source_url: "https://www.gov.br/saude/pt-br/assuntos/noticias/vacinacao-nas-escolas",
      published_at: twoHoursAgo,
      captured_at: oneHourAgo,
      category: "Saúde",
      is_read: false,
      read_at: null,
    },
    {
      id: "news-seed-3",
      title:
        "Pesquisadores de universidades públicas desenvolvem sensor portátil de baixo custo para detectar dengue em quinze minutos",
      radio_headline:
        "Universidades públicas criam sensor rápido que detecta o vírus da dengue em quinze minutos",
      radio_lead:
        "Pesquisadores do Jornal da USP em parceria com laboratórios federais desenvolveram um biossensor portátil capaz de diagnosticar a dengue em apenas quinze minutos. O equipamento tem custo estimado em menos de dez reais por teste e utiliza apenas uma gota de soro sanguíneo para identificar a infecção logo nos primeiros dias de sintomas. A tecnologia aguarda agora a certificação da Anvisa para distribuição nos postos do Sistema Único de Saúde.",
      source_name: "Jornal da USP",
      source_url: "https://jornal.usp.br/ciencias/sensor-portatil-detecta-dengue/",
      published_at: fourHoursAgo,
      captured_at: twoHoursAgo,
      category: "Saúde",
      is_read: false,
      read_at: null,
    },
    {
      id: "news-seed-4",
      title:
        "Programa de recuperação de nascentes planta trezentas mil mudas nativas em bacias hidrográficas estratégicas",
      radio_headline:
        "Mutirão ambiental planta trezentas mil árvores nativas para recuperar nascentes",
      radio_lead:
        "O Ministério do Meio Ambiente iniciou o plantio de trezentas mil mudas de espécies nativas para proteger nascentes e matas ciliares em áreas de recarga hídrica. O projeto conta com o apoio de brigadistas, produtores rurais e estudantes de engenharia florestal das universidades federais. O objetivo principal é garantir a segurança hídrica das cidades durante o próximo período de estiagem.",
      source_name: "Ministério do Meio Ambiente (MMA)",
      source_url: "https://www.gov.br/mma/pt-br/assuntos/noticias/recuperacao-nascentes",
      published_at: sixHoursAgo,
      captured_at: fourHoursAgo,
      category: "Meio Ambiente",
      is_read: false,
      read_at: null,
    },
    {
      id: "news-seed-5",
      title:
        "Mostra Universitária de Música e Teatro oferece programação gratuita neste fim de semana nos campi",
      radio_headline:
        "Circuito Universitário de Cultura abre programação gratuita com shows e teatro",
      radio_lead:
        "O Circuito Universitário de Cultura e Arte abre nesta semana uma programação totalmente gratuita com apresentações de orquestras, teatro e cinema nacional. As atividades acontecem nos auditórios abertos à comunidade e reúnem mais de quarenta grupos artísticos estudantis e regionais. Os ingressos podem ser retirados uma hora antes de cada espetáculo na bilheteria local.",
      source_name: "Conexão UFRJ",
      source_url: "https://conexao.ufrj.br/cultura/mostra-universitaria-gratuita",
      published_at: eightHoursAgo,
      captured_at: fourHoursAgo,
      category: "Cultura",
      is_read: false,
      read_at: null,
    },
    {
      id: "news-seed-6",
      title:
        "Jogos Universitários e Escolares batem recorde de inscrições com mais de cinco mil atletas estudantis",
      radio_headline:
        "Jogos Estudantis batem recorde com cinco mil jovens atletas inscritos na temporada",
      radio_lead:
        "A nova edição dos Jogos Escolares e Universitários registrou recorde histórico com mais de cinco mil estudantes inscritos em dezoito modalidades olímpicas e paralímpicas. As competições de atletismo, natação, futsal e vôlei começam nesta semana nos ginásios poliesportivos da rede pública. A entrada para a torcida e familiares é gratuita em todas as arenas.",
      source_name: "Agência Brasil (EBC)",
      source_url: "https://agenciabrasil.ebc.com.br/esportes/noticia/jogos-estudantis-recorde",
      published_at: twelveHoursAgo,
      captured_at: sixHoursAgo,
      category: "Esporte",
      is_read: true,
      read_at: twoHoursAgo,
    },
  ];
}

