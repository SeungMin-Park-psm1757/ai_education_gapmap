const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repoName = "ai_education_gapmap";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isGitHubPages ? "export" : "standalone",
  trailingSlash: isGitHubPages,
  basePath: isGitHubPages ? `/${repoName}` : undefined,
  assetPrefix: isGitHubPages ? `/${repoName}/` : undefined,
  images: {
    unoptimized: true
  }
};
export default nextConfig;
