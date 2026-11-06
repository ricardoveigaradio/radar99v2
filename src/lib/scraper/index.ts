import { detectFeedUrl } from "./feedDetector";
import { collectFromRss } from "./rssCollector";
import { collectFromHtml, LoginWallError } from "./htmlCollector";
import { filterRecentArticles } from "./dateFilter";
import type { RawScrapedArticle, Source, SyncSourceError } from "@/types";

export interface SourceScrapeResult {
  source: Source;
  articles: RawScrapedArticle[];
  error: SyncSourceError | null;
}

export interface BatchScrapeSummary {
  articles: RawScrapedArticle[];
  errors: SyncSourceError[];
  loginWallSources: string[];
  resultsBySource: SourceScrapeResult[];
}

/**
 * Processa uma única fonte de forma resiliente:
 * 1. Verifica se é perfil social com login wall (Instagram)
 * 2. Tenta RSS/Atom prioritariamente
 * 3. Caso não possua RSS ou falhe, faz fallback para Cheerio HTML Collector
 * 4. Filtra estritamente pelos últimos 5 dias
 */
async function scrapeSingleSource(source: Source): Promise<SourceScrapeResult> {
  const nowIso = new Date().toISOString();

  try {
    if (
      source.is_social ||
      source.url.toLowerCase().includes("instagram.com")
    ) {
      throw new LoginWallError(
        "warning: login required (Instagram bloqueou extração sem login)"
      );
    }

    let rawArticles: RawScrapedArticle[] = [];
    const feedUrl = await detectFeedUrl(source.url, source.rss_url);

    if (feedUrl) {
      try {
        rawArticles = await collectFromRss(feedUrl, source);
      } catch {
        // Fallback automático para HTML scraping se o XML falhar
        rawArticles = await collectFromHtml(source);
      }
    } else {
      rawArticles = await collectFromHtml(source);
    }

    const recentArticles = filterRecentArticles(rawArticles);

    return {
      source,
      articles: recentArticles,
      error: null,
    };
  } catch (err: unknown) {
    const isLoginWall =
      err instanceof LoginWallError ||
      (err instanceof Error &&
        err.message.toLowerCase().includes("login required"));

    const message =
      err instanceof Error ? err.message : "Falha desconhecida ao coletar fonte";

    return {
      source,
      articles: [],
      error: {
        source_name: source.name,
        source_url: source.url,
        message,
        timestamp: nowIso,
        is_login_wall: isLoginWall,
      },
    };
  }
}

/**
 * Executa todas as fontes ativas em paralelo com Promise.allSettled,
 * garantindo que a falha de uma fonte nunca interrompa as demais.
 */
export async function runResilientScraper(
  sources: Source[]
): Promise<BatchScrapeSummary> {
  const activeSources = sources.filter((s) => s.active);

  const settledResults = await Promise.allSettled(
    activeSources.map((source) => scrapeSingleSource(source))
  );

  const allArticles: RawScrapedArticle[] = [];
  const errors: SyncSourceError[] = [];
  const loginWallSources: string[] = [];
  const resultsBySource: SourceScrapeResult[] = [];

  for (let i = 0; i < settledResults.length; i++) {
    const settled = settledResults[i];
    const source = activeSources[i];

    if (settled.status === "fulfilled") {
      const val = settled.value;
      resultsBySource.push(val);
      allArticles.push(...val.articles);

      if (val.error) {
        errors.push(val.error);
        if (val.error.is_login_wall) {
          loginWallSources.push(source.name);
        }
      }
    } else {
      const errObj: SyncSourceError = {
        source_name: source.name,
        source_url: source.url,
        message:
          settled.reason instanceof Error
            ? settled.reason.message
            : "Exceção não tratada na coleta",
        timestamp: new Date().toISOString(),
        is_login_wall: Boolean(source.is_social),
      };
      errors.push(errObj);
      if (errObj.is_login_wall) {
        loginWallSources.push(source.name);
      }
      resultsBySource.push({
        source,
        articles: [],
        error: errObj,
      });
    }
  }

  return {
    articles: allArticles,
    errors,
    loginWallSources,
    resultsBySource,
  };
}

