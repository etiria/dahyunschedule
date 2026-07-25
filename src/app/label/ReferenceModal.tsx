"use client";

// Reference popups for the labeling axes. Pure text + inline SVG schematics
// (no external images), shown on demand so labelers can check criteria without
// leaving the exam. Schematics are conceptual aids, not anatomical art.

export type RefTopic = "eggim" | "kimura" | "kyoto" | null;

function Row({ g, children }: { g: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1">
      <span className="w-14 shrink-0 rounded bg-neutral-800 px-2 text-center text-xs font-semibold text-neutral-200">
        {g}
      </span>
      <span className="text-sm text-neutral-300">{children}</span>
    </div>
  );
}

/** Simplified stomach outline used by both schematics. */
function StomachOutline() {
  return (
    <path
      d="M60 30 C 120 20, 170 40, 175 110 C 178 160, 150 195, 110 200 C 95 202, 92 190, 100 185 C 130 175, 150 150, 148 115 C 145 70, 110 55, 70 62 C 55 65, 50 55, 60 30 Z"
      fill="none"
      stroke="#3a4150"
      strokeWidth="2"
    />
  );
}

function EggimDiagram() {
  const pts = [
    { x: 118, y: 178, t: "전정부 소만" },
    { x: 95, y: 192, t: "전정부 대만" },
    { x: 138, y: 150, t: "각부" },
    { x: 150, y: 95, t: "체부 소만" },
    { x: 110, y: 90, t: "체부 대만" },
  ];
  return (
    <svg viewBox="0 0 220 220" className="h-52 w-52">
      <StomachOutline />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="#4c8dff" />
          <text x={p.x + 8} y={p.y + 3} fontSize="8" fill="#9aa3b2">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

function KimuraDiagram() {
  // dashed lines marking atrophic-border progression, antrum -> fundus
  const borders = [
    { d: "M120 185 L 150 175", label: "C-1" },
    { d: "M128 160 L 158 150", label: "C-2" },
    { d: "M135 120 L 162 115", label: "C-3" },
    { d: "M120 95 L 150 88", label: "O-1" },
    { d: "M95 80 L 130 72", label: "O-2" },
    { d: "M70 62 L 110 58", label: "O-3" },
  ];
  return (
    <svg viewBox="0 0 220 220" className="h-52 w-52">
      <StomachOutline />
      {borders.map((b, i) => (
        <g key={i}>
          <path d={b.d} stroke={i < 3 ? "#35c07f" : "#e5a13a"} strokeWidth="2" strokeDasharray="3 2" />
        </g>
      ))}
      <text x="150" y="180" fontSize="8" fill="#35c07f">C1</text>
      <text x="164" y="115" fontSize="8" fill="#35c07f">C3</text>
      <text x="132" y="70" fontSize="8" fill="#e5a13a">O2</text>
    </svg>
  );
}

const CONTENT: Record<Exclude<RefTopic, null>, { title: string; body: React.ReactNode }> = {
  eggim: {
    title: "EGGIM — 참조",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-neutral-300">
          Virtual chromoendoscopy(NBI/BLI)로 <b>5부위의 장상피화생(IM)</b> 범위를 평가해 합산합니다.
          각 부위 0–2점, 총 0–10점, <b>≥5 = 고위험</b>(광범위 IM / 고단계 OLGIM과 상관).
        </p>
        <div className="flex gap-4">
          <EggimDiagram />
          <div className="text-xs leading-relaxed text-neutral-400">
            <div className="mb-2 font-semibold text-neutral-300">5부위</div>
            ① 전정부 소만 · ② 전정부 대만 · ③ 각부 · ④ 체부 소만 · ⑤ 체부 대만
            <div className="mt-3 font-semibold text-neutral-300">부위별 등급</div>
            <Row g="0">IM 없음</Row>
            <Row g="1">국소 — 해당 부위의 ≤30%</Row>
            <Row g="2">광범위 — 해당 부위의 &gt;30%</Row>
          </div>
        </div>
        <div className="rounded-lg bg-neutral-800/60 p-3 text-xs text-neutral-300">
          <b>IM 내시경 소견(예시)</b> — NBI/BLI에서 light blue crest(LBC), white opaque substance(WOS),
          융모·능선(villous/ridge) 패턴, 밝은 청색 경계선. 백색광만으로는 과소평가되기 쉬움.
        </div>
      </div>
    ),
  },
  kimura: {
    title: "Kimura-Takemoto — 참조",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-neutral-300">
          <b>위축 경계(atrophic border)</b>의 위치로 위축 범위를 분류합니다. 검사 1건당 하나로 판정.
        </p>
        <div className="flex gap-4">
          <KimuraDiagram />
          <div className="text-xs leading-relaxed text-neutral-400">
            <div className="mb-1 font-semibold text-emerald-400">폐쇄형 Closed (C)</div>
            경계가 <b>소만을 따라</b> 위쪽으로 이동
            <Row g="C-1">전정부에 국한</Row>
            <Row g="C-2">하부 체부까지</Row>
            <Row g="C-3">상부 체부까지</Row>
            <div className="mb-1 mt-2 font-semibold text-amber-400">개방형 Open (O)</div>
            경계가 <b>분문·저부</b>로 퍼져 소만을 벗어남
            <Row g="O-1">전벽/후벽으로 확장 시작</Row>
            <Row g="O-2">더 넓게</Row>
            <Row g="O-3">거의 전체</Row>
          </div>
        </div>
        <div className="rounded-lg bg-neutral-800/60 p-3 text-xs text-neutral-300">
          <b>판단 단서(예시)</b> — 위축부는 점막이 <b>퇴색·얇아지고 혈관이 투견</b>됨. 비위축부와의
          색조·혈관 투견 경계가 위축 경계. RAC(collecting venule 규칙 배열)는 비위축(정상) 시사.
        </div>
      </div>
    ),
  },
  kyoto: {
    title: "Kyoto / modified Kyoto — 참조",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-neutral-300">
          5개 소견 합산 <b>0–8점</b>. 높을수록 H. pylori 관련 위염·위암 위험 증가.
          <b> modified</b>는 지도상 발적(과거 감염/제균 후 마커)을 추가로 기록.
        </p>
        <div className="text-xs leading-relaxed text-neutral-400">
          <Row g="A 0-2">위축(Kimura 기반): 0 없음/경도(C0–1) · 1 중등도(C2–3) · 2 고도(O1–3)</Row>
          <Row g="IM 0-2">장상피화생: 0 없음 · 1 전정부 · 2 체부까지</Row>
          <Row g="H 0-1">비대주름: 체부 대만 주름 폭 확대(있음=1)</Row>
          <Row g="N 0-1">결절성: 전정부 결절/닭살양(있음=1)</Row>
          <Row g="DR 0-2">미만성 발적: 0 없음 · 1 경도(RAC 유지) · 2 고도(RAC 소실)</Row>
        </div>
        <div className="rounded-lg bg-neutral-800/60 p-3 text-xs text-neutral-300 space-y-1">
          <div><b>해석(예시)</b></div>
          <div>· 총 0점 → H. pylori <b>미감염</b> 시사(정상 점막, RAC 유지)</div>
          <div>· 총 ≥2점 → <b>현재 감염</b> 시사, 점수↑ = 위험↑</div>
          <div>· 지도상 발적(+) → <b>과거 감염/제균 후</b>, 장상피화생 동반 흔함</div>
        </div>
        <p className="text-[11px] text-neutral-500">
          ※ modified Kyoto의 정확한 정의는 그룹마다 차이가 있습니다. 본 도구는 표준 5항목(0–8) +
          지도상 발적을 별도 기록합니다. 사용하시는 정의가 다르면 알려주시면 반영하겠습니다.
        </p>
      </div>
    ),
  },
};

export default function ReferenceModal({
  topic,
  onClose,
}: {
  topic: RefTopic;
  onClose: () => void;
}) {
  if (!topic) return null;
  const c = CONTENT[topic];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-700 bg-neutral-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center">
          <h2 className="text-base font-semibold">{c.title}</h2>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg border border-neutral-700 px-3 py-1 text-sm hover:border-neutral-500"
          >
            닫기 (Esc)
          </button>
        </div>
        {c.body}
      </div>
    </div>
  );
}
