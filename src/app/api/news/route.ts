import { NextResponse, type NextRequest } from "next/server";
import {
  getNews,
  markAsRead,
  getLatestSyncLog,
} from "@/services/newsService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [news, latestSyncLog] = await Promise.all([
      getNews(),
      getLatestSyncLog(),
    ]);

    return NextResponse.json({
      ok: true,
      news,
      latestSyncLog,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar pautas";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { id?: string; is_read?: boolean };

    if (!body.id || typeof body.is_read !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "Parâmetros 'id' e 'is_read' são obrigatórios" },
        { status: 400 }
      );
    }

    const updated = await markAsRead(body.id, body.is_read);
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Matéria não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      item: updated,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao atualizar status de leitura";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

