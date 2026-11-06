# SKILLS.md - Regras de Execução para o Agente Codificador

## 1. Bibliotecas e Tecnologias Permitidas
- **Linguagem & Runtime:** TypeScript (modo estrito obrigatório), Node.js 20+.
- **Framework:** Next.js (App Router) ou Vite + React.
- **Estilização:** Tailwind CSS (não utilize CSS-in-JS ou styled-components).
- **Componentes Base:** Radix UI primitives / Shadcn/UI (Tailwind puro).
- **Ícones:** `lucide-react`.
- **Backend & Cloud:**
  - `@google/genai` (SDK Google Gemini).
  - `firebase` e `firebase-admin` para Auth e Firestore.
  - `cheerio` e `rss-parser` para ingestão web.
  - `date-fns` para manipulação e cálculos de datas (janela de 5 dias).

---

## 2. Padrões de Código e Arquitetura

### TypeScript & Tipagem
- **Zero `any`:** Não utilize `any`. Todas as estruturas de dados (notícias, fontes, respostas da IA) devem possuir interfaces ou types estritos.
- **Tipos de Modelo:**
```typescript
export type EditorialCategory = 'Educação' | 'Saúde' | 'Meio Ambiente' | 'Cultura' | 'Esporte';

export interface NewsItem {
  id: string;
  title: string;
  radio_headline: string;
  radio_lead: string;
  source_name: string;
  source_url: string;
  published_at: string; // ISO 8601
  captured_at: string;  // ISO 8601
  category: EditorialCategory;
  is_read: boolean;
  read_at?: string | null;
}

###Princípios de Código
- Early Returns: Prefira saídas precoces e tratamento de guarda para reduzir aninhamentos de if/else.
- Funções Puras no Scraper: Funções de limpeza de HTML, extração de texto e parsing de datas devem ser puras e isoladas de efeitos colaterais.
- Resiliência Total no Scraping: Nenhuma chamada de rede externa (HTTP fetch) pode executar sem bloco try/catch individual e timeout configurado (máximo 8 segundos por portal). O fracasso de uma URL nunca pode derrubar a execução das outras.

## 3. Diretrizes de Prompting e Formatação para o Google Gemini

### Ao configurar a chamada para o modelo Gemini no backend:
- Utilize sempre responseMimeType: "application/json".
- Assegure que as regras de redação de lead radiofônico sejam explícitas no system prompt:

Redigir em parágrafo único de 3 a 5 linhas.
Voz ativa e ordem direta: Sujeito + Verbo + Predicado.
Priorizar clareza auditiva: sem vírgulas excessivas ou intercalações longas.
Números ordinais e cardinais complexos devem ser convertidos por extenso para leitura imediata (ex: "vinte e cinco mil", "segundo semestre").

## 4. Diretrizes de Comportamento para o Agente Codificador

### Foco Granular: Execute estritamente uma task do PLAN.md por vez. Não refatore partes do sistema que não pertencem à tarefa ativa.

### Fidelidade ao Design: Reproduza estritamente a paleta e os elementos da referência visual: Dark Mode profundo, tipografia branca de alto contraste, badges de cor vibrante ("SAÚDE" verde, "EDUCAÇÃO" azul), botões laranjas de ação primária e cinza escuro para ações secundárias.

### Validação Sequencial: Antes de marcar uma task como concluída, certifique-se de que o código compila sem erros de linter ou tipagem (tsc --noEmit).