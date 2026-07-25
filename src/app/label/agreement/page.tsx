"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { kappaLabel, MetricAgreement } from "@/lib/label/agreement";

const EXPERT_KEY = "eggim_expert_id";
const PI_ID = "kdh";

function fmt(k: number | null) {
  return k === null ? "—" : k.toFixed(2);
}

export default function AgreementPage() {
  const [expert, setExpert] = useState<string | null>(null);
  const [data, setData] = useState<{ experts: string[]; totalExams: number; metrics: MetricAgreement[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setExpert(localStorage.getItem(EXPERT_KEY) || "");
  }, []);

  useEffect(() => {
    if (expert !== PI_ID) return;
    setLoading(true);
    fetch(`/api/label/agreement?requester=${encodeURIComponent(PI_ID)}`)
      .then((r) => r.json())
      .then((j) => setData(j))
      .finally(() => setLoading(false));
  }, [expert]);

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
        </div>
      )}
    </div>
  );
}
