import { NextResponse, type NextRequest } from "next/server";
import {
  getSources,
  addSource,
  toggleSourceActive,
  removeSource,
  getLatestSyncLog,
} from "@/services/newsService";
import type { SourceGroup } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [sources, latestSyncLog] = await Promise.all([
      getSources(),
      getLatestSyncLog(),
    ]);
    return NextResponse.json({
      ok: true,
      sources,
      latestSyncLog,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar fontes";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      url?: string;
      rss_url?: string | null;
      group?: SourceGroup;
    };

    if (!body.name?.trim() || !body.url?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Nome e URL do portal são obrigatórios." },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(body.url.trim());
    } catch {
      return NextResponse.json(
        { ok: false, error: "Informe uma URL válida iniciando com http:// ou https://" },
        { status: 400 }
      );
    }

    const created = await addSource({
      name: body.name.trim(),
      url: parsedUrl.toString(),
      rss_url: body.rss_url?.trim() || null,
      group: body.group || "Regionais",
      active: true,
    });

    return NextResponse.json({
      ok: true,
      source: created,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao adicionar fonte";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { id?: string; active?: boolean };
    if (!body.id || typeof body.active !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "Parâmetros 'id' e 'active' são obrigatórios." },
        { status: 400 }
      );
    }

    const updated = await toggleSourceActive(body.id, body.active);
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Fonte não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      source: updated,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar fonte";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "ID da fonte é obrigatório." },
        { status: 400 }
      );
    }

    const removed = await removeSource(id);
    return NextResponse.json({ ok: removed });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao remover fonte";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

