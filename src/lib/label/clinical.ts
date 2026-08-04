// Clinical constants and helpers for the EGGIM labeling app.
// Mirrors eggim/eggim/config.py + aggregate.py so the web tool and the Python
// training pipeline stay in lockstep.

export const EGGIM_SITES = [
  "antrum_lesser",
  "antrum_greater",
  "incisura",
  "corpus_lesser",
  "corpus_greater",
] as const;
export type EggimSite = (typeof EGGIM_SITES)[number];

export const NON_TARGET_SITE = "other";
// Cardia retroflexion ("U-turn") view — not an EGGIM scoring area, but a key
// view for Kimura-Takemoto (assessing fundus/cardia atrophic extent), so it is
// a first-class localization label.
export const CARDIA_UTURN = "cardia_uturn";
export const FUNDUS = "fundus";
export type SiteClass =
  | EggimSite
  | typeof CARDIA_UTURN
  | typeof FUNDUS
  | typeof NON_TARGET_SITE;
export const SITE_CLASSES: SiteClass[] = [
  ...EGGIM_SITES,
  CARDIA_UTURN,
  FUNDUS,
  NON_TARGET_SITE,
];

export const SITE_LABELS_KO: Record<SiteClass, string> = {
  antrum_lesser: "전정부 소만",
  antrum_greater: "전정부 대만",
  incisura: "각부",
  corpus_lesser: "체부 소만",
  corpus_greater: "체부 대만",
  cardia_uturn: "분문부 U-turn",
  fundus: "위저부",
  other: "해당없음",
};

// EGGIM per-area grade: 0 none / 1 focal(<=30%) / 2 extensive(>30%)
export const IM_GRADES = [0, 1, 2] as const;
export type ImGrade = 0 | 1 | 2;
export const MAX_EGGIM = 10;
export const EGGIM_HIGH_RISK_THRESHOLD = 5;

// Kimura-Takemoto atrophy classification (per exam, single label).
// "normal" = no atrophy; closed types C-1..C-3; open types O-1..O-3.
export const KIMURA_CLASSES = [
  "normal",
  "C-1",
  "C-2",
  "C-3",
  "O-1",
  "O-2",
  "O-3",
] as const;
export type KimuraClass = (typeof KIMURA_CLASSES)[number];
export const KIMURA_LABELS_KO: Record<KimuraClass, string> = {
  normal: "정상 (위축 없음)",
  "C-1": "C-1",
  "C-2": "C-2",
  "C-3": "C-3",
  "O-1": "O-1",
  "O-2": "O-2",
  "O-3": "O-3",
};

// ---- Kyoto Classification of Gastritis score ----
// Five endoscopic findings summed to 0-8. A higher score tracks H. pylori-
// associated gastritis and gastric-cancer risk. The "modified" variant adds
// map-like redness (a marker of past infection / intestinal metaplasia).
export interface KyotoGrade {
  v: number;
  label: string;
}
export interface KyotoComponentDef {
  key: string;
  label: string;
  max: number;
  grades: KyotoGrade[];
}

export const KYOTO_COMPONENTS: KyotoComponentDef[] = [
  {
    key: "atrophy",
    label: "위축 (A)",
    max: 2,
    grades: [
      { v: 0, label: "0 · 없음/경도 (C0–C1)" },
      { v: 1, label: "1 · 중등도 (C2–C3)" },
      { v: 2, label: "2 · 고도 (O1–O3)" },
    ],
  },
  {
    key: "intestinal_metaplasia",
    label: "장상피화생 (IM)",
    max: 2,
    grades: [
      { v: 0, label: "0 · 없음" },
      { v: 1, label: "1 · 전정부" },
      { v: 2, label: "2 · 체부까지 확장" },
    ],
  },
  {
    key: "enlarged_folds",
    label: "비대주름 (H)",
    max: 1,
    grades: [
      { v: 0, label: "0 · 없음" },
      { v: 1, label: "1 · 있음 (체부 대만 주름 폭 확대)" },
    ],
  },
  {
    key: "nodularity",
    label: "결절성 (N)",
    max: 1,
    grades: [
      { v: 0, label: "0 · 없음" },
      { v: 1, label: "1 · 있음 (전정부 결절/닭살양)" },
    ],
  },
  {
    key: "diffuse_redness",
    label: "미만성 발적 (DR)",
    max: 2,
    grades: [
      { v: 0, label: "0 · 없음" },
      { v: 1, label: "1 · 경도 (RAC 유지)" },
      { v: 2, label: "2 · 고도 (RAC 소실)" },
    ],
  },
];

// Modified add-on: map-like redness (post-eradication / IM marker).
export const KYOTO_MODIFIED: KyotoComponentDef = {
  key: "map_like_redness",
  label: "지도상 발적 (modified)",
  max: 1,
  grades: [
    { v: 0, label: "0 · 없음" },
    { v: 1, label: "1 · 있음" },
  ],
};

export const KYOTO_STD_KEYS = KYOTO_COMPONENTS.map((c) => c.key);
export const MAX_KYOTO = KYOTO_COMPONENTS.reduce((a, c) => a + c.max, 0); // 8

export function computeKyoto(k: Record<string, number> | undefined): {
  total: number | null;
  complete: boolean;
  assessed: number;
  hint: string;
} {
  let sum = 0;
  let assessed = 0;
  for (const key of KYOTO_STD_KEYS) {
    const v = k?.[key];
    if (typeof v === "number") {
      sum += v;
      assessed += 1;
    }
  }
  const complete = assessed === KYOTO_STD_KEYS.length;
  const total = complete ? sum : null;
  let hint = "";
  if (total !== null) {
    if (total === 0) hint = "H. pylori 미감염 시사 (정상 점막)";
    else if (total >= 2) hint = "현재 H. pylori 감염 시사 (위험 증가)";
    else hint = "경계 소견";
    if (k?.map_like_redness) hint += " · 지도상 발적: 과거 감염/제균 후 시사";
  }
  return { total, complete, assessed, hint };
}

// Filename parser — matches eggim/scaffold_manifest.py DEFAULT_FILENAME_RE.
// e.g. R000000314_20090220_20090115311983770_ES_1_003
const FILENAME_RE =
  /^([A-Za-z]?\d+)_(\d{8})_(\d+)_([A-Za-z0-9]+)_(\d+)_(\d+)$/;

export interface ParsedName {
  patientId: string;
  examDate: string; // YYYYMMDD
  studyUid: string;
  tag: string;
  series: string;
  imageNo: number;
}

export function parseFilename(name: string): ParsedName | null {
  const stem = name.replace(/\.[^.]+$/, "");
  const m = FILENAME_RE.exec(stem);
  if (!m) return null;
  return {
    patientId: m[1],
    examDate: m[2],
    studyUid: m[3],
    tag: m[4],
    series: m[5],
    imageNo: parseInt(m[6], 10),
  };
}

// Sum the five area grades into an EGGIM total. Returns null if any area is
// missing (incomplete exam must never report a final score).
export function computeEggimTotal(
  areaGrades: Partial<Record<EggimSite, ImGrade>>
): { total: number | null; complete: boolean; assessed: number } {
  let sum = 0;
  let assessed = 0;
  for (const site of EGGIM_SITES) {
    const g = areaGrades[site];
    if (g === 0 || g === 1 || g === 2) {
      sum += g;
      assessed += 1;
    }
  }
  const complete = assessed === EGGIM_SITES.length;
  return { total: complete ? sum : null, complete, assessed };
}

export function isHighRisk(total: number | null): boolean | null {
  return total === null ? null : total >= EGGIM_HIGH_RISK_THRESHOLD;
}
