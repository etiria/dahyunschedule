// Inter-rater agreement (Cohen's / quadratic-weighted kappa), pure functions.
// Used by the PI-only agreement view to gauge how consistently experts label.

export function kappa(
  pairs: Array<[number, number]>,
  nCat: number,
  quadratic: boolean
): number | null {
  const N = pairs.length;
  if (N === 0) return null;
  const O: number[][] = Array.from({ length: nCat }, () => Array(nCat).fill(0));
  for (const [a, b] of pairs) {
    if (a < 0 || a >= nCat || b < 0 || b >= nCat) continue;
    O[a][b] += 1;
  }
  const row = O.map((r) => r.reduce((x, y) => x + y, 0));
  const col = Array.from({ length: nCat }, (_, j) =>
    O.reduce((s, r) => s + r[j], 0)
  );
  let num = 0;
  let den = 0;
  for (let i = 0; i < nCat; i++) {
    for (let j = 0; j < nCat; j++) {
      const w = quadratic ? (i - j) ** 2 / (nCat - 1) ** 2 : i === j ? 0 : 1;
      const e = (row[i] * col[j]) / N;
      num += w * O[i][j];
      den += w * e;
    }
  }
  return den === 0 ? 1 : 1 - num / den;
}

export interface PairAgreement {
  a: string;
  b: string;
  n: number;
  kappa: number | null;
}
export interface MetricAgreement {
  metric: string;
  nCat: number;
  quadratic: boolean;
  avgKappa: number | null;
  totalOverlap: number;
  pairs: PairAgreement[];
}

// values: expert -> (examId -> categorical/ordinal value). Computes kappa for
// every expert pair over their commonly-labeled exams, plus the mean.
export function pairwise(
  values: Record<string, Record<string, number>>,
  nCat: number,
  quadratic: boolean,
  metric: string
): MetricAgreement {
  const experts = Object.keys(values);
  const pairs: PairAgreement[] = [];
  const ks: number[] = [];
  let totalOverlap = 0;
  for (let i = 0; i < experts.length; i++) {
    for (let j = i + 1; j < experts.length; j++) {
      const A = values[experts[i]];
      const B = values[experts[j]];
      const common: Array<[number, number]> = [];
      for (const exam in A) if (exam in B) common.push([A[exam], B[exam]]);
      const k = common.length ? kappa(common, nCat, quadratic) : null;
      pairs.push({ a: experts[i], b: experts[j], n: common.length, kappa: k });
      totalOverlap += common.length;
      if (k !== null) ks.push(k);
    }
  }
  const avgKappa = ks.length ? ks.reduce((a, b) => a + b, 0) / ks.length : null;
  return { metric, nCat, quadratic, avgKappa, totalOverlap, pairs };
}

// Landis-Koch interpretation of a kappa value.
export function kappaLabel(k: number | null): string {
  if (k === null) return "—";
  if (k < 0) return "poor";
  if (k < 0.2) return "slight";
  if (k < 0.4) return "fair";
  if (k < 0.6) return "moderate";
  if (k < 0.8) return "substantial";
  return "almost perfect";
}
