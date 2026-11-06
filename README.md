# Radar99 — Plataforma de Pauta e Síntese Radiofônica (99.9 FM Educativa)

Plataforma web fullstack voltada para radialistas e locutores de bancada matinal. Realiza ingestão resiliente de notícias (RSS/Atom e HTML scraping via Cheerio) dos últimos 5 dias, filtra estritamente as editorias **Educação ★**, **Saúde ★**, **Meio Ambiente**, **Cultura** e **Esporte**, e sintetiza leads radiofônicos prontos para leitura ao vivo utilizando **Google Gemini 1.5 Flash** (`@google/genai`).

## Stack Tecnológica
- **Framework:** Next.js 14 (App Router, TypeScript Strict Mode)
- **Estilização:** Tailwind CSS (Dark Mode de alto contraste `#0d0f11`) + `lucide-react`
- **Autenticação & Persistência:** Firebase Authentication (Google Sign-In) + Google Cloud Firestore (com fallback automático de contingência local em `.radar99-data.json`)
- **IA Generativa:** Google Gemini 1.5 Flash via SDK oficial `@google/genai` com Structured JSON Output
- **Infraestrutura Cloud:** Docker Standalone + Google Cloud Run (`cloudbuild.yaml`)

## Como Executar Localmente

1. Configure as variáveis de ambiente copiando `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Instale as dependências e inicie o servidor de desenvolvimento:
   ```bash
   npm install
   npm run dev
   ```
3. Acesse `http://localhost:3000`.

## Deploy no Google Cloud Run

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION="southamerica-east1",_REPO_NAME="radar99-repo"
```
Ou diretamente via CLI do Cloud Run:
```bash
gcloud run deploy radar99 --source . --region southamerica-east1 --allow-unauthenticated
```

