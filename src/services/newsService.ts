import fs from "fs";
import path from "path";
import crypto from "crypto";
import { subDays, isAfter, parseISO } from "date-fns";
import { getAdminDb } from "@/lib/firebase-admin";
import { DEFAULT_SOURCES, getInitialSeedNews } from "@/lib/seedSources";
import type { NewsItem, Source, SyncLog, SourceStatus } from "@/types";

interface LocalDatabaseSchema {
  sources: Source[];
  news: NewsItem[];
  syncLogs: SyncLog[];
}

const LOCAL_DB_PATH = path.join(process.cwd(), ".radar99-data.json");

function readLocalDb(): LocalDatabaseSchema {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
      const parsed = JSON.parse(raw) as LocalDatabaseSchema;
      if (parsed && Array.isArray(parsed.sources) && Array.isArray(parsed.news)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("[newsService] Aviso ao ler banco local:", error);
  }

  const initialData: LocalDatabaseSchema = {
    sources: DEFAULT_SOURCES,
    news: getInitialSeedNews(),
    syncLogs: [
      {
        id: "sync-initial",
        started_at: new Date(Date.now() - 3600 * 1000).toISOString(),
        finished_at: new Date(Date.now() - 3590 * 1000).toISOString(),
        total_sources_checked: DEFAULT_SOURCES.length,
        added_count: 6,
        discarded_count: 4,
        failed_sources_count: 1,
        login_wall_sources: ["Instagram @mineducacao"],
        errors: [
          {
            source_name: "Instagram @mineducacao",
            source_url: "https://www.instagram.com/mineducacao/",
            message: "Login wall detectado pelo Instagram (HTTP 403 / Redirect Login)",
            timestamp: new Date(Date.now() - 3592 * 1000).toISOString(),
            is_login_wall: true,
          },
        ],
      },
    ],
  };

  writeLocalDb(initialData);
  return initialData;
}

function writeLocalDb(data: LocalDatabaseSchema): void {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.warn("[newsService] Aviso ao persistir banco local:", error);
  }
}

export function createUrlHashId(url: string): string {
  const normalized = url.trim().toLowerCase().replace(/\/+$/, "");
  return "news-" + crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 20);
}

/**
 * Ordenação composta obrigatória (SPEC.md AC 4.3):
 * 1. Não-lidas (is_read == false), ordenadas por published_at decrescente
 * 2. Lidas (is_read == true), no final da lista
 */
export function sortNewsForStudio(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    if (a.is_read !== b.is_read) {
      return a.is_read ? 1 : -1;
    }
    const timeA = new Date(a.published_at).getTime();
    const timeB = new Date(b.published_at).getTime();
    return timeB - timeA;
  });
}

/**
 * Busca notícias respeitando janela máxima de 5 dias (ou dateLimit customizado)
 */
export async function getNews(dateLimit?: Date): Promise<NewsItem[]> {
  const cutoffDate = dateLimit ?? subDays(new Date(), 5);
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const snapshot = await adminDb
        .collection("news")
        .where("published_at", ">=", cutoffDate.toISOString())
        .get();

      if (snapshot.empty) {
        // Seed initial items if collection is completely empty
        const existingCheck = await adminDb.collection("news").limit(1).get();
        if (existingCheck.empty) {
          const seedItems = getInitialSeedNews();
          const batch = adminDb.batch();
          for (const item of seedItems) {
            batch.set(adminDb.collection("news").doc(item.id), item);
          }
          await batch.commit();
          return sortNewsForStudio(seedItems);
        }
      }

      const items: NewsItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as NewsItem);
      });

      return sortNewsForStudio(items);
    } catch (error) {
      console.error("[newsService] Erro Firestore em getNews, usando store local:", error);
    }
  }

  const db = readLocalDb();
  const validItems = db.news.filter((item) => {
    try {
      const pub = parseISO(item.published_at);
      return isAfter(pub, cutoffDate);
    } catch {
      return true;
    }
  });

  return sortNewsForStudio(validItems);
}

/**
 * Atualiza o status de leitura (is_read) de uma matéria
 */
