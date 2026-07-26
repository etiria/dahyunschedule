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

function fmtDate(d: string) {
  return d ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : "";
}

export default function LabelHome() {
  const [expert, setExpert] = useState<string>("");
  const [roster, setRoster] = useState<string[]>([]);
  const [pi, setPi] = useState<string>("kdh");
  const [newId, setNewId] = useState<string>("");
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [progress, setProgress] = useState<ExpertProgress[]>([]);
  const [progressTotal, setProgressTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");

  const loadRoster = useCallback(async () => {
    const r = await fetch("/api/label/roster");
    const j = await r.json();
    setRoster(j.experts || []);
    setPi(j.pi || "kdh");
  }, []);

  useEffect(() => {
    setExpert(localStorage.getItem(EXPERT_KEY) || "");
    loadRoster();
  }, [loadRoster]);

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

  function signIn(id: string) {
    localStorage.setItem(EXPERT_KEY, id);
    setExpert(id);
  }
  function signOut() {
    localStorage.removeItem(EXPERT_KEY);
    setExpert("");
    setExams([]);
    setProgress([]);
  }

  async function rosterAction(action: "add" | "remove", id: string) {
    await fetch("/api/label/roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requester: expert, action, id }),
    });
    await loadRoster();
    if (expert) load(expert);
  }
  function addId() {
    const id = newId.trim();
    if (!id) return;
    setNewId("");
    rosterAction("add", id);
  }
  function removeId(id: string) {
    if (!confirm(`${id} 를 명단에서 삭제할까요? (이미 저장된 라벨 데이터는 서버에 남습니다)`)) return;
    rosterAction("remove", id);
  }

  // --- login: pick your ID from the roster ---
  if (!expert) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h1 className="text-lg font-semibold">EGGIM 라벨링</h1>
          <p className="mt-1 text-sm text-neutral-400">본인 ID를 선택하세요.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {roster.map((id) => (
              <button
                key={id}
                onClick={() => signIn(id)}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm font-medium hover:border-blue-500"
              >
                {id}
              </button>
            ))}
          </div>
          {roster.length === 0 && (
            <p className="mt-3 text-xs text-neutral-500">등록된 ID가 없습니다. PI에게 문의하세요.</p>
          )}
        </div>
      </div>
    );
  }

  const done = exams.filter((e) => e.done).length;
  const shown = exams.filter((e) =>
    filter === "all" ? true : filter === "done" ? e.done : !e.done
  );

  return (
    <div className="mx-auto max-w-6xl p-5">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">EGGIM 라벨링</h1>
        <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">{expert}</span>
        <div className="flex-1" />
        <a href="/api/label/export?kind=exams" className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-blue-500">검사 CSV</a>
        <a href="/api/label/export?kind=images" className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-blue-500">이미지 CSV</a>
        <button className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-blue-500" onClick={() => load(expert)}>새로고침</button>
        <button className="text-xs text-neutral-400 hover:text-neutral-200" onClick={signOut}>로그아웃</button>
      </header>

      {/* dashboard: all experts' progress */}
      <section className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold">전체 진행 현황</h2>
          <span className="text-xs text-neutral-500">전문가 {progress.length}명 · 검사 {progressTotal}건</span>
          <div className="flex-1" />
          {expert === pi && (
            <Link href="/label/agreement" className="rounded-lg border border-amber-700 px-3 py-1 text-xs text-amber-300 hover:border-amber-500">
              판독자간 일치도 (κ) →
            </Link>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {progress.map((p) => {
            const pct = p.total ? Math.round((100 * p.done) / p.total) : 0;
            const mine = p.expert === expert;
            return (
              <div key={p.expert} className="flex items-center gap-3 text-sm">
                <span className={`w-24 shrink-0 truncate ${mine ? "font-semibold text-blue-300" : "text-neutral-300"}`} title={p.expert}>
                  {p.expert}{mine ? " (나)" : ""}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded bg-neutral-800">
                  <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-24 shrink-0 text-right text-xs tabular-nums text-neutral-400">
                  완료 {p.done}/{p.total}<span className="text-neutral-600"> ({pct}%)</span>
                </span>
                <span className="w-14 shrink-0 text-right text-xs tabular-nums text-neutral-500">진행 {p.started}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* PI-only: roster (ID) management */}
      {expert === pi && (
        <section className="mb-6 rounded-xl border border-amber-900/60 bg-neutral-900 p-4">
          <h2 className="mb-2 text-sm font-semibold text-amber-300">ID 관리 (PI 전용)</h2>
          <div className="mb-3 flex gap-2">
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addId()}
              placeholder="새 ID (예: LSY)"
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
            />
            <button onClick={addId} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500">추가</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {roster.map((id) => (
              <span key={id} className="flex items-center gap-2 rounded-full bg-neutral-800 px-3 py-1 text-xs">
                {id}{id === pi && <span className="text-neutral-500">(PI)</span>}
                {id !== pi && (
                  <button onClick={() => removeId(id)} className="text-neutral-500 hover:text-red-400" title="삭제">✕</button>
                )}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">비밀번호는 전원 공통 2044. 각자 본인 ID로 접속합니다.</p>
        </section>
      )}

      {/* my worklist */}
      <div className="mb-3 flex items-center gap-3 text-sm text-neutral-400">
        <h2 className="text-sm font-semibold text-neutral-300">내 작업 목록</h2>
        <span>완료 <b className="text-neutral-100">{done}</b> / {exams.length}</span>
        <div className="h-2 w-32 overflow-hidden rounded bg-neutral-800">
          <div className="h-full bg-emerald-500" style={{ width: exams.length ? `${(100 * done) / exams.length}%` : "0" }} />
        </div>
        <div className="flex-1" />
        <div className="flex gap-1">
          {(["all", "todo", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-2 py-1 text-xs ${filter === f ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-300"}`}
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {shown.map((e) => (
            <Link
              key={e.examId}
              href={`/label/exam/${encodeURIComponent(e.examId)}`}
              className={`rounded-lg border p-3 transition hover:border-blue-500 ${
                e.done
                  ? "border-emerald-700 bg-emerald-950/30"
                  : e.labeledImages
                  ? "border-amber-700 bg-amber-950/20"
                  : "border-neutral-800 bg-neutral-900"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    e.done ? "bg-emerald-500" : e.labeledImages ? "bg-amber-500" : "bg-neutral-600"
                  }`}
                />
                <span className="truncate font-mono text-xs" title={e.examId}>{e.patientId}</span>
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">{fmtDate(e.examDate)}</div>
              <div className="mt-2 text-[11px] text-neutral-400">
                img {e.labeledImages}/{e.nImages}
                {e.hasKimura ? " · K✓" : ""}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
