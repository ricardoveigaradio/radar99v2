# SPEC.md - Radar99

## 1. Visão Geral
O **Radar99** é uma plataforma web fullstack voltada para radialistas e locutores de bancada matinal (como o Jornal na 99.9 FM Educativa). O sistema realiza ingestão de notícias a partir de portais regionais, institucionais e governamentais via botão de sincronização ("Varrer agora"), filtra publicações dos últimos 5 dias focando prioritariamente em Educação e Saúde (além de Meio Ambiente, Cultura e Esporte), e utiliza o modelo Google Gemini para transformar cada matéria em um lead radiofônico sintetizado, pronto para locução direta ao vivo.

---

## 2. Escopo Delimitado

### In-Scope (Nesta versão)
- **Autenticação Multi-usuário:** Login social obrigatório via Google Authentication (Firebase Auth / Google Identity Platform).
- **Ingestão Sob Demanda:** Disparo de varredura exclusivamente via clique no botão "Varrer agora".
- **Janela Temporal Restrita:** Descarte obrigatório de qualquer notícia publicada há mais de 5 dias corridos em relação ao momento da execução.
- **Filtragem Temática Estrita:** Apenas matérias classificadas em: Educação (prioritária), Saúde (prioritária), Meio Ambiente, Cultura ou Esporte. Qualquer outra editoria (ex: policial, política partidária pura, fofoca) deve ser sumariamente descartada pelo LLM.
- **Processamento com IA (Google Gemini 1.5 Flash):** Extração de título adaptado para rádio, identificação de fonte, data original da publicação no veículo e geração de lead radiofônico fluído em ordem direta para respiração natural no microfone.
- **Interface Otimizada para Locução:**
  - Dark Mode de alto contraste padrão estúdio.
  - Controle tipográfico de tamanho de texto (`- Aa +`).
  - Abas de filtragem rápida por editoria: "Todas", "Educação ★", "Saúde ★", "Meio Ambiente", "Cultura", "Esporte".
  - Barra de busca textual por palavra-chave ou veículo.
  - Ações no card: "Copiar p/ locução" com clipboard toast e "Marcar lida".
- **Comportamento de Card Lido:** Ao clicar em "Marcar lida", o card recebe opacidade reduzida, borda de status e é reordenado para o fim absoluto da listagem.
- **Ordenação Principal:** Cards não-lidos ordenados decrescentemente pela data de publicação original da matéria no veículo (mais recente primeiro).
- **Gerenciador de Fontes (Modal/Tela):** Listagem das fontes cadastradas com visualização de status, permitindo adição e remoção de URLs.
- **Estratégia de Scraping Resiliente:** 
  - RSS/Atom parser prioritário para os portais compatíveis.
  - Web scraping estruturado (Cheerio/Playwright) com fallback de headers e extração semântica.
  - Para feeds sociais/Instagram sem API aberta oficial: isolamento em fila resiliente; em caso de bloqueio/403/login wall, a fonte registra falha no log de sync sem interromper o restante do pipeline.

### Out-of-Scope (Definitivamente fora desta versão)
- Disparos automáticos por agendador cron/Cloud Scheduler (mantido 100% sob demanda).
- Geração de áudio sintetizado / Text-to-Speech (TTS).
- Integração bidirecional com redes sociais para postagem automática.
- Editor de texto avançado (Rich Text) para alterar matérias salvas (apenas leitura e cópia).

---

## 3. User Stories & Critérios de Aceite (Acceptance Criteria)

### US1: Autenticação Google
**Como** radialista ou membro da equipe do estúdio,  
**Eu quero** autenticar com minha conta Google,  
**Para que** somente operadores autorizados acessem a pauta e o histórico de leitura do estúdio.
- **AC 1.1:** Usuários não autenticados que acessarem qualquer rota privada devem ser redirecionados à tela de login.
- **AC 1.2:** A tela de login deve fornecer botão padronizado "Entrar com Google".
- **AC 1.3:** Sessão deve persistir em LocalStorage/Cookies seguros para evitar deslogamento no meio da transmissão ao vivo.