export async function markAsRead(
  id: string,
  isRead: boolean
): Promise<NewsItem | null> {
  const readAt = isRead ? new Date().toISOString() : null;
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const docRef = adminDb.collection("news").doc(id);
      await docRef.set(
        {
          is_read: isRead,
          read_at: readAt,
        },
        { merge: true }
      );
      const updated = await docRef.get();
      if (updated.exists) {
        return updated.data() as NewsItem;
      }
    } catch (error) {
      console.error("[newsService] Erro Firestore em markAsRead:", error);
    }
  }

  const db = readLocalDb();
  const idx = db.news.findIndex((item) => item.id === id);
  if (idx === -1) {
    return null;
  }

  db.news[idx] = {
    ...db.news[idx],
    is_read: isRead,
    read_at: readAt,
  };
  writeLocalDb(db);
  return db.news[idx];
}

/**
 * Lista todas as fontes cadastradas (fazendo seed automático caso vazio)
 */
export async function getSources(): Promise<Source[]> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const snapshot = await adminDb.collection("sources").get();
      if (snapshot.empty) {
        const batch = adminDb.batch();
        for (const source of DEFAULT_SOURCES) {
          batch.set(adminDb.collection("sources").doc(source.id), source);
        }
        await batch.commit();
        return DEFAULT_SOURCES;
      }

      const sources: Source[] = [];
      snapshot.forEach((docSnap) => {
        sources.push(docSnap.data() as Source);
      });
      return sources;
    } catch (error) {
      console.error("[newsService] Erro Firestore em getSources:", error);
    }
  }

  const db = readLocalDb();
  return db.sources;
}

/**
 * Adiciona uma nova fonte de notícias
 */
export async function addSource(
  input: Omit<Source, "id"> & { id?: string }
): Promise<Source> {
  const isInstagramOrSocial =
    input.url.includes("instagram.com") ||
    input.url.includes("facebook.com") ||
    input.url.includes("x.com") ||
    input.url.includes("twitter.com");

  const newSource: Source = {
    id:
      input.id ||
      "src-" +
        crypto
          .createHash("md5")
          .update(input.url.trim().toLowerCase())
          .digest("hex")
          .slice(0, 10),
    name: input.name.trim(),
    url: input.url.trim(),
    rss_url: input.rss_url ?? null,
    group: input.group || (isInstagramOrSocial ? "Redes Sociais" : "Regionais"),
    active: input.active ?? true,
    is_social: input.is_social ?? isInstagramOrSocial,
    last_status: "idle",
    last_error: null,
    last_synced_at: null,
  };

  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      await adminDb.collection("sources").doc(newSource.id).set(newSource);
      return newSource;
    } catch (error) {
      console.error("[newsService] Erro Firestore em addSource:", error);
    }
  }

  const db = readLocalDb();
  const existsIdx = db.sources.findIndex(
    (s) => s.id === newSource.id || s.url.toLowerCase() === newSource.url.toLowerCase()
  );
  if (existsIdx >= 0) {
    db.sources[existsIdx] = newSource;
  } else {
    db.sources.push(newSource);
  }
  writeLocalDb(db);
  return newSource;
}

/**
 * Habilita ou desabilita uma fonte cadastrada
 */
export async function toggleSourceActive(
  id: string,
  active: boolean
): Promise<Source | null> {
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      const ref = adminDb.collection("sources").doc(id);
      await ref.set({ active }, { merge: true });
      const snap = await ref.get();
      if (snap.exists) {
        return snap.data() as Source;
      }
    } catch (error) {
      console.error("[newsService] Erro Firestore em toggleSourceActive:", error);
    }
  }

  const db = readLocalDb();
  const idx = db.sources.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  db.sources[idx] = { ...db.sources[idx], active };
  writeLocalDb(db);
  return db.sources[idx];
}

/**
 * Remove uma fonte cadastrada
 */
export async function removeSource(id: string): Promise<boolean> {
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      await adminDb.collection("sources").doc(id).delete();
      return true;
    } catch (error) {
      console.error("[newsService] Erro Firestore em removeSource:", error);
    }
  }

  const db = readLocalDb();
  const initialLen = db.sources.length;
  db.sources = db.sources.filter((s) => s.id !== id);
  writeLocalDb(db);
  return db.sources.length < initialLen;
}

