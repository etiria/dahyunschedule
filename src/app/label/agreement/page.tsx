"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { kappaLabel, MetricAgreement } from "@/lib/label/agreement";

const EXPERT_KEY = "eggim_expert_id";
const PI_ID = "kdh";

function fmt(k: number | null) {
  return k === null ? "—" : k.toFixed(2);
}

interface Snapshot {
  ts: string;
  totalExams: number;
  nExperts: number;
  metrics: { metric: string; avgKappa: number | null; totalOverlap: number }[];
}

export default function AgreementPage() {
  const [expert, setExpert] = useState<string | null>(null);
  const [data, setData] = useState<{ experts: string[]; totalExams: number; metrics: MetricAgreement[]; history?: Snapshot[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [snapping, setSnapping] = useState(false);

  useEffect(() => {
    setExpert(localStorage.getItem(EXPERT_KEY) || "");
  }, []);

  function loadAgreement() {
    setLoading(true);
    fetch(`/api/label/agreement?requester=${encodeURIComponent(PI_ID)}`)
      .then((r) => r.json())
      .then((j) => setData(j))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (expert !== PI_ID) return;
    loadAgreement();
  }, [expert]);

  function snapshotNow() {
    setSnapping(true);
    fetch(`/api/label/agreement?requester=${encodeURIComponent(PI_ID)}`, { method: "POST" })
      .then((r) => r.json())
      .then(() => loadAgreement())
      .finally(() => setSnapping(false));
  }

  if (expert === null) return <div className="p-6 text-sm text-neutral-500">불러오는 중…</div>;

  if (expert !== PI_ID) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-sm text-neutral-400">이 페이지는 PI 전용입니다.</p>
        <Link href="/label" className="mt-3 inline-block text-sm text-blue-400 underline">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-5">
      <header className="mb-4 flex items-center gap-3">
        <Link href="/label" className="text-sm text-neutral-400 hover:text-neutral-100">← 목록</Link>
        <h1 className="text-lg font-semibold">판독자간 일치도 (κ)</h1>
        <div className="flex-1" />
        {data && (
          <span className="text-xs text-neutral-500">
            전문가 {data.experts.length}명 · 검사 {data.totalExams}건
          </span>
        )}
        <button
          onClick={snapshotNow}
          disabled={snapping}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-blue-500 disabled:opacity-50"
          title="현재 κ를 주간 추이에 기록"
        >
          {snapping ? "기록 중…" : "스냅샷 기록"}
        </button>
      </header>

      <p className="mb-4 text-xs text-neutral-500">
        각 지표별로 전문가 쌍마다 공통 라벨한 검사에서 κ를 계산해 평균합니다. 순서형 지표는
        quadratic-weighted κ, 고위험(이진)은 Cohen κ. 해석: 0.2 미만 slight · 0.2–0.4 fair ·
        0.4–0.6 moderate · 0.6–0.8 substantial · 0.8+ almost perfect.
      </p>

      {loading ? (
        <p className="text-sm text-neutral-500">계산 중…</p>
      ) : !data ? (
        <p className="text-sm text-neutral-500">데이터가 없습니다.</p>
      ) : (
        <div className="space-y-5">
          {data.metrics.map((m) => (
            <section key={m.metric} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="mb-2 flex items-center gap-3">
                <h2 className="text-sm font-semibold">{m.metric}</h2>
                <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs">
                  평균 κ = <b>{fmt(m.avgKappa)}</b>{" "}
                  <span className="text-neutral-400">({kappaLabel(m.avgKappa)})</span>
                </span>
                <span className="text-xs text-neutral-500">중복 {m.totalOverlap}건</span>
              </div>
              {m.totalOverlap === 0 ? (
                <p className="text-xs text-neutral-500">아직 두 명 이상이 공통으로 라벨한 검사가 없습니다.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-neutral-500">
                    <tr>
                      <th className="py-1 text-left font-normal">전문가 A</th>
                      <th className="py-1 text-left font-normal">전문가 B</th>
                      <th className="py-1 text-right font-normal">공통 검사</th>
                      <th className="py-1 text-right font-normal">κ</th>
                      <th className="py-1 text-right font-normal">해석</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {m.pairs.map((p, i) => (
                      <tr key={i} className="border-t border-neutral-800">
                        <td className="py-1">{p.a}</td>
                        <td className="py-1">{p.b}</td>
                        <td className="py-1 text-right">{p.n}</td>
                        <td className="py-1 text-right font-semibold">{fmt(p.kappa)}</td>
                        <td className="py-1 text-right text-neutral-400">{kappaLabel(p.kappa)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}

          {/* weekly trend */}
          <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <h2 className="mb-2 text-sm font-semibold">주간 추이</h2>
            {!data.history || data.history.length === 0 ? (
              <p className="text-xs text-neutral-500">
                아직 기록된 스냅샷이 없습니다. 매주 자동 기록되며, 지금 바로 남기려면 위 ‘스냅샷 기록’을 누르세요.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-neutral-500">
                    <tr>
                      <th className="py-1 text-left font-normal">날짜</th>
                      <th className="py-1 text-right font-normal">검사수</th>
                      {data.history[data.history.length - 1].metrics.map((m) => (
                        <th key={m.metric} className="py-1 text-right font-normal">{m.metric.split(" ")[0]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {data.history.slice().reverse().map((s, i) => (
                      <tr key={i} className="border-t border-neutral-800">
                        <td className="py-1">{s.ts.slice(0, 10)}</td>
                        <td className="py-1 text-right">{s.totalExams}</td>
                        {s.metrics.map((m) => (
                          <td key={m.metric} className="py-1 text-right font-semibold">
                            {fmt(m.avgKappa)}
                            <span className="ml-1 font-normal text-neutral-600">({m.totalOverlap})</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-[11px] text-neutral-500">
                  값 = 평균 κ (괄호 = 공통 라벨 검사 수). 매주 월요일 자동 기록됩니다.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
