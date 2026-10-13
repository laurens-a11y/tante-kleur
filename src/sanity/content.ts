import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createClient, defineQuery } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import { site } from "@/config";
import type { Metadata } from "next";
import { instellingen as standaardInstellingen, paginaMeta, paginas, type PaginaType } from "@/content/paginas";
import { standaardVragen, themas, type Vraag } from "@/content/vragen";

export type { Vraag };

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

export type Voorbeeld = {
  _id: string;
  foto: { url: string; alt: string };
  kleurplaat: { url: string; alt: string };
};

// ---------- Placeholders ----------
// Teksten in Sanity mogen {prijs}, {normalePrijs}, {verzendkosten}, {kleurplaten},
// {levertijd}, {deadlines} en {email} bevatten; die vullen we hier in vanuit src/config.ts.

const placeholders: Record<string, string> = {
  prijs: `€${site.price.intro}`,
  normalePrijs: `€${site.price.regular}`,
  verzendkosten: new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(site.shippingCents / 100),
  kleurplaten: site.plates,
  levertijd: site.leadTimeDays,
  deadlines: site.deadlines.map((d) => `Voor ${d.feest} uiterlijk ${d.datum}`).join(", "),
  email: site.email,
};

export function vulIn<T>(waarde: T): T {
  if (typeof waarde === "string") {
    return waarde.replace(/\{(\w+)\}/g, (heel, naam: string) => placeholders[naam] ?? heel) as T;
  }
  if (Array.isArray(waarde)) return waarde.map(vulIn) as T;
  if (waarde && typeof waarde === "object") {
    return Object.fromEntries(Object.entries(waarde).map(([k, v]) => [k, vulIn(v)])) as T;
  }
  return waarde;
}

// ---------- Paginateksten ----------

const iconen = new Set<string>([
  "account", "akkoord", "boek", "cadeau", "chat", "favoriet", "hartje", "home", "label", "uitgelicht", "uploaden", "verzending", "winkelmandje", "zoeken",
]);

function gevuld(v: unknown): boolean {
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return v !== null && v !== undefined;
}

// Lijstitems uit Sanity opschonen: lege regels weg, onbekend icoon wordt "boek".
function schoonLijst(sanity: unknown[], voorbeeld: unknown): unknown[] {
  if (typeof voorbeeld === "string") return sanity.filter((v) => typeof v === "string" && v.trim());
  if (!voorbeeld || typeof voorbeeld !== "object") return sanity;
  const velden = Object.keys(voorbeeld).filter((k) => k !== "_key" && k !== "icoon");
  return sanity
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .filter((item) => velden.every((k) => k === "tekst" || gevuld(item[k])))
    .map((item) => ("icoon" in voorbeeld ? { ...item, icoon: iconen.has(String(item.icoon)) ? item.icoon : "boek" } : item));
}

// Per veld: waarde uit Sanity als die gevuld is, anders de standaardtekst.
function samenvoegen<T extends Record<string, unknown>>(standaard: T, sanity: Record<string, unknown> | null): T {
  if (!sanity) return standaard;
  const uit: Record<string, unknown> = { ...standaard };
  for (const [k, std] of Object.entries(standaard)) {
    let v = sanity[k];
    if (Array.isArray(v) && Array.isArray(std)) v = schoonLijst(v, std[0]);
    if (gevuld(v) && typeof v === typeof std) uit[k] = v;
  }
  return uit as T;
}

