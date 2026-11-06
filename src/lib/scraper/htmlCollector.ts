import * as cheerio from "cheerio";
import { DESKTOP_HEADERS } from "./feedDetector";
import { parseArticleDateToIso } from "./dateFilter";
import { cleanHtmlText } from "./rssCollector";
import type { RawScrapedArticle, Source } from "@/types";

const REQUEST_TIMEOUT_MS = 8000;

export class LoginWallError extends Error {
  public readonly isLoginWall = true;
  constructor(message: string) {
    super(message);
    this.name = "LoginWallError";
  }
}

/**
 * Função pura que detecta se a resposta HTTP/HTML representa um bloqueio de login de rede social (ex: Instagram).
 */
export function isSocialLoginWall(
  url: string,
  statusCode: number,
  finalUrl: string,
  htmlSnippet: string
): boolean {
  const lowerUrl = url.toLowerCase();
  const isSocial =
    lowerUrl.includes("instagram.com") || lowerUrl.includes("facebook.com");

  if (!isSocial) return false;

  if (statusCode === 401 || statusCode === 403 || statusCode === 429) {
    return true;
  }

  if (finalUrl.toLowerCase().includes("/accounts/login")) {
    return true;
  }

  const lowerHtml = htmlSnippet.toLowerCase();
  if (
    lowerHtml.includes("login") &&
    !lowerHtml.includes("<article") &&
    lowerHtml.includes("instagram")
  ) {
    return true;
  }

  return false;
}

/**
 * Função pura que extrai candidatos a artigos de um documento HTML genérico (Gov.br, portais universitários e regionais).
 */
export function extractArticlesFromHtml(
  html: string,
  source: Source,
  fallbackNowIso: string
): RawScrapedArticle[] {
  if (!html) return [];

  const $ = cheerio.load(html);
  const articles: RawScrapedArticle[] = [];
  const seenLinks = new Set<string>();

  // Seletores semânticos comuns em portais gov.br, Plone, WordPress e jornais regionais
  const selectors = [
    "article",
    ".tileItem",
    ".noticias-listagem li",
    ".item-noticia",
    ".post",
    ".card",
    "h2 a, h3 a",
  ];

  for (const selector of selectors) {
    $(selector).each((_, element) => {
      if (articles.length >= 6) return;

      const el = $(element);
      const anchor = el.is("a") ? el : el.find("a").first();
      const rawHref = anchor.attr("href");
      if (!rawHref) return;

      let resolvedLink = "";
      try {
        resolvedLink = new URL(rawHref, source.url).toString();
      } catch {
        return;
      }

      if (
        !resolvedLink.startsWith("http") ||
        seenLinks.has(resolvedLink) ||
        resolvedLink === source.url
      ) {
        return;
      }

      const rawTitle =
        el.find("h1, h2, h3, h4, .titulo, .tileHeadline").first().text() ||
        anchor.attr("title") ||
        anchor.text();

      const title = cleanHtmlText(rawTitle);
      if (!title || title.length < 22) return;

      const rawSummary =
        el.find("p, .description, .tileBody, .resumo").first().text() || title;
      const contentSnippet = cleanHtmlText(rawSummary).slice(0, 700);

      const rawDate =
        el.find("time").first().attr("datetime") ||
        el.find("time, .date, .documentPublished, .summary-view-icon").first().text();

      const pubDate =
        parseArticleDateToIso(rawDate, fallbackNowIso) || fallbackNowIso;

      seenLinks.add(resolvedLink);
      articles.push({
        title,
        link: resolvedLink,
        pubDate,
        contentSnippet: contentSnippet || title,
        sourceName: source.name,
        sourceId: source.id,
      });
    });

    if (articles.length >= 4) {
      break;
    }
  }

  return articles;
}

/**
 * Coleta matérias via scraping HTML com Cheerio e timeout de 8 segundos.
 */
export async function collectFromHtml(
  source: Source
): Promise<RawScrapedArticle[]> {
  if (
    source.is_social ||
    source.url.toLowerCase().includes("instagram.com")
  ) {
    throw new LoginWallError(
      `warning: login required - O portal social (${source.name}) exigiu autenticação (Login Wall do Instagram).`
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(source.url, {
      headers: DESKTOP_HEADERS,
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    const htmlText = await response.text();

    if (
      isSocialLoginWall(
        source.url,
        response.status,
        response.url || source.url,
        htmlText.slice(0, 2000)
      )
    ) {
      throw new LoginWallError(
        `warning: login required - Bloqueio de login detectado em ${source.name}`
      );
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ao acessar ${source.url}`);
    }

    const nowIso = new Date().toISOString();
    return extractArticlesFromHtml(htmlText, source, nowIso);
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof LoginWallError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "Falha na coleta HTML";
    throw new Error(`[HTML Collector] ${source.name}: ${message}`);
  }
}

