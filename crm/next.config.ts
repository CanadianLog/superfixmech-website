import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in a sub-folder of the website repo; keep Next from treating the repo root as the workspace.
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