async function haalPaginaOp(type: PaginaType): Promise<Record<string, unknown> | null> {
  "use cache";
  // Wijzigingen in de Studio staan binnen enkele minuten op de site.
  cacheLife("minutes");
  cacheTag("sanity");
  try {
    return await client.fetch<Record<string, unknown> | null>(PAGINA_QUERY, { type });
  } catch (error) {
    console.error(`Sanity-pagina ${type} ophalen mislukt:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getPagina<K extends PaginaType>(type: K): Promise<(typeof paginas)[K]> {
  const standaard = paginas[type] as Record<string, unknown>;
  return vulIn(samenvoegen(standaard, await haalPaginaOp(type))) as (typeof paginas)[K];
}

const PAGINA_QUERY = defineQuery(`*[_type == $type] | order(_updatedAt desc)[0]`);

// ---------- Vragen ----------

const VRAGEN_QUERY = defineQuery(
  `*[_type == "vraag" && defined(vraag) && defined(antwoord)] | order(coalesce(volgorde, 999) asc, _createdAt asc){_id, vraag, antwoord, thema, opHomepage}`,
);

async function haalVragenOp(): Promise<Vraag[] | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("sanity");
  try {
    const rows = await client.fetch<Vraag[]>(VRAGEN_QUERY);
    return rows.length ? rows : null;
  } catch (error) {
    console.error("Sanity-vragen ophalen mislukt:", error instanceof Error ? error.message : error);
    return null;
  }
}

// Alle vragen, voor /vragen. Vragen zonder (geldig) thema komen bij het laatste thema.
export async function getVragen(): Promise<Vraag[]> {
  const geldig = new Set<string>(themas.map((t) => t.id));
  const rows = (await haalVragenOp()) ?? standaardVragen;
  return vulIn(rows.map((v) => ({ ...v, thema: geldig.has(v.thema) ? v.thema : themas[themas.length - 1].id })));
}

// ---------- Homepage ----------

const VOORBEELD_QUERY = defineQuery(
  `*[_type == "voorbeeld" && toestemming == true && defined(foto.asset) && defined(kleurplaat.asset)] | order(coalesce(volgorde, 999) asc, _createdAt asc)[0]{_id, foto, kleurplaat}`,
);

function imageUrl(image: SanityImage, width: number, height: number) {
  return imageBuilder.image(image).width(width).height(height).fit("crop").auto("format").quality(82).url();
}

async function haalVoorbeeldOp(): Promise<Voorbeeld | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("sanity");
  try {
    const v = await client.fetch<{ _id: string; foto: SanityImage; kleurplaat: SanityImage } | null>(VOORBEELD_QUERY);
    return v
      ? {
          _id: v._id,
          foto: { url: imageUrl(v.foto, 800, 1000), alt: v.foto.alt || "Originele foto" },
          kleurplaat: { url: imageUrl(v.kleurplaat, 800, 1000), alt: v.kleurplaat.alt || "Kleurplaat" },
        }
      : null;
  } catch (error) {
    console.error("Sanity-voorbeeld ophalen mislukt:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getHomeContent() {
  const [homepagina, vragen, voorbeeld] = await Promise.all([getPagina("homepagina"), getVragen(), haalVoorbeeldOp()]);
  const opHomepage = vragen.filter((v) => v.opHomepage);
  return {
    homepagina,
    // Geen vragen aangevinkt voor de homepage? Dan de eerste vier.
    vragen: opHomepage.length ? opHomepage : vragen.slice(0, 4),
    voorbeeld,
  };
}

const VOORBEELDEN_QUERY = defineQuery(
  `*[_type == "voorbeeld" && toestemming == true && defined(foto.asset) && defined(kleurplaat.asset)] | order(coalesce(volgorde, 999) asc, _createdAt asc){_id, foto, kleurplaat}`,
);

// Alle voorbeelden met toestemming, voor /voorbeelden.
export async function getVoorbeelden(): Promise<Voorbeeld[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("sanity");

  try {
    const rows = await client.fetch<{ _id: string; foto: SanityImage; kleurplaat: SanityImage }[]>(VOORBEELDEN_QUERY);
    return rows.map((v) => ({
      _id: v._id,
      foto: { url: imageUrl(v.foto, 800, 1000), alt: v.foto.alt || "Originele foto" },
      kleurplaat: { url: imageUrl(v.kleurplaat, 800, 1000), alt: v.kleurplaat.alt || "Kleurplaat" },
    }));
  } catch (error) {
    console.error("Sanity-voorbeelden ophalen mislukt:", error instanceof Error ? error.message : error);
    return [];
  }
}

// ---------- SEO ----------

type Seo = { titel?: string; omschrijving?: string; afbeelding?: SanityImage; verbergen?: boolean };
type RuweInstellingen = {
  standaardOmschrijving?: string;
  standaardAfbeelding?: SanityImage;
  merkOmschrijving?: string;
  socialeMedia?: string[];
};

const SEO_QUERY = defineQuery(`*[_type == $type] | order(_updatedAt desc)[0].seo`);
const INSTELLINGEN_QUERY = defineQuery(
  `*[_type == "instellingen"] | order(_updatedAt desc)[0]{standaardOmschrijving, standaardAfbeelding, merkOmschrijving, socialeMedia}`,
);
const BIJGEWERKT_QUERY = defineQuery(
  `{"paginas": *[_type in $types]{_type, _updatedAt, "verborgen": seo.verbergen == true}, "vragen": *[_type == "vraag"] | order(_updatedAt desc)[0]._updatedAt, "voorbeelden": *[_type == "voorbeeld"] | order(_updatedAt desc)[0]._updatedAt}`,
);

async function haalSeoOp(type: PaginaType): Promise<Seo | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("sanity");
  try {
    return await client.fetch<Seo | null>(SEO_QUERY, { type });
  } catch (error) {
    console.error(`Sanity-SEO ${type} ophalen mislukt:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function haalInstellingenOp(): Promise<RuweInstellingen | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("sanity");
  try {
    return await client.fetch<RuweInstellingen | null>(INSTELLINGEN_QUERY);
  } catch (error) {
    console.error("Sanity-instellingen ophalen mislukt:", error instanceof Error ? error.message : error);
    return null;
  }
}

function deelafbeelding(image?: SanityImage) {
  return image?.asset ? imageBuilder.image(image).width(1200).height(630).fit("crop").auto("format").url() : null;
}

export async function getInstellingen() {
  const ruw = await haalInstellingenOp();
  return vulIn({
    standaardOmschrijving: ruw?.standaardOmschrijving?.trim() || standaardInstellingen.standaardOmschrijving,
    merkOmschrijving: ruw?.merkOmschrijving?.trim() || standaardInstellingen.merkOmschrijving,
    socialeMedia: (ruw?.socialeMedia ?? []).filter((u) => /^https?:\/\//.test(u)),
    standaardAfbeelding: deelafbeelding(ruw?.standaardAfbeelding),
  });
}

// Metadata (title, description, canonical, Open Graph) voor een pagina, met Sanity-SEO waar ingevuld.
export async function getMetadata(type: PaginaType): Promise<Metadata> {
  const [seo, inst] = await Promise.all([haalSeoOp(type), getInstellingen()]);
  const std = paginaMeta[type];
  const titel = vulIn(seo?.titel?.trim() || std.titel);
  const omschrijving = vulIn(seo?.omschrijving?.trim() || std.omschrijving || inst.standaardOmschrijving);
  const afbeelding = deelafbeelding(seo?.afbeelding) ?? inst.standaardAfbeelding;
  const images = afbeelding
    ? [{ url: afbeelding, width: 1200, height: 630, alt: titel }]
    : [{ url: "/brand/hero.jpg", width: 1000, height: 1250, alt: "Drie Tante Kleur-kleurboeken op een zonnige tafel" }];

  return {
    title: { absolute: titel },
    description: omschrijving,
    alternates: { canonical: std.pad },
    openGraph: {
      type: "website",
      locale: "nl_NL",
      siteName: site.name,
      url: std.pad,
      title: titel,
      description: omschrijving,
      images,
    },
    twitter: { card: "summary_large_image", title: titel, description: omschrijving, images: images.map((i) => i.url) },
    robots: seo?.verbergen ? { index: false, follow: true } : undefined,
  };
}

// Laatste wijziging per pagina en welke pagina's verborgen zijn, voor de sitemap.
export async function getBijgewerkt(): Promise<{
  paginas: { _type: PaginaType; _updatedAt: string; verborgen: boolean }[];
  vragen: string | null;
  voorbeelden: string | null;
}> {
  "use cache";
  cacheLife("hours");
  cacheTag("sanity");
  try {
    return await client.fetch(BIJGEWERKT_QUERY, { types: Object.keys(paginas) });
  } catch (error) {
    console.error("Sanity-bijgewerkt ophalen mislukt:", error instanceof Error ? error.message : error);
    return { paginas: [], vragen: null, voorbeelden: null };
  }
}
