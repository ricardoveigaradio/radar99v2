import { NextResponse } from "next/server";
import {
  getSources,
  getNews,
  isArticleAlreadySaved,
  saveNewsItems,
  saveSyncLog,
  updateSourceStatus,
  createUrlHashId,
} from "@/services/newsService";
import { runResilientScraper } from "@/lib/scraper";
import { isWithinLastFiveDays } from "@/lib/scraper/dateFilter";
import { synthesizeArticleForRadio } from "@/lib/ai/geminiClient";
import type { EditorialCategory, NewsItem, SyncLog } from "@/types";

export const dynamic = "force-dynamic";

export async function POST() {
  const startedAt = new Date().toISOString();

  try {
    const allSources = await getSources();
    const activeSources = allSources.filter((s) => s.active);

    const scrapeSummary = await runResilientScraper(activeSources);

    // Atualizar o status individual de cada fonte no banco
    for (const res of scrapeSummary.resultsBySource) {
      if (res.error) {
        const status = res.error.is_login_wall ? "login_wall" : "error";
        await updateSourceStatus(res.source.id, status, res.error.message);
      } else {
        await updateSourceStatus(res.source.id, "ok", null);
      }
    }

    // Filtrar candidatos inéditos e dentro dos últimos 5 dias (AC 2.2 e AC 2.4)
    const unseenArticles = [];
    let discardedCount = 0;

    for (const raw of scrapeSummary.articles) {
      if (!isWithinLastFiveDays(raw.pubDate)) {
        discardedCount++;
        continue;
      }

      const alreadySaved = await isArticleAlreadySaved(raw.link);
      if (alreadySaved) {
        continue;
      }

      unseenArticles.push(raw);
      // Limitar lote por sincronização para manter latência baixa no estúdio
      if (unseenArticles.length >= 14) {
        break;
      }
    }

    const approvedItems: NewsItem[] = [];
    const capturedAtIso = new Date().toISOString();

    for (const candidate of unseenArticles) {
      const { synthesis, needsReview } = await synthesizeArticleForRadio(candidate);

      if (
        !synthesis.aprovado ||
        synthesis.editoria === "Descartar"
      ) {
        discardedCount++;
        continue;
      }

      const newsItem: NewsItem = {
        id: createUrlHashId(candidate.link),
        title: candidate.title,
        radio_headline: synthesis.titulo_radio,
        radio_lead: synthesis.lead_radiofonico,
        source_name: candidate.sourceName,
        source_url: candidate.link,
        published_at: candidate.pubDate,
        captured_at: capturedAtIso,
        category: synthesis.editoria as EditorialCategory,
        is_read: false,
        read_at: null,
        needs_review: needsReview,
      };

      approvedItems.push(newsItem);
    }

    const addedCount = await saveNewsItems(approvedItems);
    const finishedAt = new Date().toISOString();

    const syncLog: SyncLog = {
      id: `sync-${Date.now()}`,
      started_at: startedAt,
      finished_at: finishedAt,
      total_sources_checked: activeSources.length,
      added_count: addedCount,
      discarded_count: discardedCount,
      failed_sources_count: scrapeSummary.errors.length,
      login_wall_sources: scrapeSummary.loginWallSources,
      errors: scrapeSummary.errors,
    };

    await saveSyncLog(syncLog);

    const updatedNews = await getNews();
    const updatedSources = await getSources();

    const toastMessage = `Varredura concluída: ${addedCount} novas matérias adicionadas (${scrapeSummary.errors.length} fontes inacessíveis)`;

    return NextResponse.json({
      ok: true,
      message: toastMessage,
      syncLog,
      news: updatedNews,
      sources: updatedSources,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao sincronizar notícias";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

