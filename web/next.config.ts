import type { NextConfig } from "next";

/** GitHub Pages serves this repo at https://zx50416.github.io/-AI-/ */
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(isGithubPages
    ? {
        basePath: "/-AI-",
        assetPrefix: "/-AI-",
      }
    : {}),
};

export default nextConfig;
