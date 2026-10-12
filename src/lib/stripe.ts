import "server-only";
import Stripe from "stripe";

// Lazy client: de sleutel bestaat niet tijdens de build, alleen op runtime.
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY ontbreekt");
    }
    client = new Stripe(key, {
      apiVersion: "2026-08-26.dahlia",
      appInfo: { name: "tante-kleur", url: "https://tantekleur.nl" },
    });
  }
  return client;
}

// Instellingen voor de checkout. Prijs wordt opgezocht via de lookup key,
// zodat een prijswijziging (€59 → €69) in Stripe kan zonder codewijziging.
export const checkoutConfig = {
  priceLookupKey: process.env.STRIPE_PRICE_LOOKUP_KEY || "kleurboek_a4",
  // Alleen aanzetten als er een actieve btw-registratie in Stripe Tax staat,
  // anders rekent Stripe stilletjes €0 btw.
  automaticTax: process.env.STRIPE_AUTOMATIC_TAX === "true",
  countries: ["NL", "BE"] as const,
  // Label om deze checkout-flow te herkennen in het Stripe Dashboard.
  integrationIdentifier: "tantekleur_web_checkout_qhzmrvtk",
};
