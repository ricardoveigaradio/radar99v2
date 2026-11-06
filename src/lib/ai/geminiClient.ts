import { GoogleGenAI, Type, type Schema } from "@google/genai";
import type {
  EditorialCategory,
  GeminiRadioSynthesis,
  RawScrapedArticle,
} from "@/types";

const VALID_CATEGORIES: EditorialCategory[] = [
  "Educação",
  "Saúde",
  "Meio Ambiente",
  "Cultura",
  "Esporte",
];

export const RADIO_SYSTEM_PROMPT = `Você é o Editor-Chefe de Radiojornalismo da Rádio 99.9 FM Educativa (Radar99).
Sua missão é avaliar matérias brutas coletadas de portais e transformá-las em notas prontas para locução ao vivo na bancada matinal.

REGRAS ESTRITAS DE FILTRAGEM TEMÁTICA:
1. Aprove APENAS matérias que pertençam estritamente às editorias:
   - "Educação" (prioridade máxima: escolas, universidades, MEC, ENEM, professores, ciência acadêmica, bolsas)
   - "Saúde" (prioridade máxima: SUS, vacinação, hospitais, prevenção, bem-estar público, epidemias, pesquisas médicas)
   - "Meio Ambiente" (clima, preservação, recursos hídricos, sustentabilidade, fauna/flora, parques)
   - "Cultura" (música, teatro, cinema, literatura, museus, eventos culturais gratuitos, patrimônio)
   - "Esporte" (jogos estudantis, esporte comunitário, olimpíadas, atletismo, competições oficiais)
2. Descarte sumariamente (retornando "aprovado": false e "editoria": "Descartar") qualquer matéria sobre:
   - Crimes, ocorrências policiais ou violência urbana;
   - Política partidária pura, brigas eleitorais ou fofocas de celebridades;
   - Economia especulativa ou assuntos fora das 5 editorias permitidas.

REGRAS DE REDAÇÃO DO LEAD RADIOFÔNICO ("lead_radiofonico"):
1. Redigir em PARÁGRAFO ÚNICO de 3 a 5 linhas (aproximadamente 45 a 75 palavras), respondendo quem, o quê, quando, onde e por quê.
2. Voz ativa e ordem direta: Sujeito + Verbo + Predicado.
3. Priorizar clareza auditiva e respiração natural no microfone: frases fluidas, sem vírgulas excessivas, sem parênteses, sem siglas obscuras e sem intercalações longas.
4. Números ordinais e cardinais complexos devem ser convertidos POR EXTENSO para leitura imediata ao vivo (exemplo: "vinte e cinco mil estudantes", "segundo semestre", "duzentos milhões de reais").

REGRAS DO TÍTULO ("titulo_radio"):
1. Manchete curta, direta, em voz ativa e de alto impacto informativo para o locutor bater o olho no estúdio.`;

const RADIO_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    aprovado: {
      type: Type.BOOLEAN,
      description:
        "True somente se a notícia pertencer a Educação, Saúde, Meio Ambiente, Cultura ou Esporte.",
    },
    editoria: {
      type: Type.STRING,
      description:
        "Uma das opções: Educação, Saúde, Meio Ambiente, Cultura, Esporte, ou Descartar.",
    },
    titulo_radio: {
      type: Type.STRING,
      description:
        "Manchete adaptada para leitura rápida no estúdio de rádio.",
    },
    lead_radiofonico: {
      type: Type.STRING,
      description:
        "Lead radiofônico em parágrafo único (3 a 5 linhas), ordem direta, números por extenso, pronto para locução.",
    },
  },
  required: ["aprovado", "editoria", "titulo_radio", "lead_radiofonico"],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Classificador heurístico de contingência caso a API do Gemini falhe após retries ou esteja sem chave configurada.
 */
