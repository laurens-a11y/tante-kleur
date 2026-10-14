// Standaardteksten per pagina. De echte teksten komen uit Sanity
// (Studio op /studio); deze waarden gelden alleen als een veld
// daar leeg is of Sanity even niet bereikbaar is.
//
// Placeholders als {prijs} en {levertijd} worden ingevuld vanuit src/config.ts,
// zie vulIn() in src/sanity/content.ts.

import type { IconName } from "@/components/Icon";
import { knop, type Merkkleur } from "./knoppen";

export type Kaart = { _key?: string; icoon: IconName; titel: string; tekst: string; achtergrond?: Merkkleur };
export type Mijlpaal = { _key?: string; icoon: IconName; titel: string; tekst: string };
export type Kenmerk = { _key?: string; label: string; waarde: string };
// Foto: uit Sanity (omgezet naar een URL in src/sanity/content.ts) of een standaardfoto uit public/.
export type Beeld = { src: string; alt: string };

const covers: Beeld[] = [
  { src: "/brand/henk-blue.jpg", alt: "Blauw kleurboek met de titel Henk & Ingrid" },
  { src: "/brand/spanje-desk.jpg", alt: "Lichtblauw kleurboek Spanje 2025 op een houten tafel" },
  { src: "/brand/berlijn-hold.jpg", alt: "Roze kleurboek Weekend Berlijn met een lijntekening op de cover" },
  { src: "/brand/henk-orange.jpg", alt: "Oranje kleurboek Henk & Ingrid tussen kleurpotloden" },
  { src: "/brand/spanje-yellow.jpg", alt: "Geel kleurboek Spanje 2025 onder de arm" },
];
const fotoBoeken: Beeld = { src: "/brand/hero.jpg", alt: "Drie Tante Kleur-kleurboeken op een zonnige tafel" };
const fotoSpread: Beeld = {
  src: "/brand/spread.jpg",
  alt: "Opengeslagen Tante Kleur-kleurboek met een tekstpagina 'Weekend Berlijn' en een kleurplaat van twee vriendinnen",
};
const fotosKerst: Beeld[] = [
  { src: "/brand/xmas-duo.jpg", alt: "Twee Tante Kleur-boeken in kerstsfeer" },
  { src: "/brand/wrapped.jpg", alt: "Boek ingepakt in Tante Kleur-cadeaupapier" },
];

