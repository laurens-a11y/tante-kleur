import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Sanity-data blijft gecachet tot <SanityLive /> een publicatie doorgeeft.
  // Als vangnet ververst de cache uiterlijk na 10 minuten.
  cacheLife: { default: { stale: 60, revalidate: 600, expire: 31_536_000 } },
  partialPrefetching: true,
  experimental: {
    // De CSS is klein (~12 KB): direct in de HTML scheelt op mobiel drie
    // render-blokkerende verzoeken voordat er iets op het scherm staat.
    inlineCss: true,
  },
  // Stijlreferentie, lettertypes en logo meeleveren met de beheer-routes
  // (tekenplaten genereren en drukbestanden maken).
  outputFileTracingIncludes: {
    "/api/beheer/**": ["./assets/stijlreferentie.png", "./assets/fonts/*", "./assets/brand/*"],
  },
  images: {
    // AVIF is voor foto's flink kleiner dan WebP; browsers zonder AVIF krijgen WebP.
    formats: ["image/avif", "image/webp"],
    // Afbeeldingen uit Sanity (alleen dit project). Geen `search` opgeven: Sanity-URL's
    // hebben altijd een querystring (?rect=…&w=…); new URL(...) zou die blokkeren.
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io", port: "", pathname: "/images/hera4nnf/**" }],
  },
};

export default nextConfig;
