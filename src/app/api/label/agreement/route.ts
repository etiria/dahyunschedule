import { NextRequest, NextResponse } from "next/server";
import { computeEggimTotal, computeKyoto, KIMURA_CLASSES } from "@/lib/label/clinical";
import {
  appendKappaSnapshot,
  getExams,
  listExperts,
  readExpertLabels,
  readKappaHistory,
} from "@/lib/label/store";
import { MetricAgreement, pairwise } from "@/lib/label/agreement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only the PI may view / snapshot agreement.
const PI_ID = process.env.LABEL_PI_ID || "kdh";
const KIMURA_ORD: Record<string, number> = Object.fromEntries(
  KIMURA_CLASSES.map((c, i) => [c, i])
);

function computeAgreement() {
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

  const metrics: MetricAgreement[] = [
    pairwise(kimura, KIMURA_CLASSES.length, true, "Kimura-Takemoto"),
    pairwise(eggimTotal, 11, true, "EGGIM total (0–10)"),
    pairwise(highRisk, 2, false, "EGGIM 고위험 (≥5)"),
    pairwise(kyotoTotal, 9, true, "Kyoto total (0–8)"),
  ];
  return { experts, totalExams: getExams().length, metrics };
}

// GET /api/label/agreement?requester=<id>  -> live agreement + weekly history
export function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("requester") !== PI_ID) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ ...computeAgreement(), history: readKappaHistory() });
}

// POST /api/label/agreement/snapshot — append a dated kappa snapshot (weekly cron).
// Guarded the same way; also reachable from the VM's own cron via localhost.
export function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get("requester") !== PI_ID) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const a = computeAgreement();
  const snap = {
    ts: new Date().toISOString(),
    totalExams: a.totalExams,
    nExperts: a.experts.length,
    metrics: a.metrics.map((m) => ({
      metric: m.metric,
      avgKappa: m.avgKappa,
      totalOverlap: m.totalOverlap,
    })),
  };
  appendKappaSnapshot(snap);
  return NextResponse.json({ ok: true, snapshot: snap });
}
