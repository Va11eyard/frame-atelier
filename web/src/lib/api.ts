import { FRAMES } from "@/lib/frames";
import { decodeImage, measure, rank, validateImage, type Head, type Landmark, type Match } from "@/lib/fit-engine";
import { nearbyOptics, type Shop } from "@/lib/optics-local";

export type { Head, Match, Shop };

export function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

function asLandmarks(landmarks: unknown): Landmark[] {
  if (!Array.isArray(landmarks)) {
    return [];
  }
  return landmarks.map((row) => {
    const p = row as { index?: number; x?: number; y?: number; z?: number };
    return { index: p.index ?? 0, x: p.x ?? 0, y: p.y ?? 0, z: p.z ?? 0 };
  });
}

async function remoteFit(imageBase64: string, landmarks: unknown): Promise<{ head: Head; matches: Match[] }> {
  const res = await fetch(`${apiBase()}/v1/fit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, landmarks }),
  });
  const body = (await res.json()) as { error?: string; head: Head; matches: Match[] };
  if (!res.ok) {
    throw new Error(body.error ?? "fit_failed");
  }
  return body;
}

export async function postFit(imageBase64: string, landmarks: unknown): Promise<{ head: Head; matches: Match[] }> {
  if (apiBase()) {
    return remoteFit(imageBase64, landmarks);
  }
  const img = decodeImage(imageBase64);
  validateImage(img);
  const head = measure(asLandmarks(landmarks));
  return { head, matches: rank(head, FRAMES) };
}

export async function getOptics(lat: number, lng: number): Promise<Shop[]> {
  if (apiBase()) {
    const res = await fetch(`${apiBase()}/v1/optics?lat=${lat}&lng=${lng}`);
    const body = (await res.json()) as { error?: string; shops: Shop[] };
    if (!res.ok) {
      throw new Error(body.error ?? "optics_failed");
    }
    return body.shops ?? [];
  }
  return nearbyOptics(lat, lng);
}
