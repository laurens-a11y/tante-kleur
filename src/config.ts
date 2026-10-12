// Centrale instellingen voor de site. Pas hier aan, niet verspreid in de pagina's.

export const site = {
  name: "Tante Kleur",
  price: { intro: 59, regular: 69 },
  // Stripe Payment Link voor de concierge-MVP. Zet NEXT_PUBLIC_ORDER_URL in Vercel.
  orderUrl: process.env.NEXT_PUBLIC_ORDER_URL || "#prijs",
  // TODO: definitief e-mailadres invullen
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hallo@tantekleur.nl",
  // TODO: levertijd bevestigen na eerste proefdruk bij PrintAPI
  leadTimeDays: "10",
  company: {
    kvk: "42128246",
    vat: "NL869851615B01",
  },
} as const;
