import "server-only";
import { defineQuery, stegaClean } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import { site } from "@/config";
import { dataset, projectId } from "./env";
import { cachedSanity, GEPUBLICEERD, type FetchOpties } from "./live";
import type { Metadata } from "next";
import { instellingen as standaardInstellingen, paginaMeta, paginas, type PaginaType } from "@/content/paginas";
import { standaardVragen, themas, type Vraag } from "@/content/vragen";

export type { Vraag, FetchOpties };
export { GEPUBLICEERD };

// Marketingcontent uit Sanity (Studio: /studio op de site).
// Klantfoto's horen hier nooit in; alleen teksten en showcase-voorbeelden.
//
// Elke functie krijgt FetchOpties mee: gepubliceerd voor gewone bezoekers,
// concepten met stega in draft mode (Presentation). Zie src/sanity/MetOpties.tsx.

const imageBuilder = createImageUrlBuilder({ projectId, dataset });

async function haal<T>(naam: string, query: string, params: Record<string, unknown>, opties: FetchOpties): Promise<T | null> {
  try {
    const { data } = await cachedSanity({ query, params, perspective: opties.perspective, stega: opties.stega });
    return (data as T) ?? null;
  } catch (error) {
    console.error(`Sanity ${naam} ophalen mislukt:`, error instanceof Error ? error.message : error);
    return null;
  }
}

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
  "account", "akkoord", "boek", "cadeau", "chat", "favoriet", "hartje", "home", "kopen", "label", "uitgelicht", "uploaden", "verzending", "winkelmandje", "zoeken",
]);

function gevuld(v: unknown): boolean {
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return v !== null && v !== undefined;
}

// Lijstitems uit Sanity opschonen: lege regels weg. Geen of onbekend icoon: het
// standaardicoon op dezelfde plek, anders "boek".
function schoonLijst(sanity: unknown[], standaard: unknown[]): unknown[] {
  const voorbeeld = standaard[0];
  if (typeof voorbeeld === "string") return sanity.filter((v) => typeof v === "string" && v.trim());
  if (!voorbeeld || typeof voorbeeld !== "object") return sanity;
  const velden = Object.keys(voorbeeld).filter((k) => k !== "_key" && k !== "icoon");
  return sanity
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .filter((item) => velden.every((k) => k === "tekst" || gevuld(item[k])))
    .map((item, i) => {
      if (!("icoon" in voorbeeld)) return item;
      const std = (standaard[i] as { icoon?: string } | undefined)?.icoon ?? "boek";
      return { ...item, icoon: iconen.has(stegaClean(String(item.icoon))) ? stegaClean(item.icoon) : std };
    });
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

// Per veld: waarde uit Sanity als die gevuld is, anders de standaardtekst.
function samenvoegen<T extends Record<string, unknown>>(standaard: T, sanity: Record<string, unknown> | null): T {
  if (!sanity) return standaard;
  const uit: Record<string, unknown> = { ...standaard };
  for (const [k, std] of Object.entries(standaard)) {
    let v = sanity[k];
    if (Array.isArray(v) && Array.isArray(std)) v = schoonLijst(v, std);
    // Objecten (zoals een knop) per onderdeel aanvullen: alleen de kleur kiezen kan dus ook.
    if (isObject(v) && isObject(std)) v = samenvoegen(std, v);
    if (gevuld(v) && typeof v === typeof std) uit[k] = v;
  }
  return uit as T;
}

// Foto's uit Sanity omzetten naar { src, alt } zoals de standaardfoto's; zonder
// bestand weglaten, zodat de standaardfoto blijft staan.
function naarBeelden(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(naarBeelden).filter((x) => x !== undefined);
  if (!isObject(v)) return v;
  if (v._type === "image") {
    const img = v as SanityImage;
    return img.asset ? { src: imageUrl(img, 1000, 1250), alt: img.alt?.trim() || "Tante Kleur-kleurboek" } : undefined;
  }
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, naarBeelden(x)]));
}

export async function getPagina<K extends PaginaType>(type: K, opties: FetchOpties): Promise<(typeof paginas)[K]> {
  const standaard = paginas[type] as Record<string, unknown>;
  const sanity = await haal<Record<string, unknown>>(`pagina ${type}`, PAGINA_QUERY, { type }, opties);
  return vulIn(samenvoegen(standaard, naarBeelden(sanity) as Record<string, unknown> | null)) as (typeof paginas)[K];
}

const PAGINA_QUERY = defineQuery(`*[_type == $type] | order(_updatedAt desc)[0]`);

// ---------- Vragen ----------

const VRAGEN_QUERY = defineQuery(
  `*[_type == "vraag" && defined(vraag) && defined(antwoord)] | order(coalesce(volgorde, 999) asc, _createdAt asc){_id, vraag, antwoord, thema, opHomepage}`,
);

// Alle vragen, voor /vragen. Vragen zonder (geldig) thema komen bij het laatste thema.
export async function getVragen(opties: FetchOpties): Promise<Vraag[]> {
  const geldig = new Set<string>(themas.map((t) => t.id));
  const gevonden = await haal<Vraag[]>("vragen", VRAGEN_QUERY, {}, opties);
  const rows = gevonden?.length ? gevonden : standaardVragen;
  return vulIn(
    rows.map((v) => {
      const thema = stegaClean(v.thema);
      return { ...v, thema: geldig.has(thema) ? thema : themas[themas.length - 1].id };
    }),
  );
}

