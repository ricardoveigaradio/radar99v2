"use client";

import React from "react";
import {
  RefreshCw,
  SlidersHorizontal,
  LogOut,
  Radio,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  formattedDate: string;
  fontSize: number;
  onDecreaseFont: () => void;
  onIncreaseFont: () => void;
  onOpenSourcesModal: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
  activeSourcesCount: number;
  unreadCount: number;
}

export function Header({
  formattedDate,
  fontSize,
  onDecreaseFont,
  onIncreaseFont,
  onOpenSourcesModal,
  onSyncNow,
  isSyncing,
  activeSourcesCount,
  unreadCount,
}: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-[#252a31] bg-[#0d0f11]/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Identidade do Estúdio + Data e Pauta do Dia */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-red-500/15 text-red-400 border border-red-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              NO AR
            </span>

            <div className="flex items-center gap-1.5">
              <Radio className="w-5 h-5 text-orange-500" />
              <span className="text-xl font-extrabold tracking-tight text-white">
                Radar<span className="text-orange-500">99</span>
              </span>
            </div>

            <span className="text-zinc-600 hidden sm:inline">&bull;</span>

            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-0.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pauta do dia
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-[#1b1f24] border border-[#252a31] text-xs font-medium text-zinc-300">
              {unreadCount} {unreadCount === 1 ? "pendente" : "pendentes"} p/ locução
            </span>
          </div>
        </div>

        {/* Controles de Bancada: - Aa +, Fontes, Varrer agora, Usuário */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Controle de Zoom Tipográfico (- Aa +) */}
          <div
            className="inline-flex items-center bg-[#15181c] border border-[#252a31] rounded-xl p-1"
            title={`Tamanho do texto do lead: ${fontSize}px`}
          >
            <button
              type="button"
              onClick={onDecreaseFont}
              disabled={fontSize <= 14}
              aria-label="Diminuir fonte"
              className="px-2.5 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-[#252a31] rounded-lg disabled:opacity-35 transition-colors"
            >
              -
            </button>
            <span className="px-2 text-xs font-semibold text-zinc-400 select-none">
              Aa <span className="text-[10px] font-mono text-zinc-500">{fontSize}</span>
            </span>
            <button
              type="button"
              onClick={onIncreaseFont}
              disabled={fontSize >= 22}
              aria-label="Aumentar fonte"
              className="px-2.5 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-[#252a31] rounded-lg disabled:opacity-35 transition-colors"
            >
              +
            </button>
          </div>

          {/* Botão Fontes */}
          <button
            type="button"
            onClick={onOpenSourcesModal}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#15181c] hover:bg-[#1b1f24] text-zinc-200 border border-[#252a31] text-xs sm:text-sm font-semibold transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
            <span>Fontes</span>
            <span className="px-1.5 py-0.5 text-[11px] rounded bg-[#252a31] text-zinc-300 font-mono">
              {activeSourcesCount}
            </span>
          </button>

          {/* Botão Primário Laranja: Varrer agora */}
          <button
            type="button"
            onClick={onSyncNow}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-orange-500/20"
          >
            <RefreshCw
              className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
            />
            <span>{isSyncing ? "Varrendo portais..." : "Varrer agora"}</span>
          </button>

          {/* Operador Logado & Logout */}
          {user && (
            <button
              type="button"
              onClick={() => void logout()}
              title={`Sair (${user.displayName || user.email || "Operador"})`}
              className="p-2.5 rounded-xl bg-[#15181c] hover:bg-red-950/40 hover:border-red-500/40 text-zinc-400 hover:text-red-300 border border-[#252a31] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

