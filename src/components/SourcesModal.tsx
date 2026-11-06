"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Globe,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Rss,
} from "lucide-react";
import type { Source, SourceGroup } from "@/types";

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: Source[];
  onToggleSource: (id: string, active: boolean) => Promise<void>;
  onAddSource: (payload: {
    name: string;
    url: string;
    rss_url?: string | null;
    group: SourceGroup;
  }) => Promise<void>;
  onDeleteSource: (id: string) => Promise<void>;
}

export function SourcesModal({
  isOpen,
  onClose,
  sources,
  onToggleSource,
  onAddSource,
  onDeleteSource,
}: SourcesModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [rssUrl, setRssUrl] = useState("");
  const [group, setGroup] = useState<SourceGroup>("Regionais");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !url.trim()) {
      setFormError("Preencha o nome do veículo e a URL principal.");
      return;
    }

    setSubmitting(true);
    try {
      await onAddSource({
        name: name.trim(),
        url: url.trim(),
        rss_url: rssUrl.trim() || null,
        group,
      });
      setName("");
      setUrl("");
      setRssUrl("");
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Erro ao cadastrar fonte."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sources-modal-title"
    >
      <div className="w-full max-w-2xl bg-[#15181c] border border-[#252a31] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="px-6 py-4 border-b border-[#252a31] flex items-center justify-between">
          <div>
            <h2
              id="sources-modal-title"
              className="text-lg font-extrabold text-white"
            >
              Gerenciador de Fontes e Portais
            </h2>
            <p className="text-xs text-zinc-400">
              Ative, desative ou cadastre novas fontes para a varredura da bancada.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#252a31] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário de Nova Fonte */}
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="p-6 border-b border-[#252a31] bg-[#111417]"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
            Adicionar novo portal ou feed RSS
          </div>

          {formError && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-xs text-red-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do Portal (ex: G1 Educação)"
              className="px-3.5 py-2 rounded-xl bg-[#15181c] border border-[#252a31] focus:border-orange-500 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as SourceGroup)}
              className="px-3.5 py-2 rounded-xl bg-[#15181c] border border-[#252a31] focus:border-orange-500 text-xs sm:text-sm text-white focus:outline-none"
            >
              <option value="Regionais">Regionais</option>
              <option value="Faculdades">Faculdades / Universidades</option>
              <option value="Governo Federal">Governo Federal</option>
              <option value="Redes Sociais">Redes Sociais / Instagram</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL do site (https://...)"
              className="px-3.5 py-2 rounded-xl bg-[#15181c] border border-[#252a31] focus:border-orange-500 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
            <input
              type="url"
              value={rssUrl}
              onChange={(e) => setRssUrl(e.target.value)}
              placeholder="URL Feed RSS opcional (https://.../feed)"
              className="px-3.5 py-2 rounded-xl bg-[#15181c] border border-[#252a31] focus:border-orange-500 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{submitting ? "Adicionando..." : "Incluir Fonte"}</span>
          </button>
        </form>

        {/* Lista de Fontes Cadastradas */}
        <div className="p-6 overflow-y-auto space-y-2.5 flex-1">
          {sources.map((src) => {
            const isLoginWall = src.last_status === "login_wall";
            const isError = src.last_status === "error";

            return (
              <div
                key={src.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#111417] border border-[#252a31]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white truncate">
                      {src.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1e2329] text-zinc-400 border border-[#2c333d]">
                      {src.group}
                    </span>
                    {src.rss_url && (
                      <span
                        title={`Feed RSS: ${src.rss_url}`}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      >
                        <Rss className="w-2.5 h-2.5" /> RSS
                      </span>
                    )}
                    {isLoginWall && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        warning: login required
                      </span>
                    )}
                    {isError && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
                        <AlertTriangle className="w-3 h-3" />
                         inacessível
                      </span>
                    )}
                    {src.last_status === "ok" && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> ativo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 truncate mt-1">
                    <Globe className="w-3 h-3 shrink-0" />
                    <span className="truncate">{src.url}</span>
                  </div>
                </div>

                {/* Switch Habilitar/Desabilitar + Excluir */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={src.active}
                    onClick={() => void onToggleSource(src.id, !src.active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      src.active ? "bg-orange-500" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        src.active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => void onDeleteSource(src.id)}
                    title="Remover fonte"
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3.5 border-t border-[#252a31] flex items-center justify-between text-xs text-zinc-400">
          <span>
            {sources.filter((s) => s.active).length} de {sources.length} fontes
            habilitadas
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#252a31] hover:bg-[#303640] text-white font-semibold transition-colors"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}

