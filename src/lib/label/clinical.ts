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
export type SiteClass = EggimSite | typeof NON_TARGET_SITE;
export const SITE_CLASSES: SiteClass[] = [...EGGIM_SITES, NON_TARGET_SITE];

export const SITE_LABELS_KO: Record<SiteClass, string> = {
  antrum_lesser: "전정부 소만",
  antrum_greater: "전정부 대만",
  incisura: "각부",
  corpus_lesser: "체부 소만",
  corpus_greater: "체부 대만",
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
