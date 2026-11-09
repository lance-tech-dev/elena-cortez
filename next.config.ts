import type { NextConfig } from "next";

// Photos uploaded in the admin are served from the R2 bucket's public URL.
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    serverActions: {
      // Profile photo upload = cropped photo + downscaled original (each a few MB at most).
      // Stays under the 10 MB that proxy.ts buffers by default.
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: r2PublicUrl ? [new URL(`${r2PublicUrl}/**`)] : [],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
