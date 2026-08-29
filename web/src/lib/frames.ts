import type { Frame } from "@/lib/fit-engine";

const khronos = "/models/sunglasses-khronos.glb";
const atelierColors = ["black", "gold", "tortoise", "burgundy", "silver", "horn"];

export const FRAMES: Frame[] = [
  { sku: "FR-RECT-50", name: "Atelier Rect", brand: "FRAME", shape: "rect", material: "acetate", color: "black", lensWidthMm: 50, bridgeMm: 22, templeMm: 150, model: khronos, colors: atelierColors },
  { sku: "FR-OVAL-58", name: "Atelier Oval", brand: "FRAME", shape: "oval", material: "metal", color: "gold", lensWidthMm: 58, bridgeMm: 14, templeMm: 135, model: khronos, colors: atelierColors },
  { sku: "FR-RECT-54", name: "Atelier Link", brand: "FRAME", shape: "rect", material: "combo", color: "grey", lensWidthMm: 54, bridgeMm: 17, templeMm: 138, model: khronos, colors: atelierColors },
  { sku: "FR-OVAL-54", name: "Atelier Tortoise", brand: "FRAME", shape: "oval", material: "acetate", color: "tortoise", lensWidthMm: 54, bridgeMm: 20, templeMm: 145, model: khronos, colors: atelierColors },
  { sku: "FR-ROUND-47", name: "Atelier Round", brand: "FRAME", shape: "round", material: "acetate", color: "horn", lensWidthMm: 47, bridgeMm: 22, templeMm: 145, model: khronos, colors: atelierColors },
  { sku: "FR-ROUND-46", name: "Atelier Circle", brand: "FRAME", shape: "round", material: "acetate", color: "black", lensWidthMm: 46, bridgeMm: 24, templeMm: 145, model: khronos, colors: atelierColors },
  { sku: "FR-RECT-51", name: "Atelier Wire", brand: "FRAME", shape: "rect", material: "metal", color: "silver", lensWidthMm: 51, bridgeMm: 17, templeMm: 135, model: khronos, colors: atelierColors },
  { sku: "FR-CAT-52", name: "Atelier Cat", brand: "FRAME", shape: "cat", material: "acetate", color: "burgundy", lensWidthMm: 52, bridgeMm: 17, templeMm: 140, model: khronos, colors: atelierColors },
];
