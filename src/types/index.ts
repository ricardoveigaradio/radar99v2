export type EditorialCategory =
  | "Educação"
  | "Saúde"
  | "Meio Ambiente"
  | "Cultura"
  | "Esporte";

export type Category = EditorialCategory;

export type FilterTab = "Todas" | EditorialCategory;

export interface NewsItem {
  id: string;
  title: string;
  radio_headline: string;
  radio_lead: string;
  source_name: string;
  source_url: string;
  published_at: string; // ISO 8601
  captured_at: string; // ISO 8601
  category: EditorialCategory;
  is_read: boolean;
  read_at?: string | null;
  needs_review?: boolean;
}

export type SourceStatus = "ok" | "error" | "login_wall" | "idle";

export type SourceGroup =
  | "Regionais"
  | "Faculdades"
  | "Governo Federal"
  | "Redes Sociais"
  | "Outros";

export interface Source {
  id: string;
  name: string;
  url: string;
  rss_url?: string | null;
  group: SourceGroup;
  active: boolean;
  is_social?: boolean;
  last_status?: SourceStatus;
  last_error?: string | null;
  last_synced_at?: string | null;
}

export interface SyncSourceError {
  source_name: string;
  source_url: string;
  message: string;
  timestamp: string;
  is_login_wall: boolean;
}

export interface SyncLog {
  id: string;
  started_at: string;
  finished_at: string;
  total_sources_checked: number;
  added_count: number;
  discarded_count: number;
  failed_sources_count: number;
  login_wall_sources: string[];
  errors: SyncSourceError[];
}

export interface RawScrapedArticle {
  title: string;
  link: string;
  pubDate: string; // ISO 8601
  contentSnippet: string;
  sourceName: string;
  sourceId: string;
}

export interface GeminiRadioSynthesis {
  aprovado: boolean;
  editoria: EditorialCategory | "Descartar";
  titulo_radio: string;
  lead_radiofonico: string;
}