export const homepagina = {
  heroLabel: "Gepersonaliseerde kleurboeken",
  heroKop: "Je mooiste momenten, om in te kleuren.",
  heroIntro:
    "Jij en je lief in Spanje, je jaarlijkse vriendenweekend of het eerste jaar van je kleintje. Tante Kleur tovert jouw foto's om tot kleurplaten, in een boek dat net zo bijzonder is als wat erin staat.",
  heroKenmerken: ["Hardcover A4", "Jouw foto's, jouw titel", "Eerst een proef, dan pas drukken"],
  heroKnop: knop("Maak mijn boek", "geel"),
  heroKnopVoorbeelden: knop("Bekijk voorbeelden", "blauw", "secundair"),
  heroAfbeelding: fotoSpread,
  verhaalVraag: "Ze staan allemaal ergens in je camerarol. En daar blijven ze ook, toch?",
  verhaalAntwoord: "Niet als het aan Tante Kleur ligt.",
  verhaalTekst:
    "Ze houdt van mooie dingen, van mensen en van kleur. En ze vindt dat jouw foto's wel wat meer verdienen. Dus maakt ze er een kleurboek van, met jouw mensen, jouw plekken en jouw verhalen. Aan jou om je herinneringen een kleurtje te geven. Binnen de lijntjes of er lekker buiten. Tante vindt alles goed.",
  stappenLabel: "Zo werkt het",
  stappenKop: "Laat het maar aan Tante over.",
  stappen: [
    { icoon: "uploaden", titel: "Kies je foto's", tekst: "Upload {kleurplaten} foto's van de mensen, dieren en plekken die je dierbaar zijn, en bedenk een titel voor de cover." },
    { icoon: "favoriet", titel: "Tante tekent", tekst: "Elke foto wordt een kleurplaat. Je krijgt eerst een digitale proef en mag platen laten aanpassen, verwisselen of weglaten." },
    { icoon: "boek", titel: "Jij kleurt", tekst: "Na je akkoord drukken we jouw boek. Binnen {levertijd} werkdagen ligt het bij je op de mat, klaar om te pronken op de koffietafel." },
  ] as Kaart[],
  voorbeeldLabel: "Van camerarol naar kleurplaat",
  voorbeeldKop: "Jouw mensen, jouw plekken, jouw verhaal.",
  voorbeeldTekst:
    "Geen standaard plaatjes, maar je eigen herinneringen. Fijne, rustige lijnen die herkenbaar blijven, met genoeg detail om er een avond lekker in te verdwalen.",
  coverLabel: "Jouw titel op de cover",
  coverKop: "Henk & Ingrid. Spanje 2025. Weekend Berlijn.",
  coverTekst: "Kies een kleur, zet er je eigen titel op en Tante doet de rest.",
  covers,
  prijsLabel: "Het boek",
  prijsKop: "Jouw kleurboek",
  prijsTekst: "Introductieprijs, daarna {normalePrijs}. Verzending NL en BE: {verzendkosten}",
  prijsAfbeelding: fotoBoeken,
  prijsKenmerken: [
    "{kleurplaten} kleurplaten van jouw eigen foto's",
    "Stevige hardcover op A4-formaat",
    "Je eigen titel en kleur op de cover",
    "Eerst een digitale proef, pas daarna drukken",
  ],
  prijsKnop: knop("Maak mijn boek"),
  cadeauLabel: "Voor jezelf of iemand dierbaars",
  cadeauKop: "Het liefste cadeau dat je zelf hebt gemaakt.",
  cadeauTekst:
    "Voor je moeder, je beste vriendin of opa en oma met al hun kleinkinderen. Een herinnering die je samen kleurt, en die daarna gewoon in de kast blijft staan.",
  cadeauKnop: knop("Op tijd voor Sinterklaas en kerst", "roze"),
  cadeauAfbeeldingen: fotosKerst,
  zakelijkLabel: "Zakelijk",
  zakelijkKop: "Een relatiegeschenk dat niemand weggeeft.",
  zakelijkTekst: "Voor teamuitjes, jubilea, onboarding of de kerstattentie. Iedere medewerker krijgt een eigen, persoonlijk boek.",
  zakelijkKnop: knop("Bekijk zakelijke mogelijkheden"),
  vragenLabel: "Vragen",
  vragenKop: "Tante legt het even uit.",
  vragenKnop: knop("Alle vragen", "blauw", "secundair"),
};

export const hoeHetWerktPagina = {
  label: "Zo werkt het",
  kop: "Laat het maar aan Tante over.",
  intro: "Je hebt geen ontwerpervaring nodig. Alleen foto's waar je blij van wordt.",
  stappenKop: "In vier stappen",
  stappen: [
    { icoon: "winkelmandje", titel: "Bestel je boek", tekst: "Klik op Maak mijn boek, reken af en bedenk een titel voor de cover." },
    { icoon: "uploaden", titel: "Stuur je foto's", tekst: "Na het afrekenen upload je {kleurplaten} foto's van de mensen, dieren en plekken die je dierbaar zijn." },
    { icoon: "zoeken", titel: "Bekijk je proef", tekst: "Binnen een paar dagen krijg je een digitale proef. Je mag platen laten aanpassen, verwisselen of weglaten." },
    { icoon: "boek", titel: "Jij kleurt", tekst: "Na je akkoord drukken we jouw boek. Binnen {levertijd} werkdagen ligt het bij je op de mat." },
  ] as Kaart[],
  tekenenLabel: "Hoe Tante tekent",
  tekenenKop: "Met hulp van AI, met het oog van Tante.",
  tekenenTekst:
    "Tante maakt de kleurplaten met hulp van AI. Daarna bekijkt ze elke plaat: zijn de gezichten herkenbaar, zijn de lijnen rustig genoeg om in te kleuren? Pas dan krijg jij de proef. En pas na jouw akkoord gaat het boek naar de drukker.",
  fototipsLabel: "Fototips",
  fototipsKop: "Welke foto's werken het best?",
  werktGoedTitel: "Werkt goed",
  werktGoed: [
    "Scherpe foto's met genoeg licht; een gewone telefoonfoto is prima",
    "Gezichten goed in beeld, van voren of iets gedraaid",
    "Een tot vier personen of dieren op de foto",
    "Vakantie, huisdieren, portretten, een dag uit",
  ],
  werktMinderTitel: "Werkt minder goed",
  werktMinder: [
    "Donkere foto's, avondfoto's of fel tegenlicht",
    "Grote groepsfoto's",
    "Wazige of bewogen foto's",
    "Tekst in beeld, zoals op een shirt of bord",
  ],
  tijdlijnKop: "Wanneer heb je je boek?",
  tijdlijnAchtergrond: "geel" as Merkkleur,
  tijdlijn: [
    { icoon: "kopen", titel: "Bestellen", tekst: "Afrekenen en covertitel kiezen" },
    { icoon: "uploaden", titel: "Uploaden", tekst: "Jij stuurt je foto's" },
    { icoon: "boek", titel: "Proef", tekst: "Binnen een paar dagen in je mail" },
    { icoon: "verzending", titel: "Drukken en bezorgen", tekst: "Binnen {levertijd} werkdagen na je akkoord" },
  ] as Mijlpaal[],
  privacyKop: "Je foto's zijn bij Tante veilig",
  privacyPunten: [
    "We gebruiken je foto's alleen om jouw boek te maken.",
    "Zodra je boek naar de drukker gaat, verwijderen we ze direct.",
    "Je foto's worden niet gebruikt om AI te trainen.",
  ],
  knop: knop("Maak mijn boek"),
};

