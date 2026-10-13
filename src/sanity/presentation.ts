import { defineDocuments, defineLocations, type PresentationPluginOptions } from "sanity/presentation";

// Welke pagina op de site bij welk document hoort (en andersom), zodat
// Presentation meteen de juiste pagina en het juiste document opent.
const routes = {
  homepagina: { pad: "/", titel: "Homepagina" },
  hoeHetWerktPagina: { pad: "/hoe-het-werkt", titel: "Zo werkt het" },
  prijzenPagina: { pad: "/prijzen", titel: "Prijs" },
  voorbeeldenPagina: { pad: "/voorbeelden", titel: "Voorbeelden" },
  feestdagenPagina: { pad: "/sinterklaas-en-kerst", titel: "Sinterklaas & kerst" },
  zakelijkPagina: { pad: "/zakelijk", titel: "Zakelijk" },
  vragenPagina: { pad: "/vragen", titel: "Vragen" },
  overOnsPagina: { pad: "/over-ons", titel: "Over ons" },
} as const;

const vast = (locaties: { title: string; href: string }[]) =>
  defineLocations({ locations: locaties });

export const resolve: PresentationPluginOptions["resolve"] = {
  mainDocuments: defineDocuments(
    Object.entries(routes).map(([type, r]) => ({ route: r.pad, filter: `_type == "${type}" && _id == "${type}"` })),
  ),
  locations: {
    ...Object.fromEntries(Object.entries(routes).map(([type, r]) => [type, vast([{ title: r.titel, href: r.pad }])])),
    // Het merkverhaal van de homepagina staat ook op Over ons.
    homepagina: vast([
      { title: "Homepagina", href: "/" },
      { title: "Over ons", href: "/over-ons" },
    ]),
    vraag: vast([
      { title: "Vragen", href: "/vragen" },
      { title: "Homepagina (als aangevinkt)", href: "/" },
    ]),
    voorbeeld: vast([
      { title: "Voorbeelden", href: "/voorbeelden" },
      { title: "Homepagina", href: "/" },
    ]),
  },
};
