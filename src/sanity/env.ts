// Gedeelde Sanity-instellingen voor site én Studio (ook in de browser bruikbaar).
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "hera4nnf";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = "2026-10-12";
// De Studio draait op /studio binnen deze site (zie src/app/(studio)).
export const studioPad = "/studio";
