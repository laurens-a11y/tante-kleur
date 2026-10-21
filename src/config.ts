// Centrale instellingen voor de site. Pas hier aan, niet verspreid in de pagina's.

export const site = {
  name: "Tante Kleur",
  // Productiedomein, voor canonical-links, sitemap en gestructureerde data.
  url: "https://tantekleur.nl",
  price: { intro: 59, regular: 69 },
  // Verzendkosten per boek, incl. btw, in centen (NL en BE).
  shippingCents: 695,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "tante@tantekleur.nl",
  // TODO: levertijd bevestigen na eerste proefdruk bij PrintAPI
  leadTimeDays: "10",
  company: {
    // Tante Kleur is een handelsnaam van LaunchLab VOF.
    legalName: "LaunchLab VOF",
    address: "Sportlaan 22B, 5242 CR Rosmalen",
    kvk: "42128246",
    rsin: "869851615",
    vat: "NL869851615B01",
    iban: "NL63 REVO 3914 5052 65",
  },
  // Uiterste besteldatum per feestdag (incl. uploaden, proef en levertijd).
  // TODO: voorstel; bevestigen na eerste proefdruk bij PrintAPI.
  deadlines: [
    { feest: "Sinterklaas", datum: "14 november" },
    { feest: "Kerst", datum: "4 december" },
  ],
  // Aantal kleurplaten per boek (tekst op de site).
  plates: "19 of 21",
} as const;

// Google Tag Manager. Laadt alleen op de publieke pagina's: op /boek, /bedankt
// en /beheer staat een geheime code of sessie in de URL die niet naar Google mag.
// Google-tags plaatsen pas cookies na toestemming (Consent Mode, zie CookieMelding).
export const tagManager = {
  id: "GTM-PZSHLGBV",
  uitgesloten: ["/boek", "/bedankt", "/beheer", "/studio"],
} as const;

export function tagManagerOpPad(pad: string) {
  return !tagManager.uitgesloten.some((p) => pad === p || pad.startsWith(`${p}/`));
}

// Instellingen van het boek zelf: hoeveel pagina's en welke covers.
export const boek = {
  // Minimaal en maximaal aantal foto's (= kleurplaten = spreads). Alleen
  // aantallen waarbij het binnenwerk op een veelvoud van 4 pagina's uitkomt
  // zijn toegestaan (zie geldigAantalFotos); met 2 voorpagina's is dat oneven.
  minFotos: 19,
  maxFotos: 21,
  // Maximale lengtes in tekens. Gemeten zodat alles altijd past in de
  // vaste tekstvakken van het binnenwerk (zie src/lib/druk/opmaak.ts).
  maxTitel: 40,
  maxPaginaTitel: 30,
  // Langste woord in een titel: langer past niet op 50 pt (de ondergrens).
  maxWoordInTitel: 16,
  maxVerhaal: 400,
  maxInleiding: 700,
  maxNawoord: 1200,
  // Maximaal aantal AI-voorstellen per boek (tegen misbruik en kosten).
  maxAiAanroepen: 100,
  // Coverkleuren. `kleur` verwijst naar een merkkleur in globals.css.
  coverKleuren: [
    { value: "blauw", label: "Blauw", kleur: "blauw", tekst: "wit" },
    { value: "lichtblauw", label: "Lichtblauw", kleur: "lichtblauw", tekst: "blauw" },
    { value: "roze", label: "Roze", kleur: "roze", tekst: "blauw" },
    { value: "oranje", label: "Oranje", kleur: "rood", tekst: "wit" },
    { value: "geel", label: "Geel", kleur: "geel", tekst: "blauw" },
  ],
} as const;

export type CoverKleur = (typeof boek.coverKleuren)[number]["value"];

