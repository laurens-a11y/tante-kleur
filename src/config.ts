// Centrale instellingen voor de site. Pas hier aan, niet verspreid in de pagina's.

export const site = {
  name: "Tante Kleur",
  price: { intro: 59, regular: 69 },
  // Verzendkosten per boek, incl. btw, in centen (NL en BE).
  shippingCents: 695,
  // Tally-uploadformulier, ingebed op /upload. Krijgt ?order=<checkout session id>
  // mee als verborgen veld "order".
  tallyFormId: "vG7pM4",
  uploadUrl: "/upload",
  // TODO: definitief e-mailadres invullen
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hallo@tantekleur.nl",
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
  // Aantal kleurplaten per boek.
  plates: "20 tot 25",
} as const;
