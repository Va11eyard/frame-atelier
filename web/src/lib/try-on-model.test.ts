import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { applyFrameTint, fitModelToFront, frontAxisWidth, instantiateGlasses, isLensMaterial, scaleForFront, tintHex, wrapForPose } from "./try-on-model";

describe("real glasses model helpers", () => {
  it("scales a meter-sized mesh to catalog millimetres", () => {
    expect(scaleForFront(0.145, 50, 22)).toBeCloseTo(122 / 0.145);
    expect(scaleForFront(0, 50, 22)).toBe(1);
    expect(frontAxisWidth(0.145, 0.4)).toBe(0.145);
  });

  it("never tints transmissive lenses", () => {
    expect(isLensMaterial("Frame", 0.9, 1)).toBe(false);
    expect(isLensMaterial("Lenses_iridescent", 0, 1)).toBe(true);
    expect(isLensMaterial("glass_mesh", 0.9, 1)).toBe(true);
    expect(isLensMaterial("Temple", 0, 1)).toBe(false);
  });

  it("maps atelier tints", () => {
    expect(tintHex("burgundy")).toBe(0x6b1c28);
    expect(tintHex("unknown")).toBe(0x161310);
  });

  it("tints the frame and leaves transmissive lenses", () => {
    const group = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhysicalMaterial({ color: 0xffffff }));
    rim.name = "Temple";
    const lens = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1 }),
    );
    lens.name = "Lens";
    group.add(rim, lens);
    applyFrameTint(group, "burgundy");
    expect((rim.material as THREE.MeshPhysicalMaterial).color.getHex()).toBe(0x6b1c28);
    expect((lens.material as THREE.MeshPhysicalMaterial).color.getHex()).not.toBe(0x6b1c28);
    expect((lens.material as THREE.MeshPhysicalMaterial).transmission).toBe(0);
    expect((lens.material as THREE.MeshPhysicalMaterial).opacity).toBeLessThan(0.5);
  });

  it("fits a mesh width to catalog front", () => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(10, 1, 80), new THREE.MeshBasicMaterial()));
    fitModelToFront(group, 50, 22);
    const size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(122, 0);
  });

  it("keeps millimetre fit on an inner node so pose scale is in pixels", () => {
    const inner = new THREE.Group();
    inner.add(new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.04, 0.04), new THREE.MeshBasicMaterial()));
    fitModelToFront(inner, 50, 22);
    const root = wrapForPose(inner, false);
    root.scale.setScalar(2);
    root.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(244, 0);
  });

  it("falls back to a parametric rig when the GLB is missing", async () => {
    const group = await instantiateGlasses({
      shape: "rect",
      color: "black",
      material: "acetate",
      lensWidthMm: 50,
      bridgeMm: 20,
      templeMm: 145,
      model: "/models/missing.glb",
    });
    expect(group.children.length).toBe(1);
    expect(group.children[0].children.length).toBeGreaterThan(4);
  });

  it("uses a shape rig when the catalog points at rig:shape", async () => {
    const group = await instantiateGlasses({
      shape: "cat",
      color: "burgundy",
      material: "acetate",
      lensWidthMm: 52,
      bridgeMm: 17,
      templeMm: 140,
      model: "rig:cat",
    });
    expect(group.children[0].children.length).toBeGreaterThan(4);
  });
});
