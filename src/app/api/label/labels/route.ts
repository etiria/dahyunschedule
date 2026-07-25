import { NextRequest, NextResponse } from "next/server";
import { ExamLabel, readExpertLabels, writeExamLabel } from "@/lib/label/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/label/labels?expert=<id>&exam=<examId>  -> saved label (or null)
export function GET(req: NextRequest) {
  const expert = req.nextUrl.searchParams.get("expert") || "";
  const exam = req.nextUrl.searchParams.get("exam") || "";
  if (!expert || !exam) {
    return NextResponse.json({ error: "expert and exam required" }, { status: 400 });
  }
  const label = readExpertLabels(expert)[exam] ?? null;
  return NextResponse.json({ label });
}

// PUT /api/label/labels?expert=<id>   body: ExamLabel
export async function PUT(req: NextRequest) {
  const expert = req.nextUrl.searchParams.get("expert") || "";
  if (!expert) {
    return NextResponse.json({ error: "expert required" }, { status: 400 });
  }
  let body: ExamLabel;
  try {
    body = (await req.json()) as ExamLabel;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body?.examId) {
    return NextResponse.json({ error: "examId required" }, { status: 400 });
  }
  const saved = writeExamLabel(expert, {
    examId: body.examId,
    images: body.images || {},
    kimura: body.kimura,
    eggim: body.eggim || {},
    kyoto: body.kyoto || {},
    done: !!body.done,
  });
  return NextResponse.json({ label: saved });
}
