import { NextRequest, NextResponse } from "next/server";
import { EGGIM_SITES } from "@/lib/label/clinical";
import { getExams, listExperts, readExpertLabels } from "@/lib/label/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/label/export?kind=images|exams  (default images)
// Merges every expert's labels into one CSV for downstream training / IRR.
//   images: one row per (expert, image) with site/quality/representative
//   exams:  one row per (expert, exam)  with kimura + 5 area grades
export function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind") || "images";
  const experts = listExperts();
  const exams = getExams();

  let header: string[];
  const rows: string[][] = [];

  if (kind === "exams") {
    header = ["expert", "exam_id", "patient_id", "exam_date", "kimura", "done",
      ...EGGIM_SITES.map((s) => `eggim_${s}`), "eggim_total"];
    for (const expert of experts) {
      const labels = readExpertLabels(expert);
      for (const ex of exams) {
        const l = labels[ex.examId];
        if (!l) continue;
        const grades = EGGIM_SITES.map((s) => l.eggim?.[s]);
        const complete = grades.every((g) => g === 0 || g === 1 || g === 2);
        const total = complete
          ? grades.reduce<number>((a, g) => a + (g as number), 0)
          : "";
        rows.push([
          expert, ex.examId, ex.patientId, ex.examDate, l.kimura ?? "",
          l.done ? "1" : "0",
          ...grades.map((g) => (g === undefined ? "" : String(g))),
          String(total),
        ]);
      }
    }
  } else {
    header = ["expert", "exam_id", "patient_id", "image_id", "site", "quality_ok", "representative"];
    for (const expert of experts) {
      const labels = readExpertLabels(expert);
      for (const ex of exams) {
        const l = labels[ex.examId];
        if (!l) continue;
        for (const [imageId, il] of Object.entries(l.images)) {
          if (!il.site) continue;
          rows.push([
            expert, ex.examId, ex.patientId, imageId, il.site,
            il.quality_ok === undefined ? "" : String(il.quality_ok),
            il.representative ? "1" : "0",
          ]);
        }
      }
    }
  }

  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="eggim_${kind}.csv"`,
    },
  });
}
