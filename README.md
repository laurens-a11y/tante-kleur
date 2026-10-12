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
| Betaling | Stripe (MVP: Payment Link via `NEXT_PUBLIC_ORDER_URL`) |
| Drukwerk | PrintAPI (MVP: handmatig bestellen) |
| Later | Supabase (EU) voor orders en privé foto-opslag, jobrunner voor AI-generatie |

## Omgevingsvariabelen

| Naam | Waar | Toelichting |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Vercel | Staat al ingesteld |
| `NEXT_PUBLIC_SANITY_DATASET` | Vercel | `production` |
| `SANITY_API_READ_TOKEN` / `SANITY_API_WRITE_TOKEN` | Vercel | Versleuteld, alleen server-side gebruiken |
| `NEXT_PUBLIC_ORDER_URL` | Vercel | Stripe Payment Link voor de bestelknop |
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
