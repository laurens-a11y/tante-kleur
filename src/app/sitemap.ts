import type { MetadataRoute } from "next";

const base = "https://tantekleur.nl";
const paths = ["", "/voorbeelden", "/hoe-het-werkt", "/prijzen", "/vragen", "/sinterklaas-en-kerst", "/zakelijk", "/over-ons", "/privacy", "/voorwaarden"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((p) => ({ url: `${base}${p}` }));
}