/**
 * Atualiza status pós-varredura de uma fonte
 */
export async function updateSourceStatus(
  id: string,
  status: SourceStatus,
  errorMessage: string | null = null
): Promise<void> {
  const nowIso = new Date().toISOString();
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      await adminDb
        .collection("sources")
        .doc(id)
        .set(
          {
            last_status: status,
            last_error: errorMessage,
            last_synced_at: nowIso,
          },
          { merge: true }
        );
      return;
    } catch (error) {
      console.error("[newsService] Erro Firestore em updateSourceStatus:", error);
    }
  }

  const db = readLocalDb();
  const idx = db.sources.findIndex((s) => s.id === id);
  if (idx >= 0) {
    db.sources[idx] = {
      ...db.sources[idx],
      last_status: status,
      last_error: errorMessage,
      last_synced_at: nowIso,
    };
    writeLocalDb(db);
  }
}

/**
 * Verifica se uma URL já foi ingerida anteriormente (AC 2.4)
 */
export async function isArticleAlreadySaved(sourceUrl: string): Promise<boolean> {
  const hashId = createUrlHashId(sourceUrl);
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const docSnap = await adminDb.collection("news").doc(hashId).get();
      if (docSnap.exists) return true;
    } catch (error) {
      console.error("[newsService] Erro ao checar duplicidade Firestore:", error);
    }
  }

  const db = readLocalDb();
  const normalizedTarget = sourceUrl.trim().toLowerCase().replace(/\/+$/, "");
  return db.news.some(
    (n) =>
      n.id === hashId ||
      n.source_url.trim().toLowerCase().replace(/\/+$/, "") === normalizedTarget
  );
}

/**
 * Salva lote de novas matérias evitando duplicatas de URL (AC 2.4)
 */
export async function saveNewsItems(items: NewsItem[]): Promise<number> {
  if (items.length === 0) return 0;

  const adminDb = getAdminDb();
  let addedCount = 0;

  if (adminDb) {
    try {
      const batch = adminDb.batch();
      for (const item of items) {
        const docRef = adminDb.collection("news").doc(item.id);
        const existing = await docRef.get();
        if (!existing.exists) {
          batch.set(docRef, item);
          addedCount++;
        }
      }
      if (addedCount > 0) {
        await batch.commit();
      }
      return addedCount;
    } catch (error) {
      console.error("[newsService] Erro Firestore em saveNewsItems:", error);
    }
  }

  const db = readLocalDb();
  for (const item of items) {
    const normalizedUrl = item.source_url.trim().toLowerCase().replace(/\/+$/, "");
    const exists = db.news.some(
      (n) =>
        n.id === item.id ||
        n.source_url.trim().toLowerCase().replace(/\/+$/, "") === normalizedUrl
    );
    if (!exists) {
      db.news.unshift(item);
      addedCount++;
    }
  }

  if (addedCount > 0) {
    writeLocalDb(db);
  }
  return addedCount;
}

/**
 * Registra o log de sincronização e obtém o último log para alertas de Login Wall
 */
export async function saveSyncLog(log: SyncLog): Promise<void> {
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      await adminDb.collection("sync_logs").doc(log.id).set(log);
      return;
    } catch (error) {
      console.error("[newsService] Erro Firestore em saveSyncLog:", error);
    }
  }

  const db = readLocalDb();
  db.syncLogs.unshift(log);
  db.syncLogs = db.syncLogs.slice(0, 20);
  writeLocalDb(db);
}

export async function getLatestSyncLog(): Promise<SyncLog | null> {
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      const snap = await adminDb
        .collection("sync_logs")
        .orderBy("finished_at", "desc")
        .limit(1)
        .get();
      if (!snap.empty) {
        return snap.docs[0].data() as SyncLog;
      }
    } catch (error) {
      console.error("[newsService] Erro Firestore em getLatestSyncLog:", error);
    }
  }

  const db = readLocalDb();
  return db.syncLogs[0] ?? null;
}