// Kleur van de verhaalpagina's (de linkerpagina's met inleiding, verhaaltjes en
// nawoord). De kleurplaten zelf blijven altijd wit. Alleen merkkleuren;
// `tekst` is de leesbare tekstkleur op die achtergrond.
export const binnenKleuren = [
  { value: "wit", label: "Wit", tekst: "blauw" },
  { value: "lichtblauw", label: "Lichtblauw", tekst: "blauw" },
  { value: "roze", label: "Roze", tekst: "blauw" },
  { value: "geel", label: "Geel", tekst: "blauw" },
  { value: "rood", label: "Rood", tekst: "wit" },
  { value: "blauw", label: "Blauw", tekst: "wit" },
] as const;

export const standaardBinnenKleur = "wit";

export function binnenKleur(value: string | null | undefined) {
  return binnenKleuren.find((k) => k.value === value) ?? binnenKleuren[0];
}

// Mag de klant een nawoord schrijven? Nu niet: het ontwerp van het binnenwerk
// heeft geen nawoordpagina. Veld en data blijven bestaan.
export const nawoordAan = false;

// Drukwerk voor PrintAPI (hardcover A4 staand). Maten in mm.
// Binnenwerk: 2 voorpagina's (leeg + inleiding) en per foto 2 pagina's.
export const drukwerk = {
  voorPaginas: 2,
  // Vaste kleuren in de drukbestanden. De klant kan in het formulier nog wel
  // kiezen (en dat wordt bewaard), maar dat wordt nu genegeerd.
  // Zet op null om de keuze van de klant weer te gebruiken.
  vasteKleuren: { cover: "roze", binnen: "wit" } as { cover: CoverKleur; binnen: string } | null,
  binnenwerk: { breedte: 216, hoogte: 303, afloop: 3 },
  cover: { breedte: 477, hoogte: 342, afloop: 19, rug: 6 },
} as const;

// Opmaak van de cover volgens de kernbriefing van de designer (okt 2026).
// Maten in mm, lokaal t.o.v. de TrimBox, zodat ze bij een andere rugbreedte
// meeschuiven met het voorplat in plaats van mee te schalen.
// LET OP: de covermaten in `drukwerk.cover` komen uit de referentie-PDF van de
// designer en zijn nog niet bevestigd als PrintAPI-sjabloon (`bevestigd`).
export const coverOpmaak = {
  bevestigd: false,
  kleuren: { roze: "#fcb2bf", blauw: "#052ed6", lijn: "#f73d12" },
  scheidingVanafBoven: 248.75, // scheidingslijn beeld/blauw, vanaf bovenkant TrimBox (referentie y = 267,75 mm)
  titel: {
    linksVanafVoorplat: 14.42, // linker uitlijning t.o.v. linkerrand voorplat (referentie x = 255,92 mm)
    rechtsMarge: 12.7, // rechtergrens binnen de rechter TrimBox-rand
    onderMarge: 12.7, // roze regel blijft zo ver van de onderste TrimBox-rand
    start: 84,
    stap: 0.5,
    min: 40,
    maxRegels: 3,
  },
  sticker: { maat: 48.9, marge: 12.7 }, // boven en rechts vanaf TrimBox
  // Merkuiting achterplat: positie linksboven t.o.v. de linkerbovenhoek van de TrimBox, breedte in mm.
  achterLogo: { x: 74.0, y: 128.27, breedte: 69.17 },
  minPpi: 300,
} as const;

// Automatische nabewerking van álle tekenplaten in het binnenwerk (zie
// src/lib/druk/nabewerking.ts). Eén set instellingen, geen handwerk per plaat.
// Het origineel in Supabase blijft ongewijzigd; dit gebeurt bij het maken van
// de drukbestanden, dus aanpassen werkt ook voor bestaande boeken.
export const plaatNabewerking = {
  aan: true,
  doelHoogtePx: 3600, // ≈ 300 dpi op 303 mm (A4 + afloop)
  zwartpunt: 30, // donkerder dan dit → volledig zwart (hoger maakt ogen en gezichten te zwaar)
  witpunt: 235, // lichter dan dit → zuiver wit (gebroken wit en lichte arcering weg)
  minVlek: 0.05, // mm²: losse vlekjes kleiner dan dit weg
  verdikking: 0.1, // mm: lijnen iets dikker, beter te kleuren en te drukken
  lijnKleur: "#000000", // bv. "#4a4a4a" voor zachtere grijze lijnen
};

