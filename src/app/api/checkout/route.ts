import { NextResponse } from "next/server";
import { site } from "@/config";
import { checkoutConfig, getStripe } from "@/lib/stripe";

// Maakt een Stripe Checkout Session aan en stuurt de klant door naar de
// door Stripe gehoste betaalpagina. Wordt aangeroepen vanuit de
// "Maak mijn boek"-knoppen (formulier met method POST).
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;

  try {
    const stripe = getStripe();

    const prices = await stripe.prices.list({
      lookup_keys: [checkoutConfig.priceLookupKey],
      active: true,
      limit: 1,
    });
    const price = prices.data[0];
    if (!price) {
      throw new Error(`Geen actieve prijs met lookup key ${checkoutConfig.priceLookupKey}`);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Geen payment_method_types: Stripe toont dynamisch iDEAL, Bancontact,
      // kaarten, Apple Pay, enz. op basis van de Dashboard-instellingen.
      line_items: [{ price: price.id, quantity: 1 }],
      locale: "nl",
      customer_creation: "always",
      shipping_address_collection: {
        allowed_countries: [...checkoutConfig.countries],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: "Verzending",
            fixed_amount: { amount: site.shippingCents, currency: "eur" },
            tax_behavior: "inclusive",
          },
        },
      ],
      custom_fields: [
        {
          key: "cover_titel",
          label: { type: "custom", custom: "Titel op de cover" },
          type: "text",
          text: { minimum_length: 1, maximum_length: 40 },
        },
      ],
      // Zakelijke klanten kunnen hun btw-nummer opgeven (verleggingsregeling).
      tax_id_collection: { enabled: true },
      automatic_tax: { enabled: checkoutConfig.automaticTax },
      metadata: { sku: "kleurboek-a4-hardcover" },
      integration_identifier: checkoutConfig.integrationIdentifier,
      success_url: `${origin}/bedankt?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#prijs`,
    });

    if (!session.url) {
      throw new Error("Checkout Session zonder url");
    }
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Checkout aanmaken mislukt:", error instanceof Error ? error.message : error);
    return NextResponse.redirect(`${origin}/?checkout=fout#prijs`, 303);
  }
}
