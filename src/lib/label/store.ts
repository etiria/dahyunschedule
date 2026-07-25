// Server-side data access for the labeling app (Node runtime only).
//
// Layout on the deployment VM (configurable via LABEL_DATA_DIR, default ./label-data):
//   <DATA_DIR>/images/<patient>/<file>.jpg   the resized 250-patient set
//   <DATA_DIR>/labels/<expertId>.json        one file per expert (written by app)
//
// Exams are derived by scanning the images folder and parsing filenames, so
// there is no path-mismatch between the machine that resized and the VM.

import fs from "fs";
import path from "path";
import { EggimSite, ImGrade, KimuraClass, parseFilename } from "./clinical";

export const DATA_DIR = process.env.LABEL_DATA_DIR || path.join(process.cwd(), "label-data");
export const IMAGES_DIR = path.join(DATA_DIR, "images");
export const LABELS_DIR = path.join(DATA_DIR, "labels");

export interface ExamImage {
  imageId: string; // relative path under IMAGES_DIR, e.g. "R00.../file.jpg"
  imageNo: number | null;
}
export interface Exam {
  examId: string; // patientId_examDate
  patientId: string;
  examDate: string;
  images: ExamImage[];
}

// ---- exam index (built once, cached in-process) ----
let _examCache: Exam[] | null = null;

function walkImages(dir: string, base: string, out: string[]) {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    // skip hidden / macOS junk (.DS_Store, ._AppleDouble, __MACOSX from zips)
    if (e.name.startsWith(".") || e.name === "__MACOSX") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkImages(full, base, out);
    } else if (/\.(jpe?g|png|bmp|tiff?)$/i.test(e.name)) {
      out.push(path.relative(base, full));
    }
  }
}

export function getExams(): Exam[] {
  if (_examCache) return _examCache;
  const rels: string[] = [];
  walkImages(IMAGES_DIR, IMAGES_DIR, rels);
  const byExam = new Map<string, Exam>();
  for (const rel of rels) {
    const name = path.basename(rel);
    const meta = parseFilename(name);
    const folder = rel.split(path.sep)[0];
    const patientId = meta?.patientId || folder || "unknown";
    const examDate = meta?.examDate || "";
    const examId = examDate ? `${patientId}_${examDate}` : patientId;
    if (!byExam.has(examId)) {
      byExam.set(examId, { examId, patientId, examDate, images: [] });
    }
    byExam.get(examId)!.images.push({
      imageId: rel.split(path.sep).join("/"),
      imageNo: meta ? meta.imageNo : null,
    });
  }
  const exams = Array.from(byExam.values());
  for (const ex of exams) {
    ex.images.sort((a, b) => {
      const an = a.imageNo ?? 1e9;
      const bn = b.imageNo ?? 1e9;
      return an - bn || a.imageId.localeCompare(b.imageId);
    });
  }
  exams.sort((a, b) => a.examId.localeCompare(b.examId));
  _examCache = exams;
  return exams;
}

export function getExam(examId: string): Exam | undefined {
  return getExams().find((e) => e.examId === examId);
}

// ---- safe image path resolution (prevents traversal outside IMAGES_DIR) ----
export function resolveImagePath(rel: string): string | null {
  const full = path.resolve(IMAGES_DIR, rel);
  const root = path.resolve(IMAGES_DIR);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
  return full;
}

// ---- labels ----
export interface ImageLabel {
  site?: string; // SiteClass
  quality_ok?: 0 | 1;
  representative?: boolean;
}
export interface ExamLabel {
  examId: string;
  images: Record<string, ImageLabel>; // keyed by imageId
  kimura?: KimuraClass;
  eggim?: Partial<Record<EggimSite, ImGrade>>;
  kyoto?: Record<string, number>; // Kyoto components incl. map_like_redness
  done?: boolean;
  updatedAt?: string;
}
export type ExpertLabels = Record<string, ExamLabel>; // keyed by examId

function sanitizeExpert(id: string): string {
  return id.replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 64) || "anon";
}

function labelFile(expertId: string): string {
  return path.join(LABELS_DIR, `${sanitizeExpert(expertId)}.json`);
}

export function readExpertLabels(expertId: string): ExpertLabels {
  try {
    return JSON.parse(fs.readFileSync(labelFile(expertId), "utf-8"));
  } catch {
    return {};
  }
}

export function writeExamLabel(expertId: string, label: ExamLabel): ExamLabel {
  fs.mkdirSync(LABELS_DIR, { recursive: true });
  const all = readExpertLabels(expertId);
  label.updatedAt = new Date().toISOString();
  all[label.examId] = label;
  // atomic-ish write
  const file = labelFile(expertId);
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(all, null, 2));
  fs.renameSync(tmp, file);
  return label;
}

export function listExperts(): string[] {
  try {
    return fs
      .readdirSync(LABELS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}
