"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface ExamRow {
  examId: string;
  patientId: string;
  examDate: string;
  nImages: number;
  done: boolean;
  labeledImages: number;
  hasKimura: boolean;
}

interface ExpertProgress {
  expert: string;
  done: number;
  started: number;
  total: number;
  lastUpdated: string;
}

const EXPERT_KEY = "eggim_expert_id";

export default function LabelHome() {
  const [expert, setExpert] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [progress, setProgress] = useState<ExpertProgress[]>([]);
  const [progressTotal, setProgressTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");

  useEffect(() => {
    const saved = localStorage.getItem(EXPERT_KEY);
    if (saved) setExpert(saved);
  }, []);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [re, rp] = await Promise.all([
        fetch(`/api/label/exams?expert=${encodeURIComponent(id)}`),
        fetch(`/api/label/progress`),
      ]);
      const je = await re.json();
      const jp = await rp.json();
      setExams(je.exams || []);
      setProgress(jp.experts || []);
      setProgressTotal(jp.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (expert) load(expert);
  }, [expert, load]);

  function signIn() {
    const id = input.trim();
    if (!id) return;
    localStorage.setItem(EXPERT_KEY, id);
    setExpert(id);
  }
  function signOut() {
    localStorage.removeItem(EXPERT_KEY);
    setExpert("");
    setExams([]);
    setProgress([]);
  }

  if (!expert) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h1 className="text-lg font-semibold">EGGIM 라벨링</h1>
          <p className="mt-1 text-sm text-neutral-400">
            전문가 식별자를 입력하세요 (예: expert1, kim, lee). 라벨은 이 식별자별로 저장됩니다.
          </p>
          <input
            className="mt-4 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="전문가 식별자"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && signIn()}
          />
          <button
            className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
            onClick={signIn}
          >
            시작
          </button>
        </div>
      </div>
    );
  }

  const done = exams.filter((e) => e.done).length;
  const shown = exams.filter((e) =>
    filter === "all" ? true : filter === "done" ? e.done : !e.done
  );

  return (
    <div className="mx-auto max-w-4xl p-5">
      <header className="mb-4 flex items-center gap-3">
        <h1 className="text-lg font-semibold">EGGIM 라벨링</h1>
        <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
          {expert}
        </span>
        <div className="flex-1" />
        <a
          href="/api/label/export?kind=exams"
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-blue-500"
        >
          검사 CSV
        </a>
        <a
          href="/api/label/export?kind=images"
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-blue-500"
        >
          이미지 CSV
        </a>
        <button
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-blue-500"
          onClick={() => load(expert)}
        >
          새로고침
        </button>
        <button className="text-xs text-neutral-400 hover:text-neutral-200" onClick={signOut}>
          로그아웃
        </button>
      </header>

      {/* PI dashboard: all experts' progress (shown first) */}
      <section className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold">전체 진행 현황</h2>
          <span className="text-xs text-neutral-500">
            전문가 {progress.length}명 · 검사 {progressTotal}건
          </span>
          <div className="flex-1" />
          {expert === "kdh" && (
            <Link
              href="/label/agreement"
              className="rounded-lg border border-amber-700 px-3 py-1 text-xs text-amber-300 hover:border-amber-500"
            >
              판독자간 일치도 (κ) →
            </Link>
          )}
        </div>
        {progress.length === 0 ? (
          <p className="text-xs text-neutral-500">아직 라벨링을 시작한 전문가가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {progress.map((p) => {
              const pct = p.total ? Math.round((100 * p.done) / p.total) : 0;
              const mine = p.expert === expert;
              return (
                <div key={p.expert} className="flex items-center gap-3 text-sm">
                  <span
                    className={`w-28 shrink-0 truncate ${mine ? "font-semibold text-blue-300" : "text-neutral-300"}`}
                    title={p.expert}
                  >
                    {p.expert}
                    {mine ? " (나)" : ""}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded bg-neutral-800">
                    <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs tabular-nums text-neutral-400">
                    완료 {p.done}/{p.total}
                    <span className="text-neutral-600"> ({pct}%)</span>
                  </span>
                  <span className="w-16 shrink-0 text-right text-xs tabular-nums text-neutral-500">
                    진행 {p.started}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <h2 className="mb-2 text-sm font-semibold text-neutral-300">내 작업 목록</h2>
      <div className="mb-3 flex items-center gap-3 text-sm text-neutral-400">
        <span>
          완료 <b className="text-neutral-100">{done}</b> / {exams.length} 검사
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded bg-neutral-800">
          <div
            className="h-full bg-emerald-500"
            style={{ width: exams.length ? `${(100 * done) / exams.length}%` : "0" }}
          />
        </div>
        <div className="flex gap-1">
          {(["all", "todo", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-2 py-1 text-xs ${
                filter === f ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-300"
              }`}
            >
              {f === "all" ? "전체" : f === "todo" ? "남음" : "완료"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : exams.length === 0 ? (
        <p className="text-sm text-neutral-500">
          검사가 없습니다. 서버의 <code>LABEL_DATA_DIR/images</code> 폴더에 리사이즈된 이미지를 배치하세요.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800">
          {shown.map((e) => (
            <li key={e.examId}>
              <Link
                href={`/label/exam/${encodeURIComponent(e.examId)}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-900"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    e.done ? "bg-emerald-500" : e.labeledImages ? "bg-amber-500" : "bg-neutral-700"
                  }`}
                />
                <span className="font-mono text-sm">{e.examId}</span>
                <span className="text-xs text-neutral-500">
                  {e.examDate ? `${e.examDate.slice(0, 4)}-${e.examDate.slice(4, 6)}-${e.examDate.slice(6, 8)}` : ""}
                </span>
                <div className="flex-1" />
                <span className="text-xs text-neutral-400">
                  이미지 {e.labeledImages}/{e.nImages}
                  {e.hasKimura ? " · Kimura✓" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
