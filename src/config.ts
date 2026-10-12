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
    kvk: "42128246",
    vat: "NL869851615B01",
  },
} as const;
