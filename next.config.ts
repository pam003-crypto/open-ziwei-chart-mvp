import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = "open-ziwei-chart-mvp";
const pagesBasePath = `/${repositoryName}`;

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(isGitHubPages
    ? {
        assetPrefix: `${pagesBasePath}/`,
        basePath: pagesBasePath,
      }
    : {}),
};

export default nextConfig;
