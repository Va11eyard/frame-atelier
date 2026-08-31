import { describe, expect, it } from "vitest";
import { captureCoach, faceReady, measureLocked, nextLiveStatus, studioNote } from "./capture-readiness";
import type { Point } from "./landmarks";

function mesh(overrides?: { span?: number; yaw?: number }): Point[] {
  const pts: Point[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  const span = overrides?.span ?? 0.22;
  const yaw = overrides?.yaw ?? 0;
  pts[33] = { x: 0.4, y: 0.45, z: 0 };
  pts[263] = { x: 0.4 + span, y: 0.45, z: yaw };
  return pts;
}

describe("capture gate", () => {
  it("rejects an empty or tiny face", () => {
    expect(faceReady([])).toBe(false);
    expect(faceReady(mesh({ span: 0.03 }))).toBe(false);
    expect(captureCoach([])).toMatch(/кадр/i);
  });

  it("rejects a turned head", () => {
    expect(faceReady(mesh({ yaw: 0.2 }))).toBe(false);
    expect(captureCoach(mesh({ yaw: 0.2 }))).toMatch(/прямо/i);
  });

  it("allows a frontal face", () => {
    expect(faceReady(mesh())).toBe(true);
    expect(captureCoach(mesh())).toMatch(/мерки/i);
    expect(studioNote("boot", [], "wait")).toBe("wait");
    expect(studioNote("live", mesh(), "wait")).toMatch(/мерки/i);
    expect(studioNote("done", mesh(), "wait")).toMatch(/мерки/i);
  });

  it("locks capture until a live frontal face is ready", () => {
    expect(measureLocked(false, "live")).toBe(true);
    expect(measureLocked(true, "boot")).toBe(true);
    expect(measureLocked(true, "live")).toBe(false);
  });

  it("does not drop a finished fit while the camera still runs", () => {
    expect(nextLiveStatus("done")).toBe("done");
    expect(nextLiveStatus("busy")).toBe("busy");
    expect(nextLiveStatus("boot")).toBe("live");
  });
});
