import { afterEach, describe, expect, it, vi } from "vitest";
import { apiBase, getOptics, postFit } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const jpegB64 = btoa(String.fromCharCode(0xff, 0xd8, 0xff, 0xe0, 0x00));

describe("apiBase", () => {
  it("defaults to same-origin client engine", () => {
    expect(apiBase()).toBe("");
  });
});

describe("postFit", () => {
  it("measures a face without a remote server", async () => {
    const got = await postFit(jpegB64, [
      { index: 133, x: 0.38, y: 0.42 },
      { index: 362, x: 0.62, y: 0.42 },
      { index: 234, x: 0.22, y: 0.52 },
      { index: 454, x: 0.78, y: 0.52 },
      { index: 10, x: 0.5, y: 0.18 },
      { index: 152, x: 0.5, y: 0.88 },
    ]);
    expect(got.head.ipdMm).toBeGreaterThan(0);
    expect(got.matches.length).toBeGreaterThan(0);
  });

  it("throws mapped error", async () => {
    await expect(postFit(jpegB64, [])).rejects.toThrow("no_face");
  });

  it("uses remote API when configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test");
    vi.stubGlobal("fetch", async (url: string) => {
      if (String(url).includes("/v1/fit")) {
        return { ok: false, json: async () => ({ error: "no_face" }) };
      }
      return { ok: false, json: async () => ({ error: "invalid_location" }) };
    });
    await expect(postFit("data", [])).rejects.toThrow("no_face");
    await expect(getOptics(1, 2)).rejects.toThrow("invalid_location");
  });

  it("returns remote payloads", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test");
    vi.stubGlobal("fetch", async (url: string) => {
      if (String(url).includes("/v1/fit")) {
        return { ok: true, json: async () => ({ head: { ipdMm: 62 }, matches: [] }) };
      }
      return { ok: true, json: async () => ({ shops: [{ id: "1", name: "Lens" }] }) };
    });
    expect((await postFit("data", [])).head.ipdMm).toBe(62);
    expect((await getOptics(1, 2))[0]?.name).toBe("Lens");
  });
});

describe("getOptics", () => {
  it("returns shops from the catalog", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      json: async () => [{ id: 1, name: "Lens", lat: 1, lng: 2, address: "A", url: "https://2gis.kz" }],
    }));
    const shops = await getOptics(1, 2);
    expect(shops[0]?.name).toBe("Lens");
    expect(shops[0]?.source).toBe("2gis");
  });

  it("rejects missing location errors", async () => {
    await expect(getOptics(Number.NaN, 2)).rejects.toThrow("invalid_location");
  });
});
