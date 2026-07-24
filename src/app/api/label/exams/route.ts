import { NextRequest, NextResponse } from "next/server";
import { getExams, readExpertLabels } from "@/lib/label/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/label/exams?expert=<id>
// Returns the exam list with per-expert progress (done flag + labeled count).
export function GET(req: NextRequest) {
  const expert = req.nextUrl.searchParams.get("expert") || "";
  const labels = expert ? readExpertLabels(expert) : {};
  const exams = getExams().map((ex) => {
    const l = labels[ex.examId];
    const labeledImages = l ? Object.values(l.images).filter((i) => i.site).length : 0;
    return {
      examId: ex.examId,
      patientId: ex.patientId,
      examDate: ex.examDate,
      nImages: ex.images.length,
      done: !!l?.done,
      labeledImages,
      hasKimura: !!l?.kimura,
    };
  });
  return NextResponse.json({ exams, total: exams.length });
}
