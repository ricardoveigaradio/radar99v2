import { isAfter, subDays, parseISO, isValid } from "date-fns";
import type { RawScrapedArticle } from "@/types";

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

/**
 * Função pura para converter datas em múltiplos formatos (RFC 2822, ISO 8601, BR) para ISO 8601.
 */
export function parseArticleDateToIso(
  rawDate: string | undefined | null,
  fallbackNowIso?: string
): string | null {
  if (!rawDate || !rawDate.trim()) {
    return fallbackNowIso ?? null;
  }

  const trimmed = rawDate.trim();

  // Tenta ISO direto
  const isoParsed = parseISO(trimmed);
  if (isValid(isoParsed)) {
    return isoParsed.toISOString();
  }

  // Tenta Date nativo (RFC 2822 de RSS feeds)
  const nativeParsed = new Date(trimmed);
  if (isValid(nativeParsed) && !Number.isNaN(nativeParsed.getTime())) {
    return nativeParsed.toISOString();
  }

  // Tenta padrão brasileiro DD/MM/YYYY [HH:mm]
  const brMatch = trimmed.match(
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:.*?\s+(\d{1,2})[:h](\d{2}))?/
  );
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]) - 1;
    const year = Number(brMatch[3]);
    const hour = brMatch[4] ? Number(brMatch[4]) : 8;
    const minute = brMatch[5] ? Number(brMatch[5]) : 0;
    const constructed = new Date(year, month, day, hour, minute);
    if (isValid(constructed)) {
      return constructed.toISOString();
    }
  }

  return fallbackNowIso ?? null;
}

/**
 * Função pura que verifica se uma data ISO está dentro da janela estrita dos últimos 5 dias.
 */
export function isWithinLastFiveDays(
  isoDateString: string,
  referenceNowMs: number = Date.now()
): boolean {
  if (!isoDateString) return false;

  const parsed = new Date(isoDateString);
  if (Number.isNaN(parsed.getTime())) return false;

  const cutoffMs = referenceNowMs - FIVE_DAYS_MS;
  const cutoffDate = subDays(new Date(referenceNowMs), 5);

  return parsed.getTime() >= cutoffMs && isAfter(parsed, cutoffDate);
}

/**
 * Filtra lista de artigos descartando qualquer publicação anterior a 5 dias atrás.
 */
export function filterRecentArticles(
  articles: RawScrapedArticle[],
  referenceNowMs: number = Date.now()
): RawScrapedArticle[] {
  return articles.filter((article) =>
    isWithinLastFiveDays(article.pubDate, referenceNowMs)
  );
}