export const prijzenPagina = {
  label: "Prijs",
  kop: "Eén boek, helemaal van jou.",
  intro: "Alle prijzen zijn inclusief btw.",
  prijsLabel: "Het kleurboek",
  prijsTekst: "Introductieprijs, daarna {normalePrijs}. Verzending NL en BE: {verzendkosten}.",
  afbeelding: fotoBoeken,
  kenmerken: [
    { label: "Kleurplaten", waarde: "{kleurplaten}, van jouw eigen foto's" },
    { label: "Formaat", waarde: "A4, staand" },
    { label: "Kaft", waarde: "Stevige hardcover met je eigen titel en kleur" },
    { label: "Proef", waarde: "Eerst digitaal bekijken, pas daarna drukken" },
  ] as Kenmerk[],
  knop: knop("Maak mijn boek"),
  verzendingKop: "Verzending en levertijd",
  verzendingPunten: [
    "We bezorgen in Nederland en België voor {verzendkosten} per boek.",
    "Na je akkoord op de proef ligt je boek binnen {levertijd} werkdagen bij je thuis.",
  ],
  zakelijkKop: "Meer dan tien boeken?",
  zakelijkTekst: "Voor je team, een jubileum of als relatiegeschenk maken we graag een voorstel.",
  zakelijkKnop: knop("Bekijk zakelijk"),
  weetjesKop: "Goed om te weten",
  weetjes: [
    { icoon: "akkoord", titel: "Hoe kan ik betalen?", tekst: "Via Stripe, met de betaalmethoden die je bij het afrekenen ziet. Je betaalgegevens komen niet bij ons terecht." },
    { icoon: "akkoord", titel: "Kan ik mijn boek retourneren?", tekst: "Omdat elk boek speciaal voor jou wordt gemaakt, geldt het herroepingsrecht niet. Gaat er iets mis bij het drukken of de bezorging, dan lossen we het op." },
  ] as Kaart[],
  vragenKnop: knop("Alle vragen", "blauw", "secundair"),
};

export const zakelijkPagina = {
  label: "Zakelijk",
  kop: "Een eindejaarscadeau dat over jullie gaat.",
  intro: "Een relatiegeschenk dat niemand weggeeft: een kleurboek met jullie eigen mensen, plekken en momenten.",
  heroKnop: knop("Vraag een offerte aan"),
  heroAfbeelding: fotoBoeken,
  gelegenhedenKop: "Waarvoor?",
  gelegenheden: [
    { icoon: "cadeau", titel: "Eindejaarsgeschenk", tekst: "Een jaaroverzicht om in te kleuren, in plaats van een kerstpakket dat na twee weken op is." },
    { icoon: "favoriet", titel: "Jubileum", tekst: "Tien, vijfentwintig of veertig jaar in dienst: de mooiste momenten in één boek." },
    { icoon: "hartje", titel: "Afscheid", tekst: "Een herinnering aan de collega's en momenten waar iemand jaren deel van was." },
    { icoon: "label", titel: "Relatiegeschenk", tekst: "Voor klanten en partners: jullie gezamenlijke projecten en mijlpalen." },
  ] as Kaart[],
  mogelijkhedenKop: "Twee mogelijkheden",
  mogelijkheden: [
    { icoon: "boek", titel: "Eén teamboek", tekst: "Iedereen krijgt hetzelfde boek met de mooiste momenten van het team of het jaar. Ideaal als jaaroverzicht." },
    { icoon: "account", titel: "Een eigen boek per persoon", tekst: "Elke medewerker of relatie krijgt een boek met eigen foto's. Persoonlijker kan het niet." },
  ] as Kaart[],
  stappenKop: "Zo werkt het",
  stappen: [
    "Je vraagt een offerte aan en we bespreken wat je wilt",
    "Jullie leveren de foto's aan",
    "Je krijgt een digitale proef ter goedkeuring",
    "We drukken en leveren op één adres of per medewerker",
  ],
  stappenIconen: ["chat", "uploaden", "akkoord", "cadeau"] as IconName[],
  kerstTekst: "Voor kerst? Vraag je offerte zo vroeg mogelijk aan; we plannen terug vanaf je leverdatum.",
  offerteLabel: "Offerte",
  offerteKop: "Vertel ons wat je zoekt.",
  offerteTekst: "Je krijgt een voorstel met prijs per boek en planning. Prijzen voor zakelijke klanten zijn exclusief btw.",
  offerteKnop: knop("Offerte aanvragen"),
};

