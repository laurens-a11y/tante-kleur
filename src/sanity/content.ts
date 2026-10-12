import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createClient, defineQuery } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";

// Marketingcontent uit Sanity (Studio: https://tantekleur.sanity.studio).
// Klantfoto's horen hier nooit in; alleen teksten en showcase-voorbeelden.

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "hera4nnf";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-10-12",
  useCdn: true,
  perspective: "published",
  token: process.env.SANITY_API_READ_TOKEN,
});

const imageBuilder = createImageUrlBuilder({ projectId, dataset });

type SanityImage = { asset?: { _ref: string }; alt?: string; hotspot?: unknown; crop?: unknown };

export type Homepagina = {
  heroKop: string;
  heroIntro: string;
  verhaalVraag: string;
  verhaalAntwoord: string;
  verhaalTekst: string;
};

export type Vraag = { _id: string; vraag: string; antwoord: string };

export type Voorbeeld = {
  _id: string;
  foto: { url: string; alt: string };
  kleurplaat: { url: string; alt: string };
};

// Standaardteksten: de site blijft werken als Sanity even niet bereikbaar is.
const fallbackHomepagina: Homepagina = {
  heroKop: "Je mooiste momenten, om in te kleuren.",
  heroIntro:
    "Jij en je lief in Spanje, je jaarlijkse vriendenweekend of het eerste jaar van je kleintje. Tante Kleur tovert jouw foto's om tot kleurplaten, in een boek dat net zo bijzonder is als wat erin staat.",
  verhaalVraag: "Ze staan allemaal ergens in je camerarol. En daar blijven ze ook, toch?",
  verhaalAntwoord: "Niet als het aan Tante Kleur ligt.",
  verhaalTekst:
    "Ze houdt van mooie dingen, van mensen en van kleur. En ze vindt dat jouw foto's wel wat meer verdienen. Dus maakt ze er een kleurboek van, met jouw mensen, jouw plekken en jouw verhalen. Aan jou om je herinneringen een kleurtje te geven. Binnen de lijntjes of er lekker buiten. Tante vindt alles goed.",
};

const HOMEPAGINA_QUERY = defineQuery(
  `*[_type == "homepagina"] | order(_updatedAt desc)[0]{heroKop, heroIntro, verhaalVraag, verhaalAntwoord, verhaalTekst}`,
);
const VRAGEN_QUERY = defineQuery(
  `*[_type == "vraag" && defined(vraag) && defined(antwoord)] | order(coalesce(volgorde, 999) asc, _createdAt asc){_id, vraag, antwoord}`,
);
const VOORBEELD_QUERY = defineQuery(
  `*[_type == "voorbeeld" && toestemming == true && defined(foto.asset) && defined(kleurplaat.asset)] | order(coalesce(volgorde, 999) asc, _createdAt asc)[0]{_id, foto, kleurplaat}`,
);

function imageUrl(image: SanityImage, width: number, height: number) {
  return imageBuilder.image(image).width(width).height(height).fit("crop").auto("format").quality(82).url();
}

export async function getHomeContent(): Promise<{
  homepagina: Homepagina;
  vragen: Vraag[] | null;
  voorbeeld: Voorbeeld | null;
}> {
  "use cache";
  // Wijzigingen in de Studio staan binnen enkele minuten op de site.
  cacheLife("minutes");
  cacheTag("sanity");

  try {
    const [home, vragen, voorbeeld] = await Promise.all([
      client.fetch<Partial<Homepagina> | null>(HOMEPAGINA_QUERY),
      client.fetch<Vraag[]>(VRAGEN_QUERY),
      client.fetch<{ _id: string; foto: SanityImage; kleurplaat: SanityImage } | null>(VOORBEELD_QUERY),
    ]);

    return {
      homepagina: {
        heroKop: home?.heroKop || fallbackHomepagina.heroKop,
        heroIntro: home?.heroIntro || fallbackHomepagina.heroIntro,
        verhaalVraag: home?.verhaalVraag || fallbackHomepagina.verhaalVraag,
        verhaalAntwoord: home?.verhaalAntwoord || fallbackHomepagina.verhaalAntwoord,
        verhaalTekst: home?.verhaalTekst || fallbackHomepagina.verhaalTekst,
      },
      vragen: vragen?.length ? vragen : null,
      voorbeeld: voorbeeld
        ? {
            _id: voorbeeld._id,
            foto: { url: imageUrl(voorbeeld.foto, 800, 1000), alt: voorbeeld.foto.alt || "Originele foto" },
            kleurplaat: { url: imageUrl(voorbeeld.kleurplaat, 800, 1000), alt: voorbeeld.kleurplaat.alt || "Kleurplaat" },
          }
        : null,
    };
  } catch (error) {
    console.error("Sanity-content ophalen mislukt:", error instanceof Error ? error.message : error);
    return { homepagina: fallbackHomepagina, vragen: null, voorbeeld: null };
  }
}