// ---------- Homepage ----------

const VOORBEELD_QUERY = defineQuery(
  `*[_type == "voorbeeld" && toestemming == true && defined(foto.asset) && defined(kleurplaat.asset)] | order(coalesce(volgorde, 999) asc, _createdAt asc)[0]{_id, foto, kleurplaat}`,
);

function imageUrl(image: SanityImage, width: number, height: number) {
  return imageBuilder.image(image).width(width).height(height).fit("crop").auto("format").quality(82).url();
}

type RuwVoorbeeld = { _id: string; foto: SanityImage; kleurplaat: SanityImage };

function naarVoorbeeld(v: RuwVoorbeeld): Voorbeeld {
  return {
    _id: v._id,
    foto: { url: imageUrl(v.foto, 800, 1000), alt: v.foto.alt || "Originele foto" },
    kleurplaat: { url: imageUrl(v.kleurplaat, 800, 1000), alt: v.kleurplaat.alt || "Kleurplaat" },
  };
}

export async function getHomeContent(opties: FetchOpties) {
  const [homepagina, vragen, ruwVoorbeeld] = await Promise.all([
    getPagina("homepagina", opties),
    getVragen(opties),
    haal<RuwVoorbeeld>("voorbeeld", VOORBEELD_QUERY, {}, opties),
  ]);
  const voorbeeld = ruwVoorbeeld ? naarVoorbeeld(ruwVoorbeeld) : null;
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
export async function getVoorbeelden(opties: FetchOpties): Promise<Voorbeeld[]> {
  const rows = await haal<RuwVoorbeeld[]>("voorbeelden", VOORBEELDEN_QUERY, {}, opties);
  return (rows ?? []).map(naarVoorbeeld);
}

// ---------- SEO ----------

type Seo = { titel?: string; omschrijving?: string; afbeelding?: SanityImage; verbergen?: boolean };
type RuweInstellingen = {
  standaardOmschrijving?: string;
  standaardAfbeelding?: SanityImage;
  merkOmschrijving?: string;
  socialeMedia?: string[];
  headerKnop?: Record<string, unknown>;
  footerKnop?: Record<string, unknown>;
  footerSlogan?: string;
  footerBetalen?: string;
};

const SEO_QUERY = defineQuery(`*[_type == $type] | order(_updatedAt desc)[0].seo`);
const INSTELLINGEN_QUERY = defineQuery(
  `*[_type == "instellingen"] | order(_updatedAt desc)[0]{standaardOmschrijving, standaardAfbeelding, merkOmschrijving, socialeMedia, headerKnop, footerKnop, footerSlogan, footerBetalen}`,
);
const BIJGEWERKT_QUERY = defineQuery(
  `{"paginas": *[_type in $types]{_type, _updatedAt, "verborgen": seo.verbergen == true}, "vragen": *[_type == "vraag"] | order(_updatedAt desc)[0]._updatedAt, "voorbeelden": *[_type == "voorbeeld"] | order(_updatedAt desc)[0]._updatedAt}`,
);

function deelafbeelding(image?: SanityImage) {
  return image?.asset ? imageBuilder.image(image).width(1200).height(630).fit("crop").auto("format").url() : null;
}

// Instellingen, SEO en sitemap gebruiken altijd gepubliceerde content zonder
// stega: die belanden in <head>, JSON-LD en XML, waar onzichtbare tekens schaden.
export async function getInstellingen() {
  const ruw = await haal<RuweInstellingen>("instellingen", INSTELLINGEN_QUERY, {}, GEPUBLICEERD);
  return vulIn({
    standaardOmschrijving: ruw?.standaardOmschrijving?.trim() || standaardInstellingen.standaardOmschrijving,
    merkOmschrijving: ruw?.merkOmschrijving?.trim() || standaardInstellingen.merkOmschrijving,
    socialeMedia: (ruw?.socialeMedia ?? []).filter((u) => /^https?:\/\//.test(u)),
    standaardAfbeelding: deelafbeelding(ruw?.standaardAfbeelding),
    ...samenvoegen(
      {
        headerKnop: standaardInstellingen.headerKnop,
        footerKnop: standaardInstellingen.footerKnop,
        footerSlogan: standaardInstellingen.footerSlogan,
        footerBetalen: standaardInstellingen.footerBetalen,
      },
      ruw ?? null,
    ),
  });
}

// Metadata (title, description, canonical, Open Graph) voor een pagina, met Sanity-SEO waar ingevuld.
export async function getMetadata(type: PaginaType): Promise<Metadata> {
  const [seo, inst] = await Promise.all([haal<Seo>(`SEO ${type}`, SEO_QUERY, { type }, GEPUBLICEERD), getInstellingen()]);
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
  const data = await haal<{
    paginas: { _type: PaginaType; _updatedAt: string; verborgen: boolean }[];
    vragen: string | null;
    voorbeelden: string | null;
  }>("bijgewerkt", BIJGEWERKT_QUERY, { types: Object.keys(paginas) }, GEPUBLICEERD);
  return data ?? { paginas: [], vragen: null, voorbeelden: null };
}
