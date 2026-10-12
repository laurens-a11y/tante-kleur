import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Afbeeldingen uit Sanity (alleen dit project).
    remotePatterns: [new URL("https://cdn.sanity.io/images/hera4nnf/**")],
  },
};

export default nextConfig;
