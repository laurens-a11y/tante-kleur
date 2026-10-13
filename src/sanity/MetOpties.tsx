import { draftMode } from "next/headers";
import { Suspense, type ReactNode } from "react";
import { GEPUBLICEERD, getDynamicFetchOptions, type FetchOpties } from "./live";

type Render = (opties: FetchOpties) => ReactNode;

// Bepaalt per verzoek of de pagina gepubliceerde content toont (gewoon bezoek,
// statisch gecachet) of concepten met klikken-en-bewerken (Presentation in de Studio).
export async function MetOpties({ children }: { children: Render }) {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return children(GEPUBLICEERD);
  return (
    <Suspense fallback={null}>
      <Concept>{children}</Concept>
    </Suspense>
  );
}

async function Concept({ children }: { children: Render }) {
  return children(await getDynamicFetchOptions());
}
