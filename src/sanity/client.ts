import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId, studioPad } from "./env";

// Standaard gepubliceerde content zonder token. Draft mode en stega (de
// onzichtbare tekens voor klikken-en-bewerken) regelt live.ts per aanroep.
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
  stega: { studioUrl: studioPad },
});
