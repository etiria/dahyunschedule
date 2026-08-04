"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeEggimTotal,
  computeKyoto,
  EGGIM_SITES,
  EggimSite,
  ImGrade,
  isHighRisk,
  KIMURA_CLASSES,
  KIMURA_LABELS_KO,
  KYOTO_COMPONENTS,
  KYOTO_MODIFIED,
  MAX_KYOTO,
  SITE_CLASSES,
  SITE_LABELS_KO,
} from "@/lib/label/clinical";
import ReferenceModal, { RefTopic } from "../../ReferenceModal";

interface ImgLabel {
  site?: string;
  quality_ok?: 0 | 1;
  representative?: boolean;
}
interface ExamImage {
  imageId: string;
  url: string;
}

const EXPERT_KEY = "eggim_expert_id";
const SITE_KEYS: Record<string, string> = {
  "1": "antrum_lesser",
  "2": "antrum_greater",
  "3": "incisura",
  "4": "corpus_lesser",
  "5": "corpus_greater",
  "6": "cardia_uturn",
  "7": "fundus",
  "8": "other",
};

export default function ExamLabelPage({ params }: { params: { id: string } }) {
  const examId = params.id;
  const [expert, setExpert] = useState("");
  const [images, setImages] = useState<ExamImage[]>([]);
  const [imgLabels, setImgLabels] = useState<Record<string, ImgLabel>>({});
  const [kimura, setKimura] = useState<string>("");
  const [eggim, setEggim] = useState<Partial<Record<EggimSite, ImGrade>>>({});
  const [kyoto, setKyoto] = useState<Record<string, number>>({});
  const [refTopic, setRefTopic] = useState<RefTopic>(null);
  const [done, setDone] = useState(false);
  const [focus, setFocus] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [loaded, setLoaded] = useState(false);
  const dirty = useRef(false);

  useEffect(() => {
    setExpert(localStorage.getItem(EXPERT_KEY) || "");
  }, []);

  // load exam + saved label
  useEffect(() => {
    if (!expert) return;
    (async () => {
      const r = await fetch(
        `/api/label/exam/${encodeURIComponent(examId)}?expert=${encodeURIComponent(expert)}`
      );
      const j = await r.json();
      setImages(j.images || []);
      if (j.label) {
        setImgLabels(j.label.images || {});
        setKimura(j.label.kimura || "");
        setEggim(j.label.eggim || {});
        setKyoto(j.label.kyoto || {});
        setDone(!!j.label.done);
      }
      setLoaded(true);
    })();
  }, [expert, examId]);

  const save = useCallback(
    async (markDone?: boolean) => {
      if (!expert) return;
      setSaveState("saving");
      const body = {
        examId,
        images: imgLabels,
        kimura: kimura || undefined,
        eggim,
        kyoto,
        done: markDone ?? done,
      };
      await fetch(`/api/label/labels?expert=${encodeURIComponent(expert)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      dirty.current = false;
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    },
    [expert, examId, imgLabels, kimura, eggim, kyoto, done]
  );

  // debounced autosave whenever labels change
  useEffect(() => {
    if (!loaded || !dirty.current) return;
    const t = setTimeout(() => save(), 900);
    return () => clearTimeout(t);
  }, [imgLabels, kimura, eggim, kyoto, loaded, save]);

  const mutate = (fn: () => void) => {
    dirty.current = true;
    fn();
  };

  const setSite = useCallback(
    (imageId: string, site: string) =>
      mutate(() =>
        setImgLabels((s) => ({ ...s, [imageId]: { ...s[imageId], site } }))
      ),
    []
  );
  const toggleQuality = useCallback(
    (imageId: string) =>
      mutate(() =>
        setImgLabels((s) => {
          const cur = s[imageId]?.quality_ok;
          return { ...s, [imageId]: { ...s[imageId], quality_ok: cur === 0 ? 1 : 0 } };
        })
      ),
    []
  );
  const toggleRepresentative = useCallback(
    (imageId: string) =>
      mutate(() =>
        setImgLabels((s) => {
          const cur = s[imageId] || {};
          const next = { ...s };
          const turningOn = !cur.representative;
          if (turningOn && cur.site) {
            // only one representative per site within the exam
            for (const [id, l] of Object.entries(next)) {
              if (id !== imageId && l.site === cur.site && l.representative) {
                next[id] = { ...l, representative: false };
              }
            }
          }
          next[imageId] = { ...cur, representative: turningOn };
          return next;
        })
      ),
    []
  );
  const setArea = (site: EggimSite, g: ImGrade) =>
    mutate(() => setEggim((s) => ({ ...s, [site]: s[site] === g ? undefined : g })));
  const setKyotoComp = (key: string, v: number) =>
    mutate(() =>
      setKyoto((s) => {
        const next = { ...s };
        if (next[key] === v) delete next[key];
        else next[key] = v;
        return next;
      })
    );

  // keyboard: labels the focused image
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (refTopic) {
        if (e.key === "Escape") setRefTopic(null);
        return; // don't label while a reference popup is open
      }
      const img = images[focus];
      if (!img) return;
      const k = e.key;
      if (SITE_KEYS[k]) {
        setSite(img.imageId, SITE_KEYS[k]);
        e.preventDefault();
      } else if (k === "0") {
        toggleQuality(img.imageId);
        e.preventDefault();
      } else if (k === "r" || k === "R") {
        toggleRepresentative(img.imageId);
        e.preventDefault();
      } else if (k === "ArrowRight" || k === " ") {
        setFocus((f) => Math.min(images.length - 1, f + 1));
        e.preventDefault();
      } else if (k === "ArrowLeft") {
        setFocus((f) => Math.max(0, f - 1));
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images, focus, setSite, toggleQuality, toggleRepresentative, refTopic]);

  const eggimResult = useMemo(() => computeEggimTotal(eggim), [eggim]);
  const highRisk = isHighRisk(eggimResult.total);
  const kyotoResult = useMemo(() => computeKyoto(kyoto), [kyoto]);
  // how many images in THIS exam are assigned to each site (for coverage badges)
  const siteCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of Object.values(imgLabels)) {
      if (l.site) c[l.site] = (c[l.site] || 0) + 1;
    }
    return c;
  }, [imgLabels]);

  if (!expert) {
    return (
      <div className="p-6 text-sm">
        전문가 식별자가 필요합니다. <Link href="/label" className="text-blue-400 underline">로그인</Link>
      </div>
    );
  }

  const focused = images[focus];

  return (
    <div className="flex h-screen flex-col">
      {/* header */}
      <header className="flex items-center gap-3 border-b border-neutral-800 px-4 py-2.5">
        <Link href="/label" className="text-sm text-neutral-400 hover:text-neutral-100">← 목록</Link>
        <span className="font-mono text-sm">{examId}</span>
        <div className="flex-1" />
        <span className="text-xs text-neutral-500">
          {saveState === "saving" ? "저장 중…" : saveState === "saved" ? "저장됨 ✓" : ""}
        </span>
        <button onClick={() => save()} className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-blue-500">
          저장
        </button>
        <button
          onClick={() => { setDone(true); save(true); }}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500"
        >
          완료 표시
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* left: focused image + grid */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 items-center justify-center bg-black">
            {focused ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={focused.url} alt={focused.imageId} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-sm text-neutral-600">{loaded ? "이미지 없음" : "불러오는 중…"}</span>
            )}
          </div>
          <div className="grid grid-cols-8 gap-1 overflow-y-auto border-t border-neutral-800 p-2" style={{ maxHeight: "34%" }}>
            {images.map((im, i) => {
              const l = imgLabels[im.imageId] || {};
              const badge = l.site
                ? l.site === "other"
                  ? "·"
                  : l.site === "cardia_uturn"
                  ? "U"
                  : l.site === "fundus"
                  ? "F"
                  : l.site.startsWith("antrum")
                  ? "A"
                  : l.site === "incisura"
                  ? "I"
                  : "C"
                : "";
              return (
                <button
                  key={im.imageId}
                  onClick={() => setFocus(i)}
                  className={`relative aspect-square overflow-hidden rounded border ${
                    i === focus ? "border-blue-500" : "border-neutral-800"
                  }`}
                  title={im.imageId}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.url} alt="" className="h-full w-full object-cover" />
                  {l.site && (
                    <span className={`absolute left-0 top-0 px-1 text-[10px] font-bold ${l.representative ? "bg-blue-600" : "bg-black/70"}`}>
                      {badge}{l.representative ? "★" : ""}
                    </span>
                  )}
                  {l.quality_ok === 0 && (
                    <span className="absolute bottom-0 right-0 bg-red-600 px-1 text-[9px]">저화질</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* right: labeling panel */}
        <aside className="w-[340px] shrink-0 overflow-y-auto border-l border-neutral-800 p-4">
          {/* per-image: localization */}
          <section className="mb-5">
            <h3 className="mb-2 text-xs uppercase tracking-wide text-neutral-500">
              부위 (이미지 {images.length ? focus + 1 : 0}/{images.length}) · 키 1~8
            </h3>
            <div className="flex flex-col gap-1.5">
              {SITE_CLASSES.map((s, i) => {
                const active = focused && imgLabels[focused.imageId]?.site === s;
                const count = siteCounts[s] || 0;
                const covered = count > 0;
                return (
                  <button
                    key={s}
                    onClick={() => focused && setSite(focused.imageId, s)}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm ${
                      active
                        ? "border-blue-500 bg-blue-950"
                        : covered
                        ? "border-emerald-700 bg-emerald-950/40"
                        : "border-neutral-800 hover:border-neutral-600"
                    }`}
                  >
                    <span className="rounded bg-neutral-800 px-1.5 text-xs">{i + 1}</span>
                    {SITE_LABELS_KO[s]}
                    {covered && (
                      <span className="ml-auto text-xs font-semibold text-emerald-400">
                        ✓{count > 1 ? ` ${count}` : ""}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => focused && toggleQuality(focused.imageId)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs ${
                  focused && imgLabels[focused.imageId]?.quality_ok === 0
                    ? "border-red-500 bg-red-950"
                    : "border-neutral-800"
                }`}
              >
                화질 부적정 (0)
              </button>
              <button
                onClick={() => focused && toggleRepresentative(focused.imageId)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs ${
                  focused && imgLabels[focused.imageId]?.representative
                    ? "border-blue-500 bg-blue-950"
                    : "border-neutral-800"
                }`}
              >
                대표사진 ★ (R)
              </button>
            </div>
          </section>

          {/* exam-level: Kimura-Takemoto */}
          <section className="mb-5">
            <h3 className="mb-2 flex items-center text-xs uppercase tracking-wide text-neutral-500">
              Kimura-Takemoto (검사 1건)
              <button
                onClick={() => setRefTopic("kimura")}
                className="ml-2 h-5 w-5 rounded-full border border-neutral-600 text-[11px] text-neutral-400 hover:border-blue-500 hover:text-blue-400"
                title="참조자료 보기"
              >
                ?
              </button>
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {KIMURA_CLASSES.map((k) => (
                <button
                  key={k}
                  onClick={() => mutate(() => setKimura(kimura === k ? "" : k))}
                  className={`rounded-lg border px-2 py-1.5 text-xs ${
                    kimura === k ? "border-blue-500 bg-blue-950" : "border-neutral-800 hover:border-neutral-600"
                  }`}
                  title={KIMURA_LABELS_KO[k]}
                >
                  {k === "normal" ? "정상" : k}
                </button>
              ))}
            </div>
          </section>

          {/* exam-level: EGGIM per area */}
          <section className="mb-5">
            <h3 className="mb-2 flex items-center text-xs uppercase tracking-wide text-neutral-500">
              EGGIM 부위별 등급
              <button
                onClick={() => setRefTopic("eggim")}
                className="ml-2 h-5 w-5 rounded-full border border-neutral-600 text-[11px] text-neutral-400 hover:border-blue-500 hover:text-blue-400"
                title="참조자료 보기"
              >
                ?
              </button>
            </h3>
            <div className="flex flex-col gap-1.5">
              {EGGIM_SITES.map((site) => (
                <div key={site} className="flex items-center gap-2">
                  <span className="w-24 text-sm">{SITE_LABELS_KO[site]}</span>
                  <div className="flex gap-1">
                    {([0, 1, 2] as ImGrade[]).map((g) => (
                      <button
                        key={g}
                        onClick={() => setArea(site, g)}
                        className={`h-8 w-8 rounded-lg border text-sm ${
                          eggim[site] === g ? "border-blue-500 bg-blue-950" : "border-neutral-800 hover:border-neutral-600"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm">
              <span className="text-neutral-400">EGGIM</span>
              {eggimResult.complete ? (
                <>
                  <b className="text-lg">{eggimResult.total}</b>
                  <span className="text-neutral-500">/10</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${highRisk ? "bg-red-600" : "bg-emerald-700"}`}>
                    {highRisk ? "고위험 (≥5)" : "저위험"}
                  </span>
                </>
              ) : (
                <span className="text-amber-500">미완성 {eggimResult.assessed}/5 부위</span>
              )}
            </div>
          </section>

          {/* exam-level: Kyoto / modified Kyoto */}
          <section className="mb-5">
            <h3 className="mb-2 flex items-center text-xs uppercase tracking-wide text-neutral-500">
              Kyoto / modified Kyoto
              <button
                onClick={() => setRefTopic("kyoto")}
                className="ml-2 h-5 w-5 rounded-full border border-neutral-600 text-[11px] text-neutral-400 hover:border-blue-500 hover:text-blue-400"
                title="참조자료 보기"
              >
                ?
              </button>
            </h3>
            <div className="flex flex-col gap-1.5">
              {KYOTO_COMPONENTS.map((c) => (
                <div key={c.key} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-sm">{c.label}</span>
                  <div className="flex gap-1">
                    {c.grades.map((g) => (
                      <button
                        key={g.v}
                        onClick={() => setKyotoComp(c.key, g.v)}
                        title={g.label}
                        className={`h-8 w-8 rounded-lg border text-sm ${
                          kyoto[c.key] === g.v
                            ? "border-blue-500 bg-blue-950"
                            : "border-neutral-800 hover:border-neutral-600"
                        }`}
                      >
                        {g.v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-1 flex items-center gap-2 border-t border-neutral-800 pt-2">
                <span className="w-28 shrink-0 text-sm text-amber-300">{KYOTO_MODIFIED.label}</span>
                <div className="flex gap-1">
                  {KYOTO_MODIFIED.grades.map((g) => (
                    <button
                      key={g.v}
                      onClick={() => setKyotoComp(KYOTO_MODIFIED.key, g.v)}
                      title={g.label}
                      className={`h-8 w-8 rounded-lg border text-sm ${
                        kyoto[KYOTO_MODIFIED.key] === g.v
                          ? "border-amber-500 bg-amber-950"
                          : "border-neutral-800 hover:border-neutral-600"
                      }`}
                    >
                      {g.v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-neutral-900 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">Kyoto</span>
                {kyotoResult.complete ? (
                  <>
                    <b className="text-lg">{kyotoResult.total}</b>
                    <span className="text-neutral-500">/{MAX_KYOTO}</span>
                  </>
                ) : (
                  <span className="text-amber-500">미완성 {kyotoResult.assessed}/5 항목</span>
                )}
              </div>
              {kyotoResult.hint && (
                <p className="mt-1 text-[11px] text-neutral-400">{kyotoResult.hint}</p>
              )}
            </div>
          </section>

          <p className="text-[11px] leading-relaxed text-neutral-500">
            부위 0=없음·1=국소(≤30%)·2=광범위(&gt;30%). 대표사진은 부위당 1장, 그 부위 EGGIM 등급의 근거 이미지로 사용됩니다.
            각 섹션의 <b>?</b> 를 누르면 기준·모식도를 볼 수 있습니다. 변경 시 자동 저장됩니다.
          </p>
        </aside>
      </div>

      <ReferenceModal topic={refTopic} onClose={() => setRefTopic(null)} />
    </div>
  );
}
