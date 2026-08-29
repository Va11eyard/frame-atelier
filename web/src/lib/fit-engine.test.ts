import { describe, expect, it } from "vitest";
import {
  classifyFace,
  decodeImage,
  fromProportions,
  indexMap,
  measure,
  pairShapeScore,
  scoreFrame,
  shapeFromRatio,
  sizeFromWidth,
  targetLens,
  validateImage,
  type Landmark,
} from "./fit-engine";

function faceLandmarks(): Landmark[] {
  return [
    { index: 133, x: 0.38, y: 0.42 },
    { index: 362, x: 0.62, y: 0.42 },
    { index: 234, x: 0.22, y: 0.52 },
    { index: 454, x: 0.78, y: 0.52 },
    { index: 10, x: 0.5, y: 0.18 },
    { index: 152, x: 0.5, y: 0.88 },
    { index: 468, x: 0.36, y: 0.42 },
    { index: 469, x: 0.382, y: 0.42 },
  ];
}

describe("measure", () => {
  it("rejects empty landmarks", () => {
    expect(() => measure([])).toThrow("no_face");
  });

  it("returns head parameters", () => {
    const h = measure(faceLandmarks());
    expect(h.ipdMm).toBeGreaterThan(0);
    expect(h.shapeHint).toBeTruthy();
    expect(h.sizeHint).toBeTruthy();
  });

  it("uses mean scale without iris", () => {
    expect(measure([{ index: 133, x: 0.4, y: 0.4 }, { index: 362, x: 0.63, y: 0.4 }]).ipdMm).toBe(63);
  });

  it("falls back width without cheeks", () => {
    const h = measure([{ index: 133, x: 0.4, y: 0.4 }, { index: 362, x: 0.6, y: 0.4 }]);
    expect(h.faceWidthMm).toBe(138.6);
    expect(h.faceHeightMm).toBe(176.4);
  });
});

describe("shape pairing", () => {
  it("matches go boundaries", () => {
    expect(shapeFromRatio(140, 140)).toBe("round");
    expect(shapeFromRatio(100, 160)).toBe("rect");
    expect(sizeFromWidth(110)).toBe("sm");
    expect(pairShapeScore("round", "rect")).toBe(96);
    expect(fromProportions(0.95, 0.95, 140, 140)).toBe("square");
  });

  it("classifies heart", () => {
    const idx = indexMap([
      { index: 54, x: 0.18, y: 0.28 },
      { index: 284, x: 0.82, y: 0.28 },
      { index: 234, x: 0.28, y: 0.48 },
      { index: 454, x: 0.72, y: 0.48 },
      { index: 172, x: 0.38, y: 0.78 },
      { index: 397, x: 0.62, y: 0.78 },
    ]);
    expect(classifyFace(idx, 130, 150)).toBe("heart");
  });

  it("scores contrast frames", () => {
    const head = { ipdMm: 63, faceWidthMm: 130, faceHeightMm: 140, shapeHint: "round", sizeHint: "md" };
    const m = scoreFrame(head, { sku: "A", name: "A", brand: "F", shape: "rect", material: "acetate", color: "black", lensWidthMm: targetLens(head), bridgeMm: 18, templeMm: 140 });
    expect(m.breakdown.shape).toBe(96);
    expect(m.score).toBe(98.6);
  });
});

describe("image", () => {
  it("accepts jpeg data urls and png", () => {
    const jpeg = decodeImage(`data:image/jpeg;base64,${btoa(String.fromCharCode(0xff, 0xd8, 0xff, 0xe0, 0x00))}`);
    expect(() => validateImage(jpeg)).not.toThrow();
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(() => validateImage(png)).not.toThrow();
  });

  it("rejects empty and garbage", () => {
    expect(() => decodeImage("")).toThrow("invalid_image");
    expect(() => validateImage(new Uint8Array())).toThrow("invalid_image");
    expect(() => validateImage(Uint8Array.from([1, 2, 3]))).toThrow("invalid_image");
  });
});
