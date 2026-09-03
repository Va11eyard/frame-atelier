import type { Frame } from "@/lib/fit-engine";

export const JEELIZ_OPTICAL = "jeeliz:optical";
const atelierColors = ["black", "gold", "tortoise", "burgundy", "silver", "horn"];

function optical(
  sku: string,
  name: string,
  shape: string,
  material: string,
  color: string,
  lensWidthMm: number,
  bridgeMm: number,
  templeMm: number,
): Frame {
  return {
    sku,
    name,
    brand: "FRAME",
    shape,
    material,
    color,
    lensWidthMm,
    bridgeMm,
    templeMm,
    model: JEELIZ_OPTICAL,
    colors: atelierColors,
  };
}

export const FRAMES: Frame[] = [
  optical("FR-RECT-50", "Прямоугольник 50", "rect", "acetate", "black", 50, 22, 150),
  optical("FR-OVAL-58", "Овал 58", "oval", "metal", "gold", 58, 14, 135),
  optical("FR-RECT-54", "Прямоугольник 54", "rect", "combo", "grey", 54, 17, 138),
  optical("FR-OVAL-54", "Панто 54", "oval", "acetate", "tortoise", 54, 20, 145),
  optical("FR-ROUND-47", "Круг 47", "round", "acetate", "horn", 47, 22, 145),
  optical("FR-ROUND-46", "Панто-круг 46", "round", "acetate", "black", 46, 24, 145),
  optical("FR-RECT-51", "Тонкий прямоугольник 51", "rect", "metal", "silver", 51, 17, 135),
  optical("FR-CAT-52", "Кошка 52", "cat", "acetate", "burgundy", 52, 17, 140),
];

export function silhouetteKey(frame: { shape: string; model?: string }): string {
  return frame.shape;
}