### US2: Varredura e Ingestão de Pautas Recentes
**Como** locutor,  
**Eu quero** clicar em "Varrer agora" ao chegar ao estúdio,  
**Para que** o sistema busque e processe as notícias publicadas nos últimos 5 dias nos portais configurados.
- **AC 2.1:** O backend deve iterar por todas as fontes ativas cadastradas.
- **AC 2.2:** O parser deve extrair a data de publicação (`published_at`). Se a data for anterior a 5 dias atrás (`now - 5 days`), o item é imediatamente descartado.
- **AC 2.3:** Apenas matérias aprovadas pelo filtro de relevância (Educação, Saúde, Meio Ambiente, Cultura, Esporte) devem ser persistidas no Firestore/Banco.
- **AC 2.4:** Notícias já ingeridas em varreduras anteriores (identificadas por hash da URL original) não devem ser duplicadas.
- **AC 2.5:** O botão "Varrer agora" deve apresentar estado visual de carregamento (spinner/disabled) até o término da requisição.

### US3: Formatação e Leitura Radiofônica
**Como** locutor ao vivo no microfone,  
**Eu quero** ler um lead fluido, objetivo e em ordem direta,  
**Para que** a comunicação com o ouvinte seja clara e compreensível sem esforço de improviso.
- **AC 3.1:** Cada card deve exibir: Badge colorido da editoria, Nome da Fonte, Data/Hora da matéria original, Título adaptado, Lead radiofônico (1 parágrafo respondendo quem, o quê, quando, onde e por quê), Link externo para a matéria original.
- **AC 3.2:** O botão "Copiar p/ locução" deve copiar o texto formatado para a área de transferência e exibir badge temporário "Copiado!".
- **AC 3.3:** O seletor tipográfico `- Aa +` deve alterar dinamicamente o tamanho da fonte do corpo do lead nos cards (mínimo 14px, padrão 16px, máximo 22px).

### US4: Gestão da Fila ao Vivo (Lida vs. Pendente)
**Como** apresentador durante a roda de notícias,  
**Eu quero** marcar um card como lido,  
**Para que** ele saia da minha linha de visão imediata e não seja repetido no programa.
- **AC 4.1:** Ao clicar em "Marcar lida", o estado `is_read` passa para `true`.
- **AC 4.2:** O card lido deve receber estilo com opacidade atenuada (ex: `opacity-50`) e o botão passa a exibir "Lida ✓".
- **AC 4.3:** A lista deve aplicar ordenação composta imediata:
  1. Primeiro: Cards não-lidos (`is_read == false`), ordenados por `published_at` decrescente.
  2. Segundo: Cards lidos (`is_read == true`), ordenados por `read_at` ou `published_at` no final da lista.
- **AC 4.4:** O estado lido/não-lido deve ser sincronizado com a base de dados em tempo real ou persistido localmente vinculado ao ID do usuário.

---

## 4. Tratamento de Erros e Resiliência
- **Erros de Scraping (HTTP 403, 404, Timeout ou Cloudflare):** Cada fonte deve ser processada em bloco isolado (`try/catch`). Se uma fonte falhar, o erro é registrado no log da sincronização com a URL e timestamp, permitindo que as demais fontes continuem a ser ingeridas.
- **Falha de Extração de Instagram:** Perfis de rede social bloqueados por login-wall não devem travar o pipeline. O coletor marca a fonte com status de aviso (`warning: login required`) no painel de fontes.
- **Cota ou Timeout da API do Gemini:** Implementar fallback com retry exponencial (máximo 2 tentativas). Se a IA falhar na síntese, salvar a notícia com título original e primeiro parágrafo cru marcado com flag `needs_review: true`.
- **Feedback na UI:** Toast discreto informando o resultado da varredura: *"Varredura concluída: X novas matérias adicionadas (Y fontes inacessíveis)"*.