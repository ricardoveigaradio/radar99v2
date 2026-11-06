"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import type { EditorialCategory, NewsItem } from "@/types";

interface NewsCardProps {
  item: NewsItem;
  fontSize: number;
  onToggleRead: (id: string, nextReadState: boolean) => void;
  onCopiedToast: (headline: string) => void;
}

const CATEGORY_BADGE_STYLES: Record<EditorialCategory, string> = {
  Saúde:
    "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  Educação:
    "bg-blue-500/20 text-blue-300 border-blue-500/40",
  "Meio Ambiente":
    "bg-teal-500/20 text-teal-300 border-teal-500/40",
  Cultura:
    "bg-purple-500/20 text-purple-300 border-purple-500/40",
  Esporte:
    "bg-amber-500/20 text-amber-300 border-amber-500/40",
};

function formatTimeHHMM(isoString: string): string {
  try {
    const parsed = parseISO(isoString);
    if (isValid(parsed)) {
      return format(parsed, "HH:mm");
    }
  } catch {
    // Fallback
  }
  return "--:--";
}

function formatDateTimeShort(isoString: string): string {
  try {
    const parsed = parseISO(isoString);
    if (isValid(parsed)) {
      return format(parsed, "dd/MM 'às' HH:mm");
    }
  } catch {
    // Fallback
  }
  return "";
}

export function NewsCard({
  item,
  fontSize,
  onToggleRead,
  onCopiedToast,
}: NewsCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyForBroadcast = async () => {
    const broadcastScript = `${item.radio_headline}.\n\n${item.radio_lead}\n\n(Fonte: ${item.source_name})`;
    try {
      await navigator.clipboard.writeText(broadcastScript);
      setCopied(true);
      onCopiedToast(item.radio_headline);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback caso clipboard API falhe
      const textarea = document.createElement("textarea");
      textarea.value = broadcastScript;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      onCopiedToast(item.radio_headline);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const badgeClass =
    CATEGORY_BADGE_STYLES[item.category] ||
    "bg-zinc-700 text-zinc-200 border-zinc-600";

  return (
    <article
      className={`rounded-2xl p-5 sm:p-6 transition-all border ${
        item.is_read
          ? "opacity-50 bg-[#121518] border-emerald-900/40 hover:opacity-75"
          : "bg-[#15181c] border-[#252a31] hover:border-[#343b46] shadow-lg"
      }`}
    >
      {/* Topo do Card: Badge da Editoria à esquerda + Nome da Fonte e Data Original à direita */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider border ${badgeClass}`}
          >
            {item.category.toUpperCase()}
          </span>

          {item.needs_review && (
            <span
              title="Síntese em modo de contingência - revisar antes de ler no ar"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30"
            >
              <AlertTriangle className="w-3 h-3" />
              Revisar
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium ml-auto">
          <span className="text-zinc-200 font-semibold">{item.source_name}</span>
          <span className="text-zinc-600">&bull;</span>
          <span className="font-mono text-[11px] text-zinc-400">
            {formatDateTimeShort(item.published_at)}
          </span>
        </div>
      </div>

      {/* Manchete Adaptada em Destaque (Negrito Alto Contraste) */}
      <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug mb-3 tracking-tight">
        {item.radio_headline}
      </h2>

      {/* Lead Radiofônico com Tamanho Tipográfico Dinâmico (- Aa +) e Entrelinha de Locução */}
      <p
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.65,
        }}
        className="text-zinc-200 font-normal tracking-wide mb-5 select-text"
      >
        {item.radio_lead}
      </p>

      {/* Rodapé do Card: Capturada às HH:mm + Fonte original ↗ + Botões de Ação ao Vivo */}
      <div className="pt-3.5 border-t border-[#252a31]/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            Capturada às {formatTimeHHMM(item.captured_at)}
          </span>

          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-zinc-300 hover:text-orange-400 font-medium transition-colors"
          >
            <span>Fonte original</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Ações de Locução: Copiar p/ locução & Marcar lida */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void handleCopyForBroadcast()}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              copied
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-[#1e2329] hover:bg-[#282e36] text-zinc-100 border-[#2f3640]"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copiar p/ locução</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onToggleRead(item.id, !item.is_read)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              item.is_read
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25"
                : "bg-[#1e2329] hover:bg-[#282e36] text-zinc-200 border-[#2f3640]"
            }`}
          >
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                item.is_read ? "text-emerald-400" : "text-zinc-400"
              }`}
            />
            <span>{item.is_read ? "Lida ✓" : "Marcar lida"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

