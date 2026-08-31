import type { Head } from "@/lib/fit-engine";

export type City = { id: string; name: string; lat: number; lng: number };

export const KZ_CITIES: City[] = [
  { id: "astana", name: "Астана", lat: 51.1605, lng: 71.4704 },
  { id: "almaty", name: "Алматы", lat: 43.2389, lng: 76.8897 },
  { id: "shymkent", name: "Шымкент", lat: 42.3419, lng: 69.5901 },
  { id: "karaganda", name: "Караганда", lat: 49.8047, lng: 73.1094 },
  { id: "aktobe", name: "Актобе", lat: 50.2839, lng: 57.167 },
  { id: "aktau", name: "Актау", lat: 43.6481, lng: 51.1722 },
  { id: "pavlodar", name: "Павлодар", lat: 52.2873, lng: 76.9674 },
  { id: "semey", name: "Семей", lat: 50.4111, lng: 80.2275 },
  { id: "oral", name: "Уральск", lat: 51.2306, lng: 51.3866 },
  { id: "kostanay", name: "Костанай", lat: 53.2144, lng: 63.6315 },
];

type Sized = { lensWidthMm: number; bridgeMm: number; templeMm: number };

type PacketFrame = Sized & { brand: string; name: string };

export function sizeCode(frame: Sized): string {
  return `${Math.round(frame.lensWidthMm)}-${Math.round(frame.bridgeMm)}-${Math.round(frame.templeMm)}`;
}

export function visitPacket(head: Head, frame: PacketFrame, shapeLabel: string): string {
  const size = sizeCode(frame);
  return [
    "FRAME — оценка посадки по камере (не рецепт и не замена офтальмолога).",
    `IPD: ${head.ipdMm} мм`,
    `Ширина лица: ${head.faceWidthMm} мм`,
    `Форма: ${shapeLabel}`,
    `Типоразмер: ${size} (уточните наличие в салоне)`,
    `Силуэт: ${frame.brand} ${frame.name}`,
  ].join("\n");
}

export function whatsappHref(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const SHAPE_LABELS: Record<string, string> = {
  round: "круглое",
  square: "квадратное",
  oval: "овальное",
  heart: "сердцевидное",
  diamond: "ромбовидное",
  oblong: "вытянутое",
  rect: "вытянутое",
};

export function faceShapeLabel(hint: string): string {
  return SHAPE_LABELS[hint] ?? hint;
}

export function headPacket(
  head: Head | null,
  frame: PacketFrame & { sku?: string; brand?: string; name?: string },
): string {
  if (!head) {
    return "";
  }
  return visitPacket(
    head,
    {
      brand: frame.brand ?? "FRAME",
      name: frame.name ?? frame.sku ?? "",
      lensWidthMm: frame.lensWidthMm,
      bridgeMm: frame.bridgeMm,
      templeMm: frame.templeMm,
    },
    faceShapeLabel(head.shapeHint),
  );
}
