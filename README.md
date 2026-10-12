# Tante Kleur

Website en platform voor Tante Kleur: gepersonaliseerde kleurboeken van je eigen foto's.

## Lokaal draaien

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Stack

| Onderdeel | Keuze |
|---|---|
| Voorkant + API-routes | Next.js (App Router) op Vercel, functies in `fra1` |
| Content | Sanity (alleen marketingcontent: FAQ, voorbeelden, pagina's) |
| Betaling | Stripe Checkout (hosted) via `/api/checkout`, webhook op `/api/stripe/webhook` |
| Drukwerk | PrintAPI (MVP: handmatig bestellen) |
| Later | Supabase (EU) voor orders en privé foto-opslag, jobrunner voor AI-generatie |

## Omgevingsvariabelen

| Naam | Waar | Toelichting |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Vercel | Staat al ingesteld |
| `NEXT_PUBLIC_SANITY_DATASET` | Vercel | `production` |
| `SANITY_API_READ_TOKEN` / `SANITY_API_WRITE_TOKEN` | Vercel | Versleuteld, alleen server-side gebruiken |
| `STRIPE_SECRET_KEY` | Vercel (sensitive) | Restricted key (`rk_`): Checkout Sessions schrijven, Prices lezen |
| `STRIPE_WEBHOOK_SECRET` | Vercel (sensitive) | Staat ingesteld (sandbox-endpoint) |
| `STRIPE_PRICE_LOOKUP_KEY` | Vercel | `kleurboek_a4` |
| `STRIPE_AUTOMATIC_TAX` | Vercel | Pas `true` na actieve btw-registratie in Stripe Tax |
| `NEXT_PUBLIC_UPLOAD_URL` | Vercel | Uploadformulier; krijgt `?order=<session id>` mee |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Vercel | Contactadres |

Lokaal: `vercel env pull .env.local`.

## Instellingen

Prijs, levertijd, contactgegevens en bedrijfsgegevens staan centraal in `src/config.ts`.

## Merk

- Kleuren: zie `src/app/globals.css` (blauw `#002CD4`, rood `#F73D11`, roze `#F4B3C1`, lichtblauw `#C1DCE6`, geel `#F3B500`).
- Fonts: Fraunces en Archivo zijn tijdelijke vervangers voor Swear Display en Widescreen. Vervangen door `next/font/local` zodra de webfontlicenties er zijn.
- Beelden: `public/brand/`.

## Privacy

Klantfoto's worden direct verwijderd zodra een order naar de drukker gaat. Klantfoto's nooit in Sanity of in een publieke bucket opslaan.

## Bestelflow

1. "Maak mijn boek" → `POST /api/checkout` → Stripe Checkout (iDEAL, Bancontact, kaart, wallets; verzendadres NL/BE; covertitel; optioneel btw-nummer).
2. Na betaling → `/bedankt` met link naar het uploadformulier.
3. Orderverwerking gebeurt in de webhook (`checkout.session.completed` / `async_payment_succeeded`), niet op de bedankpagina.

Lokaal webhooks testen: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
