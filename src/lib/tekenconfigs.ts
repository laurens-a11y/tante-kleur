// De tekenconfiguraties die we vergelijken: twee beeldmodellen × twee werkwijzen.
// Alle configuraties krijgen dezelfde briefing, foto en stijlreferentie.
// Zonder "server-only", zodat de testpagina in de browser de namen kan tonen.

export type TekenActie = "generate" | "edit";

export type TekenConfig = {
  id: string;
  naam: string;
  model: string;
  actie: TekenActie;
};

export const tekenConfigs: readonly TekenConfig[] = [
  { id: "g2-generate", naam: "gpt-image-2 · opnieuw tekenen", model: "gpt-image-2", actie: "generate" },
  { id: "g2-edit", naam: "gpt-image-2 · foto bewerken", model: "gpt-image-2", actie: "edit" },
  { id: "s25-generate", naam: "Sunburst 2.5 · opnieuw tekenen", model: "gpt-image-2.5-sunburst-2026-09-08", actie: "generate" },
  { id: "s25-edit", naam: "Sunburst 2.5 · foto bewerken", model: "gpt-image-2.5-sunburst-2026-09-08", actie: "edit" },
];

export function vindConfig(id: unknown): TekenConfig | null {
  return tekenConfigs.find((c) => c.id === id) ?? null;
}
