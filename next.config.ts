import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = "open-ziwei-chart-mvp";
const pagesBasePath = `/${repositoryName}`;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(isGitHubPages
    ? {
        output: "export" as const,
        assetPrefix: `${pagesBasePath}/`,
        basePath: pagesBasePath,
      }
    : {}),
};

export default nextConfig;
