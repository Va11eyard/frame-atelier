export type Landmark = { index: number; x: number; y: number; z?: number };

export type Head = {
  ipdMm: number;
  faceWidthMm: number;
  faceHeightMm: number;
  shapeHint: string;
  sizeHint: string;
};

export type Frame = {
  sku: string;
  name: string;
  brand: string;
  shape: string;
  material: string;
  color: string;
  lensWidthMm: number;
  bridgeMm: number;
  templeMm: number;
  model?: string;
  colors?: string[];
};

export type Match = {
  frame: Frame;
  score: number;
  breakdown: { shape: number; size: number; geometry: number; material: number };
};

const idxLeftInner = 133;
const idxRightInner = 362;
const idxLeftCheek = 234;
const idxRightCheek = 454;
const idxChin = 152;
const idxForehead = 10;
const idxLeftIris = 468;
const idxLeftIrisRim = 469;
const idxForeheadL = 54;
const idxForeheadR = 284;
const idxJawL = 172;
const idxJawR = 397;
const meanAdultIPDMm = 63.0;
const irisDiameterMm = 11.7;

export const MaxImageBytes = 8 << 20;

const bestFrames: Record<string, string[]> = {
  round: ["rect", "square", "cat"],
  square: ["round", "oval", "cat"],
  oval: ["rect", "cat", "square", "round", "oval"],
  heart: ["oval", "round", "cat"],
  diamond: ["oval", "cat", "round"],
  oblong: ["round", "oval", "cat"],
};

function byIndex(points: Landmark[]): Map<number, Landmark> {
  const out = new Map<number, Landmark>();
  for (const p of points) {
    out.set(p.index, p);
  }
  return out;
}

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function shapeFromRatio(w: number, h: number): string {
  if (h <= 0) {
    return "oval";
  }
  const r = w / h;
  if (r >= 0.95) {
    return "round";
  }
  if (r <= 0.72) {
    return "rect";
  }
  return "oval";
}

export function sizeFromWidth(faceMm: number): string {
  if (faceMm < 125) {
    return "sm";
  }
  if (faceMm > 145) {
    return "lg";
  }
  return "md";
}

function span(idx: Map<number, Landmark>, a: number, b: number): [number, boolean] {
  const la = idx.get(a);
  const lb = idx.get(b);
  if (!la || !lb) {
    return [0, false];
  }
  return [dist(la, lb), true];
}

export function fromProportions(foreCheek: number, jawCheek: number, widthMm: number, heightMm: number): string {
  const wh = heightMm > 0 ? widthMm / heightMm : 0;
  if (foreCheek > 1.12 && jawCheek < 0.86) {
    return "heart";
  }
  if (foreCheek < 0.9 && jawCheek < 0.86) {
    return "diamond";
  }
  if (wh >= 0.95 && jawCheek >= 0.9) {
    return foreCheek >= 0.92 ? "square" : "round";
  }
  if (wh <= 0.72) {
    return "oblong";
  }
  return "oval";
}

export function classifyFace(idx: Map<number, Landmark>, widthMm: number, heightMm: number): string {
  const fallback = shapeFromRatio(widthMm, heightMm);
  const [fore, okF] = span(idx, idxForeheadL, idxForeheadR);
  const [jaw, okJ] = span(idx, idxJawL, idxJawR);
  const [cheek, okC] = span(idx, idxLeftCheek, idxRightCheek);
  if (!okF || !okJ || !okC || cheek <= 0) {
    return fallback;
  }
  return fromProportions(fore / cheek, jaw / cheek, widthMm, heightMm);
}

export function pairShapeScore(face: string, frame: string): number {
  let kind = face;
  if (kind === "rect") {
    kind = "oblong";
  }
  const ranked = bestFrames[kind] ?? [];
  for (let i = 0; i < ranked.length; i++) {
    if (ranked[i] === frame) {
      return i === 0 ? 96 : 84;
    }
  }
  if (kind === "oval") {
    return 78;
  }
  return 46;
}

