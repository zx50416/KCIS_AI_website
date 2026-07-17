import type { NextConfig } from "next";

/** GitHub Pages serves this repo at https://zx50416.github.io/-AI-/ */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/-AI-" : "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