export function classifyCategoryFallback(
  title: string,
  snippet: string,
  sourceName: string
): EditorialCategory | null {
  const text = `${title} ${snippet} ${sourceName}`.toLowerCase();

  // Descarte imediato de temas proibidos (policial, crime, fofoca)
  if (
    /\b(homic[ií]dio|assassinato|preso|tr[aá]fico|assalto|roubo|fofoca|bbb)\b/i.test(
      text
    )
  ) {
    return null;
  }

  if (
    /\b(educa[cç][aã]o|escola|mec|enem|universidade|usp|ufrj|unb|estudante|aluno|professor|ensino|bolsa|vestibular|aula)\b/i.test(
      text
    )
  ) {
    return "Educação";
  }

  if (
    /\b(sa[uú]de|vacina|sus|hospital|m[eé]dico|dengue|doen[cç]a|tratamento|anvisa|paciente|cl[ií]nica|preven[cç][aã]o)\b/i.test(
      text
    )
  ) {
    return "Saúde";
  }

  if (
    /\b(ambiente|clima|floresta|amaz[oô]nia|sustent[aá]vel|nascente|[aá]gua|reciclagem|biodiversidade|desmatamento|energia limpa|mma)\b/i.test(
      text
    )
  ) {
    return "Meio Ambiente";
  }

  if (
    /\b(cultura|teatro|m[uú]sica|cinema|exposi[cç][aã]o|museu|festival|arte|literatura|livro|orquestra|show)\b/i.test(
      text
    )
  ) {
    return "Cultura";
  }

  if (
    /\b(esporte|atleta|jogos|olimp[ií]ada|campeonato|futsal|v[oô]lei|nata[cç][aã]o|atletismo|torneio|copa|gin[aá]sio)\b/i.test(
      text
    )
  ) {
    return "Esporte";
  }

  return null;
}

export interface SynthesisResult {
  synthesis: GeminiRadioSynthesis;
  needsReview: boolean;
}

/**
 * Processa um artigo bruto usando Google Gemini 1.5 Flash com Structured JSON Output e retry exponencial (máx 2 tentativas).
 */
export async function synthesizeArticleForRadio(
  article: RawScrapedArticle
): Promise<SynthesisResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim();
  const isKeyConfigured = Boolean(
    apiKey &&
      apiKey !== "sua-chave-api-gemini-aqui" &&
      apiKey.length > 10
  );

  if (isKeyConfigured && apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const userPrompt = `FONTE: ${article.sourceName}
TÍTULO ORIGINAL: ${article.title}
RESUMO / CONTEÚDO: ${article.contentSnippet}
DATA PUBLICAÇÃO: ${article.pubDate}

Analise a matéria acima e retorne o JSON estruturado conforme o schema.`;

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: userPrompt,
          config: {
            systemInstruction: RADIO_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: RADIO_RESPONSE_SCHEMA,
            temperature: 0.2,
          },
        });

        const rawJson = response.text;
        if (!rawJson) {
          throw new Error("Resposta vazia do modelo Gemini");
        }

        const parsed = JSON.parse(rawJson) as GeminiRadioSynthesis;
        const matchedCategory = VALID_CATEGORIES.find(
          (c) => c.toLowerCase() === (parsed.editoria || "").trim().toLowerCase()
        );

        if (!parsed.aprovado || !matchedCategory) {
          return {
            synthesis: {
              aprovado: false,
              editoria: "Descartar",
              titulo_radio: "",
              lead_radiofonico: "",
            },
            needsReview: false,
          };
        }

        return {
          synthesis: {
            aprovado: true,
            editoria: matchedCategory,
            titulo_radio: parsed.titulo_radio || article.title,
            lead_radiofonico: parsed.lead_radiofonico || article.contentSnippet,
          },
          needsReview: false,
        };
      } catch (error) {
        console.warn(
          `[GeminiClient] Tentativa ${attempt}/${maxAttempts} falhou para "${article.title}":`,
          error
        );
        if (attempt < maxAttempts) {
          await sleep(600 * Math.pow(2, attempt - 1));
        }
      }
    }
  }

  // Fallback de resiliência (SPEC.md Seção 4: salvar com título original e primeiro parágrafo cru com flag needs_review: true)
  const fallbackCategory = classifyCategoryFallback(
    article.title,
    article.contentSnippet,
    article.sourceName
  );

  if (!fallbackCategory) {
    return {
      synthesis: {
        aprovado: false,
        editoria: "Descartar",
        titulo_radio: "",
        lead_radiofonico: "",
      },
      needsReview: false,
    };
  }

  const cleanLead =
    article.contentSnippet && article.contentSnippet.length > 35
      ? article.contentSnippet
      : `${article.title}. Matéria capturada de ${article.sourceName} para conferência da bancada antes da locução ao vivo.`;

  return {
    synthesis: {
      aprovado: true,
      editoria: fallbackCategory,
      titulo_radio: article.title,
      lead_radiofonico: cleanLead,
    },
    needsReview: true,
  };
}

