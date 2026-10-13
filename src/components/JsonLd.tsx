import { stegaClean } from "next-sanity";

// Schrijft schema.org-data als JSON-LD in de pagina. "<" wordt ge-escaped zodat
// tekst uit Sanity de script-tag niet kan afsluiten. stegaClean haalt in
// draft mode de onzichtbare bewerk-tekens eruit.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(stegaClean(data)).replace(/</g, "\\u003c") }}
    />
  );
}
