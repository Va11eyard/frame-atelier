import type { NextConfig } from "next";

const pages = process.env.GITHUB_PAGES === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: pages ? "export" : "standalone",
  basePath: basePath || undefined,
  images: { unoptimized: true },
  poweredByHeader: false,
  transpilePackages: ["three"],
};

export default nextConfig;
