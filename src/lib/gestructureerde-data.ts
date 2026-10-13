// Gestructureerde data (schema.org JSON-LD) voor Google en AI-zoekmachines.
// Bedrijfsgegevens en prijzen komen uit src/config.ts, teksten uit Sanity.

import { site } from "@/config";
import type { Vraag } from "@/content/vragen";

const url = (pad = "") => `${site.url}${pad}`;
const organisatieId = url("/#organisatie");

// "Sportlaan 22B, 5242 CR Rosmalen" → straat, postcode, plaats.
function adres() {
  const [straat, rest = ""] = site.company.address.split(",").map((d) => d.trim());
  const m = rest.match(/^(\d{4}\s?[A-Z]{2})\s+(.+)$/);
  return {
    "@type": "PostalAddress",
    streetAddress: straat,
    postalCode: m?.[1] ?? "",
    addressLocality: m?.[2] ?? rest,
    addressCountry: "NL",
  };
}

export function organisatie({ omschrijving, socialeMedia }: { omschrijving: string; socialeMedia: string[] }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "OnlineStore"],
        "@id": organisatieId,
        name: site.name,
        legalName: site.company.legalName,
        url: url(),
        logo: url("/brand/logo-color.png"),
        image: url("/brand/hero.jpg"),
        description: omschrijving,
        email: site.email,
        address: adres(),
        vatID: site.company.vat,
        identifier: { "@type": "PropertyValue", propertyID: "KvK", value: site.company.kvk },
        areaServed: ["NL", "BE"],
        ...(socialeMedia.length ? { sameAs: socialeMedia } : {}),
      },
      {
        "@type": "WebSite",
        "@id": url("/#website"),
        name: site.name,
        url: url(),
        inLanguage: "nl-NL",
        publisher: { "@id": organisatieId },
      },
    ],
  };
}

export function product({ omschrijving }: { omschrijving: string }) {
  const landen = ["NL", "BE"];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": url("/#kleurboek"),
    name: "Persoonlijk kleurboek van je eigen foto's",
    description: omschrijving,
    brand: { "@type": "Brand", name: site.name },
    image: [url("/brand/hero.jpg"), url("/brand/spread.jpg"), url("/brand/henk-blue.jpg")],
    category: "Kleurboeken",
    additionalProperty: [
      { "@type": "PropertyValue", name: "Formaat", value: "A4, staand" },
      { "@type": "PropertyValue", name: "Kaft", value: "Hardcover met eigen titel" },
      { "@type": "PropertyValue", name: "Aantal kleurplaten", value: site.plates },
    ],
    offers: {
      "@type": "Offer",
      url: url("/prijzen"),
      price: site.price.intro.toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": organisatieId },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: (site.shippingCents / 100).toFixed(2), currency: "EUR" },
        shippingDestination: landen.map((c) => ({ "@type": "DefinedRegion", addressCountry: c })),
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: landen,
        // Op maat gemaakt: geen herroepingsrecht (zie voorwaarden).
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      },
    },
  };
}

export function faqPagina(vragen: Vraag[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: vragen.map((v) => ({
      "@type": "Question",
      name: v.vraag,
      acceptedAnswer: { "@type": "Answer", text: v.antwoord },
    })),
  };
}

export function stappenplan(stappen: { titel: string; tekst: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Zo maak je een kleurboek van je eigen foto's",
    step: stappen.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.titel, text: s.tekst })),
  };
}
