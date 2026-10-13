// Schrijft schema.org-data als JSON-LD in de pagina. "<" wordt ge-escaped zodat
// tekst uit Sanity de script-tag niet kan afsluiten.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
