import type { Point } from "@/lib/landmarks";

const MIN_POINTS = 264;
const MIN_SPAN = 0.08;
const MAX_YAW = 0.12;

export function faceReady(points: Point[]): boolean {
  if (points.length < MIN_POINTS) {
    return false;
  }
  const left = points[33];
  const right = points[263];
  if (!left || !right) {
    return false;
  }
  const span = Math.hypot(right.x - left.x, right.y - left.y);
  if (span < MIN_SPAN) {
    return false;
  }
  return Math.abs((left.z ?? 0) - (right.z ?? 0)) <= MAX_YAW;
}

export function measureLocked(ready: boolean, status: string): boolean {
  return !ready || status === "busy" || status === "boot" || status === "error";
}

export function nextLiveStatus(prev: "boot" | "live" | "busy" | "done" | "error"): "live" | "busy" | "done" {
  if (prev === "busy") {
    return "busy";
  }
  if (prev === "done") {
    return "done";
  }
  return "live";
}

export function captureCoach(points: Point[]): string {
  if (points.length < MIN_POINTS) {
    return "Смотрите в камеру: лицо целиком в кадре, свет спереди";
  }
  if (!faceReady(points)) {
    return "Держите голову прямо, свет спереди";
  }
  return "Анфас есть. Можно снять мерки";
}

export function studioNote(status: string, points: Point[], fallback: string): string {
  if (status === "live" || status === "done") {
    return captureCoach(points);
  }
  return fallback;
}