/** Aantal pagina's van het binnenwerk bij n foto's. */
export function binnenwerkPaginas(fotos: number) {
  return drukwerk.voorPaginas + 2 * fotos;
}

/** Komt het binnenwerk met dit aantal foto's uit op een veelvoud van 4 pagina's? */
export function geldigAantalFotos(fotos: number) {
  return fotos >= boek.minFotos && fotos <= boek.maxFotos && binnenwerkPaginas(fotos) % 4 === 0;
}

/** Toegestane aantallen foto's, bijv. [19, 21]. */
export const toegestaneAantallen = Array.from({ length: boek.maxFotos - boek.minFotos + 1 }, (_, i) => boek.minFotos + i).filter(geldigAantalFotos);

/** Langste woord in een titel; te lang = past niet groot genoeg op de pagina. */
export function teLangWoord(titel: string) {
  return titel.split(/\s+/).find((w) => w.length > boek.maxWoordInTitel) ?? null;
}

// Kleurthema's van de tekstpagina's in het binnenwerk, volgens het ontwerp van
// de designer. De hexwaarden zijn de vaste drukwaarden uit haar specificatie
// (wijken iets af van de schermkleuren); `css` verwijst naar de merkkleuren in
// globals.css voor de previews op de site. Elk boek begint met oranjerood.
export const binnenThemas = [
  { naam: "oranjerood", achtergrond: "#f73d12", titel: "#052ed6", tekst: "#fcb2bf", css: { achtergrond: "rood", titel: "blauw", tekst: "roze" } },
  { naam: "roze", achtergrond: "#fcb2bf", titel: "#052ed6", tekst: "#f73d12", css: { achtergrond: "roze", titel: "blauw", tekst: "rood" } },
  { naam: "blauw", achtergrond: "#052ed6", titel: "#bfdbe8", tekst: "#fcb2bf", css: { achtergrond: "blauw", titel: "lichtblauw", tekst: "roze" } },
  { naam: "lichtblauw", achtergrond: "#bfdbe8", titel: "#052ed6", tekst: "#f73d12", css: { achtergrond: "lichtblauw", titel: "blauw", tekst: "rood" } },
  { naam: "geel", achtergrond: "#f5b205", titel: "#052ed6", tekst: "#f73d12", css: { achtergrond: "geel", titel: "blauw", tekst: "rood" } },
] as const;

export type BinnenThema = (typeof binnenThemas)[number];

/** Thema van de tekstpagina bij foto i (0-based). */
export function themaVoorFoto(i: number): BinnenThema {
  return binnenThemas[i % binnenThemas.length];
}

/** Thema van de inleidingspagina. */
export const inleidingThema: BinnenThema = binnenThemas[2]; // blauw

// Merkkleuren als hex voor de drukbestanden. Moeten gelijk blijven aan
// de CSS-variabelen in src/app/(site)/globals.css.
export const merkHex: Record<string, string> = {
  blauw: "#002cd4",
  rood: "#f73d11",
  roze: "#f4b3c1",
  lichtblauw: "#c1dce6",
  geel: "#f3b500",
  wit: "#ffffff",
};

// Mag de klant zelf de cover- en binnenkleur kiezen? Nu niet (fase 1): de
// kiezers zijn verborgen en overal gelden de vaste kleuren van drukwerk.
// Zet op true (en drukwerk.vasteKleuren op null) om de keuze terug te zetten.
export const kleurKeuzeAan = false;

/** De kleuren die echt gelden: de keuze van de klant, of de vaste kleuren. */
export function geldendeKleuren(cover: string | null, binnen: string | null) {
  if (!kleurKeuzeAan && drukwerk.vasteKleuren) return { cover: drukwerk.vasteKleuren.cover as string, binnen: drukwerk.vasteKleuren.binnen };
  return { cover, binnen };
}
