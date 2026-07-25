import { NextRequest, NextResponse } from "next/server";
import { computeEggimTotal, computeKyoto, KIMURA_CLASSES } from "@/lib/label/clinical";
import { getExams, listExperts, readExpertLabels } from "@/lib/label/store";
import { pairwise } from "@/lib/label/agreement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only the PI may view agreement.
const PI_ID = process.env.LABEL_PI_ID || "kdh";
const KIMURA_ORD: Record<string, number> = Object.fromEntries(
  KIMURA_CLASSES.map((c, i) => [c, i])
);

// GET /api/label/agreement?requester=<id>
// Inter-rater kappa across all experts for the exam-level readouts.
export function GET(req: NextRequest) {
  const requester = req.nextUrl.searchParams.get("requester") || "";
  if (requester !== PI_ID) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const experts = listExperts();
  const kimura: Record<string, Record<string, number>> = {};
  const eggimTotal: Record<string, Record<string, number>> = {};
  const highRisk: Record<string, Record<string, number>> = {};
  const kyotoTotal: Record<string, Record<string, number>> = {};

  for (const ex of experts) {
    kimura[ex] = {};
    eggimTotal[ex] = {};
    highRisk[ex] = {};
    kyotoTotal[ex] = {};
    const labels = readExpertLabels(ex);
    for (const [examId, l] of Object.entries(labels)) {
      if (l.kimura && l.kimura in KIMURA_ORD) kimura[ex][examId] = KIMURA_ORD[l.kimura];
      const e = computeEggimTotal(l.eggim || {});
      if (e.complete && e.total !== null) {
        eggimTotal[ex][examId] = e.total;
        highRisk[ex][examId] = e.total >= 5 ? 1 : 0;
      }
      const k = computeKyoto(l.kyoto);
      if (k.complete && k.total !== null) kyotoTotal[ex][examId] = k.total;
    }
  }

  const metrics = [
    pairwise(kimura, KIMURA_CLASSES.length, true, "Kimura-Takemoto"),
    pairwise(eggimTotal, 11, true, "EGGIM total (0–10)"),
    pairwise(highRisk, 2, false, "EGGIM 고위험 (≥5)"),
    pairwise(kyotoTotal, 9, true, "Kyoto total (0–8)"),
  ];

  return NextResponse.json({ experts, totalExams: getExams().length, metrics });
}
