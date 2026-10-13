import { site } from "@/config";
import { paginaMeta, type PaginaType } from "@/content/paginas";
import { themas } from "@/content/vragen";
import { GEPUBLICEERD, getInstellingen, getVragen, vulIn } from "@/sanity/content";

// /llms.txt: een feitelijke samenvatting van Tante Kleur in Markdown, zodat
// AI-assistenten (ChatGPT, Claude, Perplexity) het bedrijf correct beschrijven.
// Alles komt uit Sanity en src/config.ts, dus het blijft vanzelf actueel.

const volgorde: PaginaType[] = [
  "hoeHetWerktPagina",
  "prijzenPagina",
  "voorbeeldenPagina",
  "feestdagenPagina",
  "zakelijkPagina",
  "vragenPagina",
  "overOnsPagina",
];

const namen: Record<PaginaType, string> = {
  homepagina: "Home",
  hoeHetWerktPagina: "Zo werkt het",
  prijzenPagina: "Prijs, verzending en levertijd",
  voorbeeldenPagina: "Voorbeelden",
  feestdagenPagina: "Sinterklaas en kerst",
  zakelijkPagina: "Zakelijk en relatiegeschenken",
  vragenPagina: "Veelgestelde vragen",
  overOnsPagina: "Over ons en contact",
};

export async function GET() {
  const [instellingen, vragen] = await Promise.all([getInstellingen(), getVragen(GEPUBLICEERD)]);
  const { company } = site;

  const feiten = vulIn([
    `Product: persoonlijk kleurboek met {kleurplaten} kleurplaten, gemaakt van de eigen foto's van de klant`,
    `Uitvoering: A4 staand, stevige hardcover, eigen titel en kleur op de cover`,
    `Prijs: {prijs} inclusief btw (introductieprijs, daarna {normalePrijs}); verzending {verzendkosten} per boek`,
    `Bezorging: Nederland en België, binnen {levertijd} werkdagen na akkoord op de digitale proef`,
    `Werkwijze: kleurplaten gemaakt met hulp van AI en door een mens gecontroleerd; klant ziet altijd eerst een digitale proef`,
    `Privacy: foto's alleen gebruikt voor het eigen boek, verwijderd zodra het boek naar de drukker gaat, niet gebruikt om AI te trainen`,
    `Zakelijk: kleurboeken als relatie-, kerst- of jubileumgeschenk, per persoon of als teamboek, op offerte`,
    `Op tijd bestellen voor de feestdagen: {deadlines}`,
    `Bedrijf: ${site.name} is een handelsnaam van ${company.legalName}, ${company.address}; KvK ${company.kvk}`,
    `Contact: ${site.email}`,
  ]);

  const paginas = volgorde.map((t) => `- [${namen[t]}](${site.url}${paginaMeta[t].pad}): ${vulIn(paginaMeta[t].omschrijving)}`);

  const faq = themas.flatMap((t) => {
    const lijst = vragen.filter((v) => v.thema === t.id);
    if (!lijst.length) return [];
    return [`### ${t.titel}`, "", ...lijst.flatMap((v) => [`**${v.vraag}**`, v.antwoord, ""])];
  });

  const tekst = [
    `# ${site.name}`,
    "",
    `> ${instellingen.merkOmschrijving}`,
    "",
    "## Kerngegevens",
    "",
    ...feiten.map((f) => `- ${f}`),
    "",
    "## Pagina's",
    "",
    ...paginas,
    "",
    "## Veelgestelde vragen",
    "",
    ...faq,
    "## Juridisch",
    "",
    `- [Algemene voorwaarden](${site.url}/voorwaarden)`,
    `- [Privacyverklaring](${site.url}/privacy)`,
    "",
  ].join("\n");

  return new Response(tekst, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
