"use client";

// Sanity Studio, ingebouwd in de site op /studio (src/app/(studio)).
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { dataset, projectId, studioPad } from "@/sanity/env";
import { schemaTypes } from "@/sanity/schema";
import { singletonTypes, structure } from "@/sanity/structure";
import { resolve } from "@/sanity/presentation";

export default defineConfig({
  name: "default",
  title: "Tante Kleur",
  basePath: studioPad,
  projectId,
  dataset,
  plugins: [
    presentationTool({
      title: "Live bewerken",
      resolve,
      previewUrl: { previewMode: { enable: "/api/draft-mode/enable", disable: "/api/draft-mode/disable" } },
    }),
    structureTool({ structure, title: "Inhoud" }),
  ],
  schema: {
    types: schemaTypes,
    // Pagina's en instellingen niet opnieuw laten aanmaken via "Nieuw document".
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    // Geen dupliceren of verwijderen van pagina's en instellingen.
    actions: (acties, { schemaType }) =>
      singletonTypes.has(schemaType) ? acties.filter(({ action }) => action && ["publish", "discardChanges", "restore", "unpublish"].includes(action)) : acties,
  },
});
