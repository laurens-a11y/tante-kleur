import type { StructureResolver } from "sanity/structure";
import { CogIcon } from "@sanity/icons/Cog";
import { singletons } from "./schema";

const singletonTypes = new Set<string>([...singletons.map((s) => s.type), "instellingen"]);

// Pagina's zijn singletons: één document per pagina, met een vast ID gelijk aan het type.
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Tante Kleur")
    .items([
      S.listItem()
        .title("Pagina's")
        .child(
          S.list()
            .title("Pagina's")
            .items(
              singletons.map((s) =>
                S.listItem()
                  .title(s.titel)
                  .schemaType(s.type)
                  .child(S.document().schemaType(s.type).documentId(s.type).title(s.titel)),
              ),
            ),
        ),
      S.documentTypeListItem("vraag").title("Veelgestelde vragen"),
      S.documentTypeListItem("voorbeeld").title("Voorbeelden (foto en kleurplaat)"),
      S.divider(),
      S.listItem()
        .title("Instellingen: SEO en merk")
        .icon(CogIcon)
        .child(S.document().schemaType("instellingen").documentId("instellingen").title("Instellingen: SEO en merk")),
      ...S.documentTypeListItems().filter((item) => {
        const id = item.getId();
        return !!id && !singletonTypes.has(id) && id !== "vraag" && id !== "voorbeeld";
      }),
    ]);

export { singletonTypes };