export const feestdagenPagina = {
  label: "Sinterklaas & kerst",
  kop: "Het persoonlijkste cadeau in de schoen of onder de boom.",
  intro: "Geen cadeaubon of sokken, maar een kleurboek vol eigen herinneringen. Met een eigen titel op de cover.",
  heroKnop: knop("Maak mijn boek"),
  heroAfbeeldingen: fotosKerst,
  deadlineLabel: "Op tijd bestellen",
  deadlineKop: "Bestel uiterlijk",
  deadlineTekst: "Dan is er tijd voor het uploaden van je foto's, de proef en het drukken.",
  ideeenKop: "Voor wie?",
  ideeen: [
    { icoon: "hartje", titel: "Voor opa en oma", tekst: "Alle kleinkinderen in één boek. Om samen in te kleuren als ze op bezoek komen." },
    { icoon: "cadeau", titel: "Van de kinderen", tekst: "Voor papa of mama: de mooiste momenten van het jaar, door de kinderen zelf gekozen." },
    { icoon: "boek", titel: "Het jaar van het gezin", tekst: "Vakantie, verjaardagen en die ene zondagmiddag. Een jaaroverzicht om in te kleuren." },
    { icoon: "favoriet", titel: "Voor de vriendinnen", tekst: "Het weekendje weg, de festivals, de eindeloze etentjes. Elk een eigen boek." },
  ] as Kaart[],
  tipLabel: "Tip voor Sinterklaas",
  tipKop: "Laat de titel alvast iets verklappen.",
  tipTekst:
    "Een titel als “Opa & zijn kleine kleurders” of “Ons jaar 2026” maakt het gedicht nog leuker. Meerdere boeken bestellen, voor beide opa's en oma's? Dat kan gewoon.",
  prijsTekst: "Introductieprijs, daarna {normalePrijs}. Inclusief btw, exclusief verzending.",
  prijsKnop: knop("Maak mijn boek"),
};

export const overOnsPagina = {
  label: "Over Tante Kleur",
  afbeelding: { src: "/brand/spread.jpg", alt: "Opengeslagen Tante Kleur-kleurboek met een kleurplaat van twee vriendinnen" } as Beeld,
  waardenKop: "Waar Tante voor staat",
  waarden: [
    { icoon: "boek", titel: "Een boek om te bewaren", tekst: "Stevige hardcover, eigen titel, rustige lijnen. Geen printje, maar iets voor in de kast." },
    { icoon: "uitgelicht", titel: "Eerlijk over AI", tekst: "Tante tekent met hulp van AI en kijkt elke plaat na. Jij ziet altijd eerst een proef." },
    { icoon: "hartje", titel: "Zorgvuldig met je foto's", tekst: "Alleen voor jouw boek, en direct verwijderd zodra het naar de drukker gaat." },
  ] as Kaart[],
  contactLabel: "Contact",
  contactKop: "Vraagje voor Tante?",
  contactTekst: "Mail naar {email}. Heb je al besteld? Zet dan je ordernummer of de naam op je bestelling in de mail.",
};

export const vragenPagina = {
  label: "Vragen",
  kop: "Tante legt het even uit.",
  intro: "Staat je vraag er niet bij? Mail Tante via {email}.",
};

