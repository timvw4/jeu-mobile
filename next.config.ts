import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  basePath: "/jeu-mobile",
  assetPrefix: "/jeu-mobile/",

  images: {
    unoptimized: true,
  },
};

export default nextConfig;