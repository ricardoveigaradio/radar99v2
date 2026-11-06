"use client";

import React from "react";
import { Search, X } from "lucide-react";
import type { EditorialCategory, FilterTab, NewsItem } from "@/types";

interface CategoryTabsProps {
  activeTab: FilterTab;
  onSelectTab: (tab: FilterTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  newsItems: NewsItem[];
}

const TAB_CONFIG: Array<{
  id: FilterTab;
  label: string;
  priorityStar?: boolean;
}> = [
  { id: "Todas", label: "Todas" },
  { id: "Educação", label: "Educação ★", priorityStar: true },
  { id: "Saúde", label: "Saúde ★", priorityStar: true },
  { id: "Meio Ambiente", label: "Meio Ambiente" },
  { id: "Cultura", label: "Cultura" },
  { id: "Esporte", label: "Esporte" },
];

export function CategoryTabs({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  newsItems,
}: CategoryTabsProps) {
  const getCount = (tab: FilterTab): number => {
    if (tab === "Todas") return newsItems.length;
    return newsItems.filter(
      (item) => item.category === (tab as EditorialCategory)
    ).length;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      {/* Abas de Editoria */}
      <nav
        aria-label="Filtro por editoria"
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
      >
        {TAB_CONFIG.map((tab) => {
          const isSelected = activeTab === tab.id;
          const count = getCount(tab.id);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                  : "bg-[#15181c] text-zinc-300 border-[#252a31] hover:bg-[#1b1f24] hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono ${
                  isSelected
                    ? "bg-black/25 text-white"
                    : "bg-[#252a31] text-zinc-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Busca Textual por Palavra-Chave ou Veículo */}
      <div className="relative w-full lg:w-72 shrink-0">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar pauta ou veículo..."
          className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#15181c] border border-[#252a31] focus:border-orange-500/60 focus:outline-none text-xs sm:text-sm text-white placeholder-zinc-500 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Limpar busca"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

