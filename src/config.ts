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
  plates: "18 tot 22",
} as const;

// Instellingen van het boek zelf: hoeveel pagina's en welke covers.
export const boek = {
  // Minimaal en maximaal aantal foto's (= kleurplaten = spreads).
  minFotos: 18,
  maxFotos: 22,
  // Maximale lengtes in tekens.
  maxTitel: 40,
  maxVerhaal: 400,
  maxInleiding: 1200,
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

// Drukwerk voor PrintAPI (hardcover A4 staand). Maten in mm.
// Het aantal pagina's is nu vast voor de test; later per boek: 2 × foto's + 4.
export const drukwerk = {
  paginas: 24,
  // Vaste kleuren in de drukbestanden. De klant kan in het formulier nog wel
  // kiezen (en dat wordt bewaard), maar dat wordt nu genegeerd.
  // Zet op null om de keuze van de klant weer te gebruiken.
  vasteKleuren: { cover: "roze", binnen: "wit" } as { cover: CoverKleur; binnen: string } | null,
  binnenwerk: { breedte: 216, hoogte: 303, afloop: 3 },
  cover: { breedte: 477, hoogte: 342, afloop: 19, rug: 6 },
} as const;

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
