import { defineArrayMember, defineField, defineType } from "sanity";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { CaseIcon } from "@sanity/icons/Case";
import { CogIcon } from "@sanity/icons/Cog";
import { HeartIcon } from "@sanity/icons/Heart";
import { HelpCircleIcon } from "@sanity/icons/HelpCircle";
import { HomeIcon } from "@sanity/icons/Home";
import { ImageIcon } from "@sanity/icons/Image";
import { ImagesIcon } from "@sanity/icons/Images";
import { BasketIcon } from "@sanity/icons/Basket";
import { RocketIcon } from "@sanity/icons/Rocket";
import { knopStijlen, merkkleuren } from "@/content/knoppen";

// Contentmodel van de Studio op /studio. Dit is de enige bron van het schema;
// zie README > Content in Sanity.

const placeholderHulp = "{prijs}, {normalePrijs}, {verzendkosten}, {kleurplaten} en {levertijd} worden automatisch ingevuld.";

const iconen = [
  { title: "Account / persoon", value: "account" },
  { title: "Vinkje", value: "akkoord" },
  { title: "Boek", value: "boek" },
  { title: "Cadeau", value: "cadeau" },
  { title: "Chat", value: "chat" },
  { title: "Ster", value: "favoriet" },
  { title: "Hartje", value: "hartje" },
  { title: "Huis", value: "home" },
  { title: "Label", value: "label" },
  { title: "Uitgelicht", value: "uitgelicht" },
  { title: "Uploaden", value: "uploaden" },
  { title: "Verzending", value: "verzending" },
  { title: "Winkelmandje", value: "winkelmandje" },
  { title: "Winkelwagen", value: "kopen" },
  { title: "Vergrootglas", value: "zoeken" },
];

// ---------- Objecten ----------

const kaart = defineType({
  name: "kaart",
  title: "Kaart",
  type: "object",
  fields: [
    defineField({ name: "icoon", title: "Icoon", type: "string", options: { list: iconen }, initialValue: "boek" }),
    defineField({ name: "titel", title: "Titel", type: "string", validation: (r) => r.required().max(60) }),
    defineField({ name: "tekst", title: "Tekst", type: "text", rows: 3, description: placeholderHulp, validation: (r) => r.required().max(300) }),
    defineField({
      name: "achtergrond",
      title: "Achtergrondkleur",
      type: "string",
      options: { list: merkkleuren.map(({ title, value }) => ({ title, value })), layout: "radio", direction: "horizontal" },
      description: "Kleur van het blok. Leeg laten: de vaste afwisseling van de pagina. De tekstkleur past zich aan. Niet gebruikt bij \"Goed om te weten\" op de pagina Prijs.",
    }),
  ],
  preview: { select: { title: "titel", subtitle: "tekst" } },
});

const mijlpaal = defineType({
  name: "mijlpaal",
  title: "Stap",
  type: "object",
  fields: [
    defineField({ name: "icoon", title: "Icoon", type: "string", options: { list: iconen }, description: "Leeg laten: het standaardicoon voor deze stap." }),
    defineField({ name: "titel", title: "Titel", type: "string", validation: (r) => r.required().max(60) }),
    defineField({ name: "tekst", title: "Toelichting", type: "string", description: "{levertijd} wordt automatisch ingevuld." }),
  ],
  preview: { select: { title: "titel", subtitle: "tekst" } },
});

const kenmerk = defineType({
  name: "kenmerk",
  title: "Kenmerk",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Label", type: "string", validation: (r) => r.required() }),
    defineField({ name: "waarde", title: "Waarde", type: "string", description: "{kleurplaten} wordt automatisch ingevuld.", validation: (r) => r.required() }),
  ],
  preview: { select: { title: "label", subtitle: "waarde" } },
});

