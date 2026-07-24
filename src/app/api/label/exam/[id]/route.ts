import { NextRequest, NextResponse } from "next/server";
import { getExam, readExpertLabels } from "@/lib/label/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/label/exam/<examId>?expert=<id>
// Returns the exam's images (with URLs) and this expert's saved label, if any.
export function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ex = getExam(params.id);
  if (!ex) return NextResponse.json({ error: "exam not found" }, { status: 404 });
  const expert = req.nextUrl.searchParams.get("expert") || "";
  const label = expert ? readExpertLabels(expert)[ex.examId] : undefined;
  return NextResponse.json({
    examId: ex.examId,
    patientId: ex.patientId,
    examDate: ex.examDate,
    images: ex.images.map((im) => ({
      imageId: im.imageId,
      url: `/api/label/image?p=${encodeURIComponent(im.imageId)}`,
    })),
    label: label ?? null,
  });
}
