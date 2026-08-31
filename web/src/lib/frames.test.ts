import { describe, expect, it } from "vitest";
import { FRAMES, silhouetteKey } from "./frames";

describe("optical catalog silhouettes", () => {
  it("uses a photoreal GLB mesh, not a cartoon silhouette file", () => {
    const keys = new Set(FRAMES.map((f) => silhouetteKey(f)));
    expect(keys.has("rect")).toBe(true);
    expect(keys.has("oval")).toBe(true);
    expect(keys.has("round")).toBe(true);
    expect(keys.has("cat")).toBe(true);
    expect(FRAMES.every((f) => f.model?.endsWith(".glb"))).toBe(true);
    expect(FRAMES.every((f) => !f.model?.startsWith("rig:"))).toBe(true);
    expect(silhouetteKey({ shape: "cat" })).toBe("cat");
  });

  it("labels sizes as typical stock, not shop inventory", () => {
    expect(FRAMES.every((f) => f.lensWidthMm >= 46 && f.bridgeMm >= 14)).toBe(true);
  });
});