const knop = defineType({
  name: "knop",
  title: "Knop",
  type: "object",
  options: { collapsible: true, collapsed: true },
  description: "Waar de knop naartoe gaat staat vast in de code. De tekstkleur kiest de site zelf, zodat de knop altijd leesbaar is.",
  fields: [
    defineField({ name: "tekst", title: "Tekst", type: "string", validation: (r) => r.max(40) }),
    defineField({
      name: "kleur",
      title: "Kleur",
      type: "string",
      options: { list: merkkleuren.map(({ title, value }) => ({ title, value })), layout: "radio", direction: "horizontal" },
      description: "Kies een kleur die afsteekt tegen de achtergrond van het blok.",
    }),
    defineField({
      name: "stijl",
      title: "Stijl",
      type: "string",
      options: { list: knopStijlen.map(({ title, value }) => ({ title, value })), layout: "radio", direction: "horizontal" },
      description: "Primair: gevuld met de kleur. Secundair: alleen een rand en tekst in de kleur.",
    }),
  ],
  preview: { select: { title: "tekst", kleur: "kleur", stijl: "stijl" }, prepare: ({ title, kleur, stijl }) => ({ title: title || "Standaardtekst", subtitle: [kleur, stijl].filter(Boolean).join(" · ") }) },
});

const seo = defineType({
  name: "seo",
  title: "Zoekmachines en delen",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "titel",
      title: "Paginatitel (meta title)",
      type: "string",
      description: "Wat Google en AI-zoekmachines als titel tonen. Laat leeg voor de standaardtitel. Ideaal: 50 tot 60 tekens.",
      validation: (r) => r.max(70).warning("Langer dan 70 tekens wordt vaak afgekapt."),
    }),
    defineField({
      name: "omschrijving",
      title: "Omschrijving (meta description)",
      type: "text",
      rows: 3,
      description: "De korte tekst onder de titel in zoekresultaten. Ideaal: 120 tot 160 tekens. {prijs} en {levertijd} worden ingevuld.",
      validation: (r) => r.max(170).warning("Langer dan 170 tekens wordt vaak afgekapt."),
    }),
    defineField({
      name: "afbeelding",
      title: "Deelafbeelding",
      type: "image",
      description: "Getoond bij delen op WhatsApp, LinkedIn en sociale media. Liggend, minstens 1200 x 630 pixels. Laat leeg voor de standaardafbeelding.",
      options: { hotspot: true },
    }),
    defineField({
      name: "verbergen",
      title: "Niet tonen in zoekmachines",
      type: "boolean",
      description: "Alleen aanzetten voor pagina's die niet gevonden mogen worden.",
      initialValue: false,
    }),
  ],
});

// Knopveld; leeg gelaten onderdelen vallen terug op de standaard in src/content/paginas.ts.
const knopVeld = (name: string, title: string, group?: string) => defineField({ name, title, type: "knop", group });
const seoVeld = (group?: string) => defineField({ name: "seo", title: "Zoekmachines en delen", type: "seo", group });
const kaarten = (name: string, title: string, description?: string) =>
  defineField({ name, title, type: "array", of: [defineArrayMember({ type: "kaart" })], description });
const regels = (name: string, title: string, opties: { group?: string; description?: string } = {}) =>
  defineField({ name, title, type: "array", of: [defineArrayMember({ type: "string" })], ...opties });

// ---------- Singletons ----------

