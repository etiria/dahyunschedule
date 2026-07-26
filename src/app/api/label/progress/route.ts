import { NextResponse } from "next/server";
import { getExams, readExpertLabels, readRoster } from "@/lib/label/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/label/progress
// PI dashboard data: per-expert completion across all exams (roster order).
export function GET() {
  const total = getExams().length;
  const experts = readRoster()
    .map((expert) => {
      const labels = readExpertLabels(expert);
      let done = 0;
      let started = 0;
      let lastUpdated = "";
      for (const l of Object.values(labels)) {
        const touched =
          (l.images && Object.values(l.images).some((i) => i.site)) ||
          !!l.kimura ||
          (l.eggim && Object.keys(l.eggim).length > 0) ||
          (l.kyoto && Object.keys(l.kyoto).length > 0);
        if (touched) started += 1;
        if (l.done) done += 1;
        if (l.updatedAt && l.updatedAt > lastUpdated) lastUpdated = l.updatedAt;
      }
      return { expert, done, started, total, lastUpdated };
    });
  return NextResponse.json({ total, experts });
}
