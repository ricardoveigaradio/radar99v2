# PLAN.md - Radar99

## 1. Decisões de Arquitetura (Research & Rationale)
- **Monorepo / Fullstack Framework:** Next.js 14+ (App Router) ou Vite + React com Node/Express backend. Escolha recomendada para o ecossistema Google Cloud: **Next.js 14 (TypeScript)** hospedado no **Google Cloud Run** ou integrado via **Firebase App Hosting / Firebase Cloud Functions**, permitindo API routes serverless e renderização rápida.
- **Persistência de Dados:** **Google Cloud Firestore**. Banco NoSQL gerenciado nativo do ecossistema Google, ideal para leitura rápida de cards, queries de ordenação simples por data e escrita atômica de pautas.
- **Autenticação:** **Firebase Authentication (Google Identity Platform)** com provedor Google OAuth 2.0 nativo.
- **Processamento de IA:** SDK oficial `@google/genai` utilizando o modelo `gemini-1.5-flash` para latência ultra-baixa, baixo custo e suporte a chamadas de Structured JSON Outputs.
- **Mecanismo de Scraping:** 
  - `rss-parser` para ingestão imediata e sem atrito de portais com RSS disponível.
  - `cheerio` + `axios`/`fetch` com headers de rotação padrão (User-Agent de navegador moderno) para portais convencionais.
  - Isolamento de coletores por Promise.allSettled para garantir resiliência total.

---

## 2. Tech Stack
- **Linguagem:** TypeScript (Strict Mode).
- **Frontend:** React 18, Tailwind CSS, Lucide React (ícones), Shadcn/UI primitives.
- **Backend:** Next.js Route Handlers (`/api/sync-news`, `/api/sources`).
- **Banco de Dados:** Google Cloud Firestore.
- **Autenticação:** Firebase Auth (Google Sign-In).
- **IA / LLM:** Google Gemini 1.5 Flash via SDK oficial do Google.
- **Infraestrutura / Cloud:** Google Cloud Run + Artifact Registry (ou Firebase App Hosting).

---

## 3. Task Breakdown (Tarefas Atômicas e Sequenciais)

### Etapa 1: Configuração do Projeto e Credenciais Google
- [x] **Task 1.1:** Inicializar projeto Next.js com TypeScript, Tailwind CSS e ESLint configurados.
- [x] **Task 1.2:** Configurar SDK do Firebase (`firebase/app`, `firebase/auth`, `firebase/firestore`) e criar arquivo de inicialização de cliente e admin (`lib/firebase.ts` e `lib/firebase-admin.ts`).
- [x] **Task 1.3:** Configurar variáveis de ambiente (`.env.example` e `.env.local`) contendo: `GOOGLE_AI_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, chaves públicas de cliente do Firebase.

### Etapa 2: Autenticação Google e Controle de Acesso
- [x] **Task 2.1:** Implementar Contexto de Autenticação (`AuthContext.tsx`) com métodos de login com Google (`signInWithPopup`), logout e monitoramento de estado `onAuthStateChanged`.
- [x] **Task 2.2:** Criar tela de Login (`/login`) com layout Dark Mode, logo Radar99 e botão "Entrar com Google".
- [x] **Task 2.3:** Implementar Middleware ou Higher-Order Component (HOC) de rota protegida que redireciona usuários não autenticados para `/login`.

### Etapa 3: Modelagem e Persistência no Firestore
- [x] **Task 3.1:** Definir interfaces TypeScript estritas em `types/index.ts`: `Source`, `NewsItem`, `Category`, `SyncLog`.
- [x] **Task 3.2:** Criar script/seed de inicialização de fontes no Firestore com a lista padrão de URLs fornecida (Regionais, Faculdades, Governo Federal).
- [x] **Task 3.3:** Criar funções auxiliares do Firestore em `services/newsService.ts`: `getNews(dateLimit)`, `markAsRead(id, isRead)`, `getSources()`, `addSource(source)`.

### Etapa 4: Motor de Ingestão e Scraping Resiliente
- [x] **Task 4.1:** Implementar módulo detector de feeds (`lib/scraper/feedDetector.ts`) que valida se uma URL tem feed RSS/Atom ativo.
- [x] **Task 4.2:** Implementar coletor RSS com `rss-parser` (`lib/scraper/rssCollector.ts`) capturando `title`, `link`, `pubDate` e `contentSnippet`.
- [x] **Task 4.3:** Implementar coletor HTML com `cheerio` (`lib/scraper/htmlCollector.ts`) com headers de requisição simulando desktop para sites sem RSS.
- [x] **Task 4.4:** Implementar filtro de corte temporal (`lib/scraper/dateFilter.ts`) descartando itens com `pubDate` anterior a 5 dias atrás (`Date.now() - 5 * 24 * 60 * 60 * 1000`).
- [x] **Task 4.5:** Criar wrapper coletor principal (`lib/scraper/index.ts`) executando todas as fontes em paralelo com `Promise.allSettled`, capturando exceções individualmente para não interromper a execução.

### Etapa 5: Pipeline de Síntese Radiofônica com Google Gemini
- [x] **Task 5.1:** Criar cliente do Gemini configurado para Structured Output (`lib/ai/geminiClient.ts`) com schema JSON obrigatório contendo: `titulo_radio`, `editoria`, `lead_radiofonico`, `aprovado`.
- [x] **Task 5.2:** Elaborar prompt de sistema estrito para o Gemini:
  - Filtrar estritamente: "Educação", "Saúde", "Meio Ambiente", "Cultura", "Esporte". Descartar outros temas retornando `aprovado: false`.
  - Redigir `lead_radiofonico` em tom de locução jornalística, ordem direta, números por extenso quando aplicável, sem pontuações difíceis.
- [x] **Task 5.3:** Criar endpoint de API `/api/sync-news` (POST) que orquestra: Coletar URLs -> Filtrar últimos 5 dias -> Enviar ao Gemini -> Salvar no Firestore evitando duplicatas de URL.

### Etapa 6: Frontend - Layout Base e Barra Superior
- [x] **Task 6.1:** Implementar layout mestre com tema escuro fixo padrão estúdio (fundo `#0d0f11` ou similar de alto contraste)[cite: 1].
- [x] **Task 6.2:** Criar cabeçalho com Badge pulsante "NO AR", título "Radar99", data do dia formatada (ex: "QUARTA-FEIRA, 4 DE NOVEMBRO") e subtítulo "Pauta do dia"[cite: 1].
- [x] **Task 6.3:** Implementar botão de ação primária "Varrer agora" com animação de loading conectada à chamada de `/api/sync-news`[cite: 1].
- [x] **Task 6.4:** Implementar botões de controle de zoom tipográfico (`- Aa +`) controlando variável CSS ou estado global de escala de fonte[cite: 1].
- [x] **Task 6.5:** Criar barra de navegação/abas com contadores de categoria: "Todas", "Educação ★", "Saúde ★", "Meio Ambiente", "Cultura", "Esporte"[cite: 1].