const homepagina = defineType({
  name: "homepagina",
  title: "Homepagina",
  type: "document",
  icon: HomeIcon,
  groups: [
    { name: "bovenaan", title: "Bovenaan", default: true },
    { name: "verhaal", title: "Merkverhaal" },
    { name: "stappen", title: "Zo werkt het" },
    { name: "blokken", title: "Overige blokken" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "heroKop", title: "Kop bovenaan", type: "string", group: "bovenaan", description: "De grote kop in het roze blok bovenaan de pagina.", validation: (r) => r.required().max(80) }),
    defineField({ name: "heroIntro", title: "Introtekst bovenaan", type: "text", rows: 3, group: "bovenaan", validation: (r) => r.required().max(300) }),
    defineField({ name: "heroKenmerken", title: "Kenmerken onder de knoppen", type: "array", group: "bovenaan", of: [defineArrayMember({ type: "string" })], validation: (r) => r.max(4) }),
    knopVeld("heroKnop", "Knop: bestellen (bovenaan)", "bovenaan"),
    knopVeld("heroKnopVoorbeelden", "Knop: voorbeelden (bovenaan)", "bovenaan"),
    defineField({ name: "verhaalVraag", title: "Merkverhaal: eerste zin (roze)", type: "string", group: "verhaal", validation: (r) => r.required() }),
    defineField({ name: "verhaalAntwoord", title: "Merkverhaal: tweede zin (wit)", type: "string", group: "verhaal", description: "Staat ook als kop op de pagina Over ons.", validation: (r) => r.required() }),
    defineField({ name: "verhaalTekst", title: "Merkverhaal: lopende tekst", type: "text", rows: 5, group: "verhaal", description: "Staat ook op de pagina Over ons.", validation: (r) => r.required() }),
    defineField({ name: "stappenKop", title: "Kop", type: "string", group: "stappen" }),
    defineField({ name: "stappen", title: "Stappen", type: "array", group: "stappen", of: [defineArrayMember({ type: "kaart" })], validation: (r) => r.max(4) }),
    defineField({ name: "voorbeeldKop", title: "Voorbeeld: kop", type: "string", group: "blokken" }),
    defineField({ name: "voorbeeldTekst", title: "Voorbeeld: tekst", type: "text", rows: 3, group: "blokken" }),
    defineField({ name: "coverKop", title: "Covers: kop", type: "string", group: "blokken" }),
    defineField({ name: "coverTekst", title: "Covers: tekst", type: "text", rows: 2, group: "blokken" }),
    regels("prijsKenmerken", "Prijsblok: kenmerken met vinkje", { group: "blokken", description: "{kleurplaten} wordt automatisch ingevuld." }),
    knopVeld("prijsKnop", "Prijsblok: knop", "blokken"),
    defineField({ name: "cadeauKop", title: "Cadeau: kop", type: "string", group: "blokken" }),
    defineField({ name: "cadeauTekst", title: "Cadeau: tekst", type: "text", rows: 3, group: "blokken" }),
    knopVeld("cadeauKnop", "Cadeau: knop", "blokken"),
    defineField({ name: "zakelijkKop", title: "Zakelijk: kop", type: "string", group: "blokken" }),
    defineField({ name: "zakelijkTekst", title: "Zakelijk: tekst", type: "text", rows: 3, group: "blokken" }),
    knopVeld("zakelijkKnop", "Zakelijk: knop", "blokken"),
    knopVeld("vragenKnop", "Vragen: knop naar alle vragen", "blokken"),
    seoVeld("seo"),
  ],
  preview: { prepare: () => ({ title: "Homepagina" }) },
});

const hoeHetWerktPagina = defineType({
  name: "hoeHetWerktPagina",
  title: "Pagina: Zo werkt het",
  type: "document",
  icon: RocketIcon,
  fields: [
    defineField({ name: "kop", title: "Kop bovenaan", type: "string", validation: (r) => r.required().max(80) }),
    defineField({ name: "intro", title: "Introtekst", type: "text", rows: 2 }),
    defineField({ name: "stappenKop", title: "Stappen: kop", type: "string" }),
    defineField({ name: "stappen", title: "Stappen", type: "array", of: [defineArrayMember({ type: "kaart" })], validation: (r) => r.max(4) }),
    defineField({ name: "tekenenKop", title: "Hoe Tante tekent: kop", type: "string" }),
    defineField({ name: "tekenenTekst", title: "Hoe Tante tekent: tekst", type: "text", rows: 4 }),
    defineField({ name: "fototipsKop", title: "Fototips: kop", type: "string" }),
    regels("werktGoed", "Fototips: werkt goed"),
    regels("werktMinder", "Fototips: werkt minder goed"),
    defineField({ name: "tijdlijnKop", title: "Tijdlijn: kop", type: "string" }),
    defineField({
      name: "tijdlijnAchtergrond",
      title: "Tijdlijn: achtergrondkleur",
      type: "string",
      options: { list: merkkleuren.map(({ title, value }) => ({ title, value })), layout: "radio", direction: "horizontal" },
      description: "Leeg laten: geel. De tekstkleur past zich aan.",
    }),
    defineField({ name: "tijdlijn", title: "Tijdlijn", type: "array", of: [defineArrayMember({ type: "mijlpaal" })] }),
    defineField({ name: "privacyKop", title: "Privacy: kop", type: "string" }),
    regels("privacyPunten", "Privacy: punten"),
    knopVeld("knop", "Knop onderaan"),
    seoVeld(),
  ],
  preview: { prepare: () => ({ title: "Zo werkt het" }) },
});