export const voorbeeldenPagina = {
  label: "Voorbeelden",
  kop: "Van camerarol naar kleurplaat.",
  intro: "Alles hieronder is gemaakt van gewone foto's, zoals ze op je telefoon staan.",
  galerijKop: "De foto en de kleurplaat",
  coverLabel: "Het boek",
  coverKop: "Jouw titel, jouw kleur.",
  coverTekst: "Henk & Ingrid, Spanje 2025, Weekend Berlijn: elk boek krijgt een eigen titel op een stevige hardcover.",
  covers,
  minderKop: "Wat minder goed werkt",
  minderTekst:
    "Grote groepsfoto's, donkere foto's en tekst die in beeld staat (op een shirt of bord) maken het lastiger. Tante legt uit welke foto's het mooist uitpakken.",
  knop: knop("Maak mijn boek"),
  fototipsKnop: knop("Bekijk de fototips", "blauw", "secundair"),
};

export const paginas = { homepagina, hoeHetWerktPagina, prijzenPagina, zakelijkPagina, feestdagenPagina, overOnsPagina, vragenPagina, voorbeeldenPagina };
export type PaginaType = keyof typeof paginas;

// Standaard-SEO per pagina: geldt als de velden onder "Zoekmachines en delen" in Sanity leeg zijn.
export const paginaMeta: Record<PaginaType, { pad: string; titel: string; omschrijving: string }> = {
  homepagina: {
    pad: "/",
    titel: "Tante Kleur – Gepersonaliseerde kleurboeken van je eigen foto's",
    omschrijving: "Tante Kleur tovert je mooiste foto's om tot kleurplaten, in een stevig hardcover kleurboek met je eigen titel. Voor jezelf of als cadeau.",
  },
  hoeHetWerktPagina: {
    pad: "/hoe-het-werkt",
    titel: "Zo werkt het – Tante Kleur",
    omschrijving: "Van bestellen tot kleuren: hoe Tante Kleur van jouw foto's een kleurboek maakt, en welke foto's het mooist uitpakken.",
  },
  prijzenPagina: {
    pad: "/prijzen",
    titel: "Prijs – Tante Kleur",
    omschrijving: "Jouw persoonlijke hardcover kleurboek voor {prijs} (introductieprijs). Inclusief btw, verzending in Nederland en België.",
  },
  zakelijkPagina: {
    pad: "/zakelijk",
    titel: "Zakelijk: een eindejaarscadeau dat over jullie gaat – Tante Kleur",
    omschrijving: "Persoonlijke kleurboeken als kerst- of eindejaarsgeschenk, voor jubilea, onboarding of als relatiegeschenk. Vraag een offerte aan.",
  },
  feestdagenPagina: {
    pad: "/sinterklaas-en-kerst",
    titel: "Persoonlijk Sinterklaas- en kerstcadeau: een kleurboek van je eigen foto's – Tante Kleur",
    omschrijving: "Het persoonlijkste cadeau in de schoen of onder de boom. Bestel op tijd: {deadlines}.",
  },
  overOnsPagina: {
    pad: "/over-ons",
    titel: "Over Tante Kleur & contact",
    omschrijving: "Wie Tante Kleur is, waar ze voor staat en hoe je contact opneemt.",
  },
  vragenPagina: {
    pad: "/vragen",
    titel: "Veelgestelde vragen – Tante Kleur",
    omschrijving: "Antwoorden over het boek, je foto's, privacy, bestellen, levertijd en retour.",
  },
  voorbeeldenPagina: {
    pad: "/voorbeelden",
    titel: "Voorbeelden: van foto naar kleurplaat – Tante Kleur",
    omschrijving: "Bekijk hoe gewone telefoonfoto's veranderen in kleurplaten, en hoe het boek eruitziet met je eigen titel op de cover.",
  },
};

export const instellingen = {
  standaardOmschrijving: paginaMeta.homepagina.omschrijving,
  merkOmschrijving:
    "Tante Kleur maakt gepersonaliseerde kleurboeken van je eigen foto's. Elke foto wordt met hulp van AI omgezet in een kleurplaat en daarna door een mens gecontroleerd; je krijgt altijd eerst een digitale proef. Het boek is een stevige A4-hardcover met {kleurplaten} kleurplaten en een eigen titel op de cover, voor {prijs} inclusief btw. Tante Kleur bezorgt in Nederland en België.",
  socialeMedia: [] as string[],
  headerKnop: knop("Maak mijn boek"),
  footerSlogan: "Kleur met Tante Kleur.",
  footerKnop: knop("Maak mijn boek", "roze"),
  footerBetalen: "Veilig betalen via Stripe",
};