### Etapa 7: Frontend - Cards de Notícia e Interações ao Vivo
- [x] **Task 7.1:** Desenvolver componente `NewsCard.tsx` espelhando exatamente a referência visual[cite: 1]:
  - Badges coloridos por editoria (ex: Verde para Saúde, Azul para Educação)[cite: 1].
  - Nome do veículo/fonte alinhado à direita[cite: 1].
  - Manchete em destaque (negrito alto contraste)[cite: 1].
  - Lead da notícia com espaçamento e entrelinha adequados para leitura no ar[cite: 1].
  - Rodapé com "Capturada às HH:mm" e link "Fonte original ↗"[cite: 1].
- [x] **Task 7.2:** Implementar botão "Copiar p/ locução" com cópia do lead e feedback visual[cite: 1].
- [x] **Task 7.3:** Implementar botão "Marcar lida" que atualiza o estado da notícia[cite: 1].
- [x] **Task 7.4:** Implementar regras de renderização condicional da lista:
  - Cards marcados como lidos ficam com opacidade reduzida e borda de status[cite: 1].
  - Ordenação automática: não-lidas no topo (ordenadas pela data original do site) e lidas deslocadas para o rodapé da lista.

### Etapa 8: Modal de Gestão de Fontes e Alertas de Falha
- [x] **Task 8.1:** Criar botão "Fontes" no cabeçalho abrindo modal responsivo[cite: 1].
- [x] **Task 8.2:** Listar fontes ativas cadastradas com switch para habilitar/desabilitar cada portal.
- [x] **Task 8.3:** Adicionar formulário simples para inclusão de novas URLs de portais.
- [x] **Task 8.4:** Adicionar alerta de status sutil no topo da tela caso portais de redes sociais/Instagram tenham reportado login wall na última varredura[cite: 1].

### Etapa 9: Deploy no Google Cloud
- [x] **Task 9.1:** Criar `Dockerfile` otimizado para produção Next.js.
- [x] **Task 9.2:** Configurar `cloudbuild.yaml` ou comandos diretos de deploy para Google Cloud Run (`gcloud run deploy radar99`).
- [x] **Task 9.3:** Homologar variáveis de ambiente seguras no Cloud Secret Manager ou Cloud Run Environment.
