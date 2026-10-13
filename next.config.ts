import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Sanity-data blijft gecachet tot <SanityLive /> een publicatie doorgeeft.
  // Als vangnet ververst de cache uiterlijk na 10 minuten.
  cacheLife: { default: { stale: 60, revalidate: 600, expire: 31_536_000 } },
  partialPrefetching: true,
  images: {
    // Afbeeldingen uit Sanity (alleen dit project).
    remotePatterns: [new URL("https://cdn.sanity.io/images/hera4nnf/**")],
  },
};

export default nextConfig;