function scaleMm(idx: Map<number, Landmark>, ipdN: number): number {
  const mmPer = meanAdultIPDMm / ipdN;
  const center = idx.get(idxLeftIris);
  const rim = idx.get(idxLeftIrisRim);
  if (center && rim) {
    const diameter = dist(center, rim) * 2;
    if (diameter > 0.002) {
      const candidate = irisDiameterMm / diameter;
      const est = ipdN * candidate;
      if (est >= 48 && est <= 78) {
        return candidate;
      }
    }
  }
  return mmPer;
}

function faceWidthNorm(idx: Map<number, Landmark>, ipdN: number): number {
  const lc = idx.get(idxLeftCheek);
  const rc = idx.get(idxRightCheek);
  if (lc && rc) {
    return dist(lc, rc);
  }
  return ipdN * 2.2;
}

function faceHeightNorm(idx: Map<number, Landmark>, ipdN: number): number {
  const fh = idx.get(idxForehead);
  const ch = idx.get(idxChin);
  if (fh && ch) {
    return dist(fh, ch);
  }
  return ipdN * 2.8;
}

export function measure(points: Landmark[]): Head {
  if (points.length === 0) {
    throw new Error("no_face");
  }
  const idx = byIndex(points);
  const left = idx.get(idxLeftInner);
  const right = idx.get(idxRightInner);
  if (!left || !right) {
    throw new Error("no_face");
  }
  const ipdN = dist(left, right);
  if (ipdN < 0.02) {
    throw new Error("no_face");
  }
  const mmPer = scaleMm(idx, ipdN);
  const faceW = faceWidthNorm(idx, ipdN);
  const faceH = faceHeightNorm(idx, ipdN);
  const head: Head = {
    ipdMm: round1(ipdN * mmPer),
    faceWidthMm: round1(faceW * mmPer),
    faceHeightMm: round1(faceH * mmPer),
    shapeHint: "",
    sizeHint: "",
  };
  head.shapeHint = classifyFace(idx, head.faceWidthMm, head.faceHeightMm);
  head.sizeHint = sizeFromWidth(head.faceWidthMm);
  return head;
}

export function targetLens(head: Head): number {
  const base = head.faceWidthMm * 0.38;
  if (head.sizeHint === "sm") {
    return Math.min(base, 50);
  }
  if (head.sizeHint === "lg") {
    return Math.max(base, 56);
  }
  return base;
}

export function scoreFrame(head: Head, frame: Frame): Match {
  const want = targetLens(head);
  const size = clamp(100 - Math.abs(frame.lensWidthMm - want) * 6, 0, 100);
  const geo = clamp(100 - Math.abs(frame.bridgeMm - 18) * 4, 0, 100);
  const shape = pairShapeScore(head.shapeHint, frame.shape);
  const mat = 82;
  const score = round1(shape * 0.34 + size * 0.4 + geo * 0.26);
  return {
    frame,
    score,
    breakdown: { shape: round1(shape), size: round1(size), geometry: round1(geo), material: mat },
  };
}

export function rank(head: Head, frames: Frame[]): Match[] {
  return frames.map((f) => scoreFrame(head, f)).sort((a, b) => b.score - a.score);
}

export function validateImage(data: Uint8Array): void {
  if (data.length === 0) {
    throw new Error("invalid_image");
  }
  if (data.length > MaxImageBytes) {
    throw new Error("image_too_large");
  }
  const jpeg = data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  const png =
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a;
  if (!jpeg && !png) {
    throw new Error("invalid_image");
  }
}

export function decodeImage(b64: string): Uint8Array {
  const s = b64.trim();
  const i = s.indexOf(",");
  const payload = i >= 0 && s.slice(0, i).includes("base64") ? s.slice(i + 1) : s;
  if (!payload) {
    throw new Error("invalid_image");
  }
  const bin = atob(payload);
  const out = new Uint8Array(bin.length);
  for (let j = 0; j < bin.length; j++) {
    out[j] = bin.charCodeAt(j);
  }
  return out;
}

export function indexMap(points: Landmark[]): Map<number, Landmark> {
  return byIndex(points);
}
