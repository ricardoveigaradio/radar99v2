"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Radio, Sparkles } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Header } from "@/components/Header";
import { CategoryTabs } from "@/components/CategoryTabs";
import { NewsCard } from "@/components/NewsCard";
import { SourcesModal } from "@/components/SourcesModal";
import type {
  FilterTab,
  NewsItem,
  Source,
  SourceGroup,
  SyncLog,
} from "@/types";

function getFormattedStudioDate(): string {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  return formatted.toUpperCase();
}

function sortNewsClient(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    if (a.is_read !== b.is_read) {
      return a.is_read ? 1 : -1;
    }
    return (
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  });
}

export default function StudioDashboardPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [latestSyncLog, setLatestSyncLog] = useState<SyncLog | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [fontSize, setFontSize] = useState<number>(16);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dismissedLoginWallBanner, setDismissedLoginWallBanner] =
    useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    try {
      const savedFont = localStorage.getItem("radar99_font_size");
      if (savedFont) {
        const num = Number(savedFont);
        if (num >= 14 && num <= 22) {
          setFontSize(num);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const updateFontSize = (nextSize: number) => {
    const clamped = Math.min(22, Math.max(14, nextSize));
    setFontSize(clamped);
    try {
      localStorage.setItem("radar99_font_size", String(clamped));
    } catch {
      // Ignore
    }
  };

  const fetchInitialData = useCallback(async () => {
    setIsLoadingInitial(true);
    try {
      const [newsRes, sourcesRes] = await Promise.all([
        fetch("/api/news"),
        fetch("/api/sources"),
      ]);
      const newsData = (await newsRes.json()) as {
        ok: boolean;
        news?: NewsItem[];
        latestSyncLog?: SyncLog | null;
      };
      const sourcesData = (await sourcesRes.json()) as {
        ok: boolean;
        sources?: Source[];
      };

      if (newsData.ok && newsData.news) {
        setNews(sortNewsClient(newsData.news));
      }
      if (newsData.latestSyncLog) {
        setLatestSyncLog(newsData.latestSyncLog);
      }
      if (sourcesData.ok && sourcesData.sources) {
        setSources(sourcesData.sources);
      }
    } catch (error) {
      console.error("[Dashboard] Erro ao buscar pauta inicial:", error);
    } finally {
      setIsLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    void fetchInitialData();
  }, [fetchInitialData]);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setDismissedLoginWallBanner(false);
    try {
      const res = await fetch("/api/sync-news", { method: "POST" });
      const data = (await res.json()) as {
        ok: boolean;
        message?: string;
        news?: NewsItem[];
        sources?: Source[];
        syncLog?: SyncLog;
        error?: string;
      };

      if (data.ok) {
        if (data.news) setNews(sortNewsClient(data.news));
        if (data.sources) setSources(data.sources);
        if (data.syncLog) setLatestSyncLog(data.syncLog);
        showToast(
          data.message ||
            "Varredura concluída com sucesso e pauta atualizada."
        );
      } else {
        showToast(data.error || "Falha ao executar varredura.");
      }
    } catch {
      showToast("Erro de conexão ao executar a varredura.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleRead = async (id: string, nextReadState: boolean) => {
    // Atualização otimista imediata na UI com reordenação automática (AC 4.2 e AC 4.3)
    setNews((prev) =>
      sortNewsClient(
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                is_read: nextReadState,
                read_at: nextReadState ? new Date().toISOString() : null,
              }
            : item
        )
      )
    );

    try {
      await fetch("/api/news", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_read: nextReadState }),
      });
    } catch (error) {
      console.error("[Dashboard] Erro ao persistir status de leitura:", error);
    }
  };

  const handleToggleSource = async (id: string, active: boolean) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active } : s))
    );
    await fetch("/api/sources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
  };

  const handleAddSource = async (payload: {
    name: string;
    url: string;
    rss_url?: string | null;
    group: SourceGroup;
  }) => {
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      ok: boolean;
      source?: Source;
      error?: string;
    };
    if (!data.ok || !data.source) {
      throw new Error(data.error || "Não foi possível adicionar a fonte.");
    }
    setSources((prev) => [...prev, data.source!]);
    showToast(`Fonte "${data.source.name}" adicionada com sucesso.`);
  };

  const handleDeleteSource = async (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/sources?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  };

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchesTab =
        activeTab === "Todas" || item.category === activeTab;
      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.radio_headline.toLowerCase().includes(q) ||
        item.radio_lead.toLowerCase().includes(q) ||
        item.source_name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [news, activeTab, searchQuery]);

  const loginWallSources = useMemo(() => {
    if (
      latestSyncLog?.login_wall_sources &&
      latestSyncLog.login_wall_sources.length > 0
    ) {
      return latestSyncLog.login_wall_sources;
    }
    return sources
      .filter((s) => s.active && s.last_status === "login_wall")
      .map((s) => s.name);
  }, [latestSyncLog, sources]);

  const unreadCount = useMemo(
    () => news.filter((n) => !n.is_read).length,
    [news]
  );

  const activeSourcesCount = useMemo(
    () => sources.filter((s) => s.active).length,
    [sources]
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0d0f11] text-zinc-100 flex flex-col">
        {/* Alerta Sutil de Login Wall (Task 8.4) */}
        {loginWallSources.length > 0 && !dismissedLoginWallBanner && (
          <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Aviso de Coleta Social:</strong> Os perfis (
                  {loginWallSources.join(", ")}) reportaram{" "}
                  <code className="px-1 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono">
                    warning: login required
                  </code>{" "}
                  na última varredura. As demais fontes institucionais e RSS
                  foram sincronizadas normalmente.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDismissedLoginWallBanner(true)}
                className="text-amber-400 hover:text-amber-200 font-semibold shrink-0"
              >
                Ocultar
              </button>
            </div>
          </div>
        )}

        {/* Barra Superior do Estúdio (Etapa 6) */}
        <Header
          formattedDate={getFormattedStudioDate()}
          fontSize={fontSize}
          onDecreaseFont={() => updateFontSize(fontSize - 1)}
          onIncreaseFont={() => updateFontSize(fontSize + 1)}
          onOpenSourcesModal={() => setIsSourcesModalOpen(true)}
          onSyncNow={() => void handleSyncNow()}
          isSyncing={isSyncing}
          activeSourcesCount={activeSourcesCount}
          unreadCount={unreadCount}
        />

        {/* Abas de Editorias Prioritárias + Busca */}
        <CategoryTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          newsItems={news}
        />

        {/* Lista Principal de Cards de Locução (Etapa 7) */}
        <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 flex-1">
          {isLoadingInitial ? (
            <div className="space-y-4">
              {[1, 2, 3].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-48 rounded-2xl bg-[#15181c] border border-[#252a31] animate-pulse p-6"
                />
              ))}
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="rounded-2xl bg-[#15181c] border border-[#252a31] p-12 text-center my-4">
              <Radio className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">
                Nenhuma pauta encontrada para este filtro
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-5">
                Clique em &ldquo;Varrer agora&rdquo; para buscar novas notícias
                dos últimos 5 dias nos portais cadastrados ou altere a aba de
                editoria.
              </p>
              <button
                type="button"
                onClick={() => void handleSyncNow()}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Varrer portais agora</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 pb-12">
              {filteredNews.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  fontSize={fontSize}
                  onToggleRead={(id, nextState) =>
                    void handleToggleRead(id, nextState)
                  }
                  onCopiedToast={(headline) =>
                    showToast(
                      `Lead copiado p/ locução: "${headline.slice(0, 48)}..."`
                    )
                  }
                />
              ))}
            </div>
          )}
        </main>

        {/* Modal de Gestão de Fontes (Etapa 8) */}
        <SourcesModal
          isOpen={isSourcesModalOpen}
          onClose={() => setIsSourcesModalOpen(false)}
          sources={sources}
          onToggleSource={handleToggleSource}
          onAddSource={handleAddSource}
          onDeleteSource={handleDeleteSource}
        />

        {/* Toast Discreto de Feedback na UI */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 max-w-md bg-[#1b1f24] border border-emerald-500/40 text-zinc-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

