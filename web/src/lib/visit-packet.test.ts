import { describe, expect, it } from "vitest";
import { KZ_CITIES, faceShapeLabel, headPacket, sizeCode, visitPacket, whatsappHref } from "./visit-packet";

const head = {
  ipdMm: 63,
  faceWidthMm: 138,
  faceHeightMm: 170,
  shapeHint: "oval",
  sizeHint: "md",
};

const frame = {
  sku: "FR-RECT-50",
  name: "Atelier Rect",
  brand: "FRAME",
  shape: "rect",
  lensWidthMm: 50,
  bridgeMm: 22,
  templeMm: 150,
};

describe("visit packet", () => {
  it("names typical size and says it is not a prescription", () => {
    expect(sizeCode(frame)).toBe("50-22-150");
    const text = visitPacket(head, frame, "овальное");
    expect(text).toContain("63 мм");
    expect(text).toContain("50-22-150");
    expect(text).toMatch(/не рецепт/i);
    expect(text).toMatch(/наличи/i);
    expect(headPacket(head, frame)).toContain("50-22-150");
    expect(headPacket(null, frame)).toBe("");
    expect(headPacket(head, { sku: "X", lensWidthMm: 50, bridgeMm: 22, templeMm: 150 })).toContain("X");
    expect(visitPacket(head, frame, "овальное"));
  });

  it("builds a WhatsApp link from digits only", () => {
    const href = whatsappHref("+7 (717) 000-11-22", "hello");
    expect(href).toBe("https://wa.me/77170001122?text=hello");
  });

  it("lists major cities without inventing shops", () => {
    expect(KZ_CITIES.some((c) => c.id === "almaty")).toBe(true);
    expect(KZ_CITIES.every((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng))).toBe(true);
    expect(faceShapeLabel("hex")).toBe("hex");
    expect(faceShapeLabel("oval")).toBe("овальное");
  });
});
