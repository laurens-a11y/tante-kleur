import type { MetadataRoute } from "next";
import { site } from "@/config";
import { paginaMeta, type PaginaType } from "@/content/paginas";
import { getBijgewerkt } from "@/sanity/content";

// Pagina's met "Niet tonen in zoekmachines" aan in Sanity vallen eruit.
// Laatste wijziging komt uit Sanity, zodat zoekmachines weten wat nieuw is.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { paginas, vragen, voorbeelden } = await getBijgewerkt();
  const perType = new Map(paginas.map((p) => [p._type, p]));

  const prioriteit: Partial<Record<PaginaType, number>> = { homepagina: 1, prijzenPagina: 0.9, feestdagenPagina: 0.9, voorbeeldenPagina: 0.8 };
  const extra: Partial<Record<PaginaType, string | null>> = { vragenPagina: vragen, voorbeeldenPagina: voorbeelden };

  const marketing = (Object.keys(paginaMeta) as PaginaType[])
    .filter((type) => !perType.get(type)?.verborgen)
    .map((type) => {
      const datums = [perType.get(type)?._updatedAt, extra[type]].filter((d): d is string => !!d).sort();
      return {
        url: `${site.url}${paginaMeta[type].pad === "/" ? "" : paginaMeta[type].pad}`,
        lastModified: datums.at(-1),
        priority: prioriteit[type] ?? 0.7,
      };
    });

  return [
    ...marketing,
    { url: `${site.url}/privacy`, priority: 0.2 },
    { url: `${site.url}/voorwaarden`, priority: 0.2 },
  ];
}
