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

const EXPERT_KEY = "eggim_expert_id";

export default function LabelHome() {
  const [expert, setExpert] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");

  useEffect(() => {
    const saved = localStorage.getItem(EXPERT_KEY);
    if (saved) setExpert(saved);
  }, []);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/label/exams?expert=${encodeURIComponent(id)}`);
      const j = await r.json();
      setExams(j.exams || []);
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
        <button className="text-xs text-neutral-400 hover:text-neutral-200" onClick={signOut}>
          로그아웃
        </button>
      </header>

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
