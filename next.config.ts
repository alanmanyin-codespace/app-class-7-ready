import type { NextConfig } from "next";

// A static export keeps the first release backend-free and Vercel-compatible.
// Routes using server-only features must not be added while output is 'export'.
const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
};

export default nextConfig;