const prijzenPagina = defineType({
  name: "prijzenPagina",
  title: "Pagina: Prijs",
  type: "document",
  icon: BasketIcon,
  fields: [
    defineField({ name: "kop", title: "Kop bovenaan", type: "string", description: "De prijs zelf staat in de code (src/config.ts), omdat die aan Stripe gekoppeld is.", validation: (r) => r.required().max(80) }),
    defineField({ name: "intro", title: "Introtekst", type: "text", rows: 2 }),
    defineField({ name: "kenmerken", title: "Wat zit erin", type: "array", of: [defineArrayMember({ type: "kenmerk" })] }),
    knopVeld("knop", "Knop bij de prijs"),
    defineField({ name: "verzendingKop", title: "Verzending: kop", type: "string" }),
    regels("verzendingPunten", "Verzending: punten", { description: "{verzendkosten} en {levertijd} worden automatisch ingevuld. De besteldeadlines komen er automatisch onder." }),
    defineField({ name: "zakelijkKop", title: "Zakelijk: kop", type: "string" }),
    defineField({ name: "zakelijkTekst", title: "Zakelijk: tekst", type: "text", rows: 2 }),
    knopVeld("zakelijkKnop", "Zakelijk: knop"),
    defineField({ name: "weetjesKop", title: "Goed om te weten: kop", type: "string" }),
    kaarten("weetjes", "Goed om te weten", "Het icoon wordt hier niet getoond."),
    knopVeld("vragenKnop", "Goed om te weten: knop naar alle vragen"),
    seoVeld(),
  ],
  preview: { prepare: () => ({ title: "Prijs" }) },
});

const zakelijkPagina = defineType({
  name: "zakelijkPagina",
  title: "Pagina: Zakelijk",
  type: "document",
  icon: CaseIcon,
  fields: [
    defineField({ name: "kop", title: "Kop bovenaan", type: "string", validation: (r) => r.required().max(80) }),
    defineField({ name: "intro", title: "Introtekst", type: "text", rows: 2 }),
    knopVeld("heroKnop", "Knop bovenaan (naar het offerteformulier)"),
    defineField({ name: "gelegenhedenKop", title: "Gelegenheden: kop", type: "string" }),
    kaarten("gelegenheden", "Gelegenheden"),
    defineField({ name: "mogelijkhedenKop", title: "Mogelijkheden: kop", type: "string" }),
    kaarten("mogelijkheden", "Mogelijkheden"),
    defineField({ name: "stappenKop", title: "Werkwijze: kop", type: "string" }),
    regels("stappen", "Werkwijze: stappen"),
    defineField({
      name: "stappenIconen",
      title: "Werkwijze: iconen",
      type: "array",
      of: [defineArrayMember({ type: "string", options: { list: iconen } })],
      description: "Eén icoon per stap, in dezelfde volgorde als de stappen. Leeg laten: de standaardiconen.",
    }),
    defineField({ name: "kerstTekst", title: "Werkwijze: tip voor kerst", type: "text", rows: 2 }),
    defineField({ name: "offerteKop", title: "Offerte: kop", type: "string" }),
    defineField({ name: "offerteTekst", title: "Offerte: tekst", type: "text", rows: 2 }),
    knopVeld("offerteKnop", "Offerte: verzendknop"),
    seoVeld(),
  ],
  preview: { prepare: () => ({ title: "Zakelijk" }) },
});

