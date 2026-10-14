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
| Content | Sanity, beheer via https://tantekleur.nl/studio (teksten van home, zo werkt het, prijs, zakelijk, Sinterklaas & kerst en over ons; alle veelgestelde vragen; voorbeelden) |
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
| (geen) | `src/config.ts` | Tally-formulier `vG7pM4`, ingebed op `/upload`; krijgt `?order=<session id>` mee als verborgen veld |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Vercel | Contactadres |

Lokaal: `vercel env pull .env.local`.

## Content in Sanity

Teksten staan in Sanity; de standaardteksten in `src/content/paginas.ts` en `src/content/vragen.ts` gelden alleen als een veld leeg is of Sanity onbereikbaar is. In teksten kun je `{prijs}`, `{normalePrijs}`, `{verzendkosten}`, `{kleurplaten}`, `{levertijd}`, `{deadlines}` en `{email}` gebruiken; die worden ingevuld vanuit `src/config.ts`. Prijzen, deadlines, juridische teksten, upload- en bedankpagina blijven bewust in de code.

De Studio draait in deze site op `/studio` (`sanity.config.ts`, schema in `src/sanity/schema`). Het tabblad **Live bewerken** (Presentation) toont de site met klikken-en-bewerken en concepten. Gepubliceerde wijzigingen staan via `<SanityLive />` direct op de site; als vangnet ververst de cache uiterlijk na 10 minuten (`cacheLife` in `next.config.ts`).

- Pagina's ophalen gaat via `MetOpties` (`src/sanity/MetOpties.tsx`): gewoon bezoek krijgt gepubliceerde, statisch gecachete content; in draft mode concepten met stega.
- Draft mode: `/api/draft-mode/enable` (aangeroepen door de Studio) en `/api/draft-mode/disable`. Vereist `SANITY_API_READ_TOKEN` met Viewer-rechten.
- CORS in Sanity: `https://tantekleur.nl`, `https://tante-kleur.vercel.app`, `https://*-getflipd.vercel.app`, localhost 3000/3333.
- Knoppen: elk knopveld (type `knop`) heeft tekst, merkkleur en stijl (primair = gevuld, secundair = omrand). De link staat in de code; tekst- en hoverkleur volgen uit de merkkleur (`src/content/knoppen.ts`, `src/components/merkkleur.ts`). De bestelknop in header en footer staat bij Instellingen.
- Kaarten en stappen hebben een optionele achtergrondkleur; leeg = de vaste afwisseling van de pagina. Tijdlijnen hebben een icoon per stap.
- Er is één Studio: `/studio` op de site. Het schema staat alleen in de code; Sanity neemt het automatisch over zodra de Studio na een deploy wordt geopend. De losse Studio op tantekleur.sanity.studio is opgeheven (oktober 2026). In Sanity staat nog een oud MCP-schema voor de workspace `default`; dat is niet leidend, lees het actuele schema via de Studio-deployment (`list_workspace_schemas`, applicatie `pieh7bfn30zaqthfbbkixinb`).

## SEO en GEO

- Elke pagina heeft in Sanity een blok "Zoekmachines en delen" (meta title, meta description, deelafbeelding, niet indexeren). Leeg = standaard uit `src/content/paginas.ts` (`paginaMeta`).
- "Instellingen: SEO en merk" in Sanity: standaardomschrijving, standaard deelafbeelding, merkomschrijving voor AI-zoekmachines en sociale-medialinks.
- Canonical-links wijzen altijd naar `site.url` (`src/config.ts`), ook op `*.vercel.app`.
- JSON-LD: Organization/OnlineStore en WebSite (layout), Product met Offer, verzending en retourbeleid (home, prijs), HowTo (home, zo werkt het), FAQPage (vragen). Zie `src/lib/gestructureerde-data.ts`.
- `/robots.txt` laat zoekmachines en AI-crawlers toe, behalve op `/api`, `/bedankt` en `/upload`. `/sitemap.xml` neemt de laatste wijzigingsdatum uit Sanity over.
- `/llms.txt`: feitelijke samenvatting in Markdown voor AI-assistenten, opgebouwd uit Sanity en `src/config.ts`.

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

## Content beheren (Sanity)

- Studio: https://tantekleur.nl/studio (schema in `src/sanity/schema`).
- Typen: één document per pagina (`homepagina`, `hoeHetWerktPagina`, `prijzenPagina` enz.), `instellingen`, `vraag` (vraag, antwoord, thema, volgorde) en `voorbeeld` (foto, kleurplaat, toestemming, volgorde).
- De homepage haalt content op via `src/sanity/content.ts` (`use cache`, ververst elke minuut). Zonder Sanity-content valt de site terug op de standaardteksten.
- Alleen voorbeelden met `toestemming = true` verschijnen op de site.
