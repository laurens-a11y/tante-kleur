import "server-only";
import { cookies, draftMode } from "next/headers";
import {
  defineLive,
  resolvePerspectiveFromCookies,
  type LivePerspective,
  type StrictDefinedFetchType,
} from "next-sanity/live";
import { client } from "./client";

// Leestoken met Viewer-rechten. Wordt alleen in draft mode (Presentation in de
// Studio) met de browser gedeeld, om concepten live te tonen.
const token = process.env.SANITY_API_READ_TOKEN || undefined;

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token ?? false,
  browserToken: token ?? false,
  strict: true,
});

// Eén gedeelde cache-grens voor alle Sanity-queries. Gepubliceerde wijzigingen
// komen via <SanityLive /> direct door; zie cacheLife in next.config.ts als vangnet.
export const cachedSanity: StrictDefinedFetchType = async (options) => {
  "use cache";
  return sanityFetch(options);
};

export type FetchOpties = { perspective: LivePerspective; stega: boolean };

export const GEPUBLICEERD: FetchOpties = { perspective: "published", stega: false };

// Alleen buiten "use cache" aanroepen: leest draft mode en cookies.
export async function getDynamicFetchOptions(): Promise<FetchOpties> {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return GEPUBLICEERD;
  const perspective = await resolvePerspectiveFromCookies({ cookies: await cookies() });
  return { perspective: perspective ?? "drafts", stega: true };
}