const feestdagenPagina = defineType({
  name: "feestdagenPagina",
  title: "Pagina: Sinterklaas & kerst",
  type: "document",
  icon: CalendarIcon,
  fields: [
    defineField({ name: "kop", title: "Kop bovenaan", type: "string", validation: (r) => r.required().max(100) }),
    defineField({ name: "intro", title: "Introtekst", type: "text", rows: 2 }),
    knopVeld("heroKnop", "Knop bovenaan"),
    defineField({ name: "deadlineKop", title: "Deadlines: kop", type: "string", description: "De data zelf staan in de code (src/config.ts)." }),
    defineField({ name: "deadlineTekst", title: "Deadlines: tekst", type: "text", rows: 2 }),
    defineField({ name: "ideeenKop", title: "Voor wie: kop", type: "string" }),
    kaarten("ideeen", "Voor wie"),
    defineField({ name: "tipLabel", title: "Tip: label", type: "string" }),
    defineField({ name: "tipKop", title: "Tip: kop", type: "string" }),
    defineField({ name: "tipTekst", title: "Tip: tekst", type: "text", rows: 3 }),
    defineField({ name: "prijsTekst", title: "Prijsblok: tekst onder de prijs", type: "string", description: "{prijs} en {normalePrijs} worden automatisch ingevuld." }),
    knopVeld("prijsKnop", "Prijsblok: knop"),
    seoVeld(),
  ],
  preview: { prepare: () => ({ title: "Sinterklaas & kerst" }) },
});

const overOnsPagina = defineType({
  name: "overOnsPagina",
  title: "Pagina: Over ons",
  type: "document",
  icon: HeartIcon,
  fields: [
    defineField({ name: "waardenKop", title: "Waarden: kop", type: "string", description: "Kop en tekst bovenaan komen uit het merkverhaal op de Homepagina." }),
    kaarten("waarden", "Waarden"),
    defineField({ name: "contactKop", title: "Contact: kop", type: "string" }),
    seoVeld(),
  ],
  preview: { prepare: () => ({ title: "Over ons" }) },
});

const vragenPagina = defineType({
  name: "vragenPagina",
  title: "Pagina: Vragen",
  type: "document",
  icon: HelpCircleIcon,
  fields: [
    defineField({ name: "kop", title: "Kop bovenaan", type: "string", description: "De vragen zelf beheer je bij Veelgestelde vragen.", validation: (r) => r.required().max(80) }),
    seoVeld(),
  ],
  preview: { prepare: () => ({ title: "Vragen" }) },
});

const voorbeeldenPagina = defineType({
  name: "voorbeeldenPagina",
  title: "Pagina: Voorbeelden",
  type: "document",
  icon: ImagesIcon,
  fields: [
    defineField({ name: "kop", title: "Kop bovenaan", type: "string", description: "De voorbeelden zelf beheer je bij Voorbeelden (foto en kleurplaat).", validation: (r) => r.required().max(80) }),
    defineField({ name: "intro", title: "Introtekst", type: "text", rows: 2 }),
    knopVeld("knop", "Knop onderaan: bestellen"),
    knopVeld("fototipsKnop", "Knop onderaan: fototips"),
    seoVeld(),
  ],
  preview: { prepare: () => ({ title: "Voorbeelden" }) },
});

const instellingen = defineType({
  name: "instellingen",
  title: "Instellingen: SEO en merk",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({ name: "standaardOmschrijving", title: "Standaardomschrijving", type: "text", rows: 3, description: "Voor pagina's zonder eigen omschrijving.", validation: (r) => r.max(170) }),
    defineField({ name: "standaardAfbeelding", title: "Standaard deelafbeelding", type: "image", description: "Liggend, minstens 1200 x 630 pixels.", options: { hotspot: true } }),
    defineField({
      name: "merkOmschrijving",
      title: "Wie is Tante Kleur (voor AI-zoekmachines)",
      type: "text",
      rows: 5,
      description: "Een feitelijke beschrijving van het bedrijf en het product in 2 tot 4 zinnen. ChatGPT, Perplexity en Google AI gebruiken dit om Tante Kleur te beschrijven. {prijs}, {kleurplaten} en {levertijd} worden ingevuld.",
    }),
    defineField({ name: "socialeMedia", title: "Sociale media", type: "array", of: [defineArrayMember({ type: "url" })], description: "Volledige links naar Instagram, TikTok, Pinterest enzovoort." }),
    knopVeld("headerKnop", "Bestelknop in de menubalk"),
    knopVeld("footerKnop", "Bestelknop in de footer"),
  ],
  preview: { prepare: () => ({ title: "Instellingen: SEO en merk" }) },
});

