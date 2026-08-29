import { publicAsset } from "@/lib/public-asset";

export type Shop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  hours?: string;
  phone?: string;
  rating?: number;
  mapUrl?: string;
  km?: number;
  source: string;
};

type CatalogRow = {
  id: number | string;
  name: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  rating?: number | null;
  url?: string;
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function parseLocation(lat: number, lng: number): void {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error("invalid_location");
  }
}

export function rankShops(rows: CatalogRow[], lat: number, lng: number): Shop[] {
  const ranked: Shop[] = rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    address: row.address,
    phone: row.phone,
    rating: row.rating ?? undefined,
    mapUrl: row.url,
    km: Math.round(haversineKm(lat, lng, row.lat, row.lng) * 10) / 10,
    source: "2gis",
  }));
  ranked.sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  return ranked.slice(0, 24);
}

let cached: CatalogRow[] | null = null;

export async function nearbyOptics(lat: number, lng: number): Promise<Shop[]> {
  parseLocation(lat, lng);
  if (!cached) {
    const res = await fetch(publicAsset("/data/odos_optics.json"));
    if (!res.ok) {
      throw new Error("map_unavailable");
    }
    cached = (await res.json()) as CatalogRow[];
  }
  return rankShops(cached, lat, lng);
}
