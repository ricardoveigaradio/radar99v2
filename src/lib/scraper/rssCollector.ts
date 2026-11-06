import Parser from "rss-parser";
import { DESKTOP_HEADERS } from "./feedDetector";
import { parseArticleDateToIso } from "./dateFilter";
import type { RawScrapedArticle, Source } from "@/types";

const REQUEST_TIMEOUT_MS = 8000;

/**
 * Função pura para limpar tags HTML e normalizar espaços em branco de snippets RSS.
 */
export function cleanHtmlText(raw: string | undefined | null): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Coleta matérias de um feed RSS/Atom com timeout estrito de 8 segundos.
 */
export async function collectFromRss(
  feedUrl: string,
  source: Source
): Promise<RawScrapedArticle[]> {
  const parser = new Parser({
    timeout: REQUEST_TIMEOUT_MS,
    headers: DESKTOP_HEADERS,
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(feedUrl, {
      headers: DESKTOP_HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ao buscar RSS em ${feedUrl}`);
    }

    const xmlContent = await response.text();
    const feed = await parser.parseString(xmlContent);

    if (!feed.items || feed.items.length === 0) {
      return [];
    }

    const nowIso = new Date().toISOString();
    const articles: RawScrapedArticle[] = [];

    for (const item of feed.items.slice(0, 8)) {
      const title = cleanHtmlText(item.title);
      const link = item.link?.trim() || "";
      if (!title || !link) continue;

      const pubDate =
        parseArticleDateToIso(item.isoDate || item.pubDate, nowIso) || nowIso;

      const rawSnippet =
        item.contentSnippet || item.content || item.summary || title;
      const contentSnippet = cleanHtmlText(rawSnippet).slice(0, 900);

      articles.push({
        title,
        link,
        pubDate,
        contentSnippet: contentSnippet || title,
        sourceName: source.name,
        sourceId: source.id,
      });
    }

    return articles;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido no coletor RSS";
    throw new Error(`[RSS Collector] ${source.name}: ${message}`);
  }
}