// ---------- Lijsten ----------

const vraag = defineType({
  name: "vraag",
  title: "Veelgestelde vraag",
  type: "document",
  icon: HelpCircleIcon,
  fields: [
    defineField({ name: "vraag", title: "Vraag", type: "string", validation: (r) => r.required().max(120) }),
    defineField({ name: "antwoord", title: "Antwoord", type: "text", rows: 4, description: "{prijs}, {verzendkosten}, {kleurplaten}, {levertijd} en {deadlines} worden automatisch ingevuld.", validation: (r) => r.required() }),
    defineField({
      name: "thema",
      title: "Thema",
      type: "string",
      description: "Onder welk kopje de vraag op de pagina Vragen staat.",
      options: {
        list: [
          { title: "Het boek", value: "boek" },
          { title: "Foto's en tekenen", value: "fotos" },
          { title: "Privacy", value: "privacy" },
          { title: "Bestellen en betalen", value: "bestellen" },
          { title: "Levering en retour", value: "levering" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: "opHomepage", title: "Ook op de homepage tonen", type: "boolean", initialValue: false }),
    defineField({ name: "volgorde", title: "Volgorde", type: "number", description: "Laag getal staat bovenaan.", initialValue: 10 }),
  ],
  orderings: [{ title: "Volgorde", name: "volgorde", by: [{ field: "volgorde", direction: "asc" }] }],
  preview: { select: { title: "vraag", thema: "thema", home: "opHomepage" }, prepare: ({ title, thema, home }) => ({ title, subtitle: [thema, home ? "op homepage" : null].filter(Boolean).join(" · ") }) },
});

const voorbeeld = defineType({
  name: "voorbeeld",
  title: "Voorbeeld (foto en kleurplaat)",
  type: "document",
  icon: ImageIcon,
  fields: [
    defineField({ name: "titel", title: "Titel", type: "string", description: 'Alleen voor jezelf, bijvoorbeeld "Weekend Berlijn".', validation: (r) => r.required() }),
    defineField({
      name: "foto",
      title: "Originele foto",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Beschrijving voor schermlezers", type: "string" })],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "kleurplaat",
      title: "Kleurplaat",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Beschrijving voor schermlezers", type: "string" })],
      validation: (r) => r.required(),
    }),
    defineField({ name: "toestemming", title: "Toestemming van de mensen op de foto", type: "boolean", description: "Alleen voorbeelden met toestemming verschijnen op de site.", initialValue: false }),
    defineField({ name: "volgorde", title: "Volgorde", type: "number", description: "Het voorbeeld met het laagste getal staat op de homepage.", initialValue: 10 }),
  ],
  orderings: [{ title: "Volgorde", name: "volgorde", by: [{ field: "volgorde", direction: "asc" }] }],
  preview: { select: { title: "titel", media: "kleurplaat", toestemming: "toestemming" }, prepare: ({ title, media, toestemming }) => ({ title, media, subtitle: toestemming ? "Op de site" : "Geen toestemming: niet zichtbaar" }) },
});

export const singletons = [
  { type: "homepagina", titel: "Homepagina" },
  { type: "hoeHetWerktPagina", titel: "Zo werkt het" },
  { type: "prijzenPagina", titel: "Prijs" },
  { type: "voorbeeldenPagina", titel: "Voorbeelden" },
  { type: "feestdagenPagina", titel: "Sinterklaas & kerst" },
  { type: "zakelijkPagina", titel: "Zakelijk" },
  { type: "vragenPagina", titel: "Vragen" },
  { type: "overOnsPagina", titel: "Over ons" },
] as const;

export const schemaTypes = [
  kaart,
  knop,
  mijlpaal,
  kenmerk,
  seo,
  homepagina,
  hoeHetWerktPagina,
  prijzenPagina,
  zakelijkPagina,
  feestdagenPagina,
  overOnsPagina,
  vragenPagina,
  voorbeeldenPagina,
  instellingen,
  vraag,
  voorbeeld,
];
