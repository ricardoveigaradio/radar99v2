import * as cheerio from "cheerio";

export const DESKTOP_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml,application/rss+xml,application/atom+xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
};

const REQUEST_TIMEOUT_MS = 8000;

/**
 * Função pura que verifica se o conteúdo retornado aparenta ser XML de feed RSS/Atom.
 */
export function isXmlFeedContent(
  contentType: string | null,
  bodySnippet: string
): boolean {
  const normalizedType = (contentType || "").toLowerCase();
  if (
    normalizedType.includes("application/rss+xml") ||
    normalizedType.includes("application/atom+xml") ||
    normalizedType.includes("application/xml") ||
    normalizedType.includes("text/xml")
  ) {
    return true;
  }

  const head = bodySnippet.trim().slice(0, 500).toLowerCase();
  return head.includes("<rss") || head.includes("<feed") || head.includes("<channel>");
}

/**
 * Função pura que extrai link de feed RSS/Atom de um documento HTML.
 */
export function extractFeedHrefFromHtml(html: string, baseUrl: string): string | null {
  if (!html) return null;

  const $ = cheerio.load(html);
  const feedLink = $(
    'link[type="application/rss+xml"], link[type="application/atom+xml"]'
  )
    .first()
    .attr("href");

  if (!feedLink) return null;

  try {
    return new URL(feedLink, baseUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Detecta se a URL informada possui um feed RSS/Atom ativo (direto ou via tag <link> ou sufixos padrão).
 */
export async function detectFeedUrl(
  siteUrl: string,
  configuredRssUrl?: string | null
): Promise<string | null> {
  if (configuredRssUrl && configuredRssUrl.trim().length > 0) {
    return configuredRssUrl.trim();
  }

  // Redes sociais não possuem RSS público direto
  if (
    siteUrl.includes("instagram.com") ||
    siteUrl.includes("facebook.com")
  ) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(siteUrl, {
      headers: DESKTOP_HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type");
    const text = await response.text();

    if (isXmlFeedContent(contentType, text)) {
      return siteUrl;
    }

    const discoveredFromHtml = extractFeedHrefFromHtml(text, siteUrl);
    if (discoveredFromHtml) {
      return discoveredFromHtml;
    }
  } catch {
    // Silencioso: retorna null para que o coletor HTML assuma como fallback
    return null;
  }

  return null;
}

