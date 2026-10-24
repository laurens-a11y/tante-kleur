// De tekenconfiguraties die we vergelijken, gegroepeerd in testrondes.
// Alle configuraties krijgen dezelfde briefing, foto en stijlreferentie.
// Zonder "server-only", zodat de testpagina in de browser de namen kan tonen.

export type TekenActie = "generate" | "edit";
export type TekenKwaliteit = "high" | "xhigh";

export type TekenConfig = {
  id: string;
  naam: string;
  model: string;
  actie: TekenActie;
  /** Eigen formaat; zonder dit staand A4 (1440x2032). */
  formaat?: string;
  /** Zonder dit "high". "xhigh" bestaat alleen bij de 2.5-modellen. */
  kwaliteit?: TekenKwaliteit;
};

const sunburst = "gpt-image-2.5-sunburst-2026-09-08";

export const tekenConfigs: readonly TekenConfig[] = [
  { id: "g2-generate", naam: "gpt-image-2 · opnieuw tekenen", model: "gpt-image-2", actie: "generate" },
  { id: "g2-edit", naam: "gpt-image-2 · foto bewerken", model: "gpt-image-2", actie: "edit" },
  { id: "s25-generate", naam: "Sunburst 2.5 · opnieuw tekenen", model: sunburst, actie: "generate" },
  { id: "s25-edit", naam: "Sunburst 2.5 · foto bewerken", model: sunburst, actie: "edit" },
  // Het beeldmodel van ChatGPT zelf. Kent alleen standaardformaten, dus staand 2:3 in plaats van A4.
  { id: "chatgpt-generate", naam: "chatgpt-image-latest · opnieuw tekenen", model: "chatgpt-image-latest", actie: "generate", formaat: "1024x1536" },
  { id: "s25-edit-xhigh", naam: "Sunburst 2.5 · foto bewerken · xhigh", model: sunburst, actie: "edit", kwaliteit: "xhigh" },
];

export type TestRonde = { nr: number; naam: string; uitleg: string; configIds: readonly string[] };

// Een nieuwe ronde toevoegen = een regel erbij. Platen van eerdere rondes blijven bewaard en zichtbaar.
export const testRondes: readonly TestRonde[] = [
  {
    nr: 1,
    naam: "Ronde 1 · modellen en werkwijze",
    uitleg: "Vijf configuraties naast elkaar: gpt-image-2 en Sunburst 2.5 (opnieuw tekenen en foto bewerken) en chatgpt-image-latest.",
    configIds: ["g2-generate", "g2-edit", "s25-generate", "s25-edit", "chatgpt-generate"],
  },
  {
    nr: 2,
    naam: "Ronde 2 · Sunburst high vs xhigh",
    uitleg: "De winnaar van ronde 1 (Sunburst 2.5 · foto bewerken) op kwaliteit high, tegen dezelfde opzet op xhigh. Zelfde briefing per foto: analyseer niet opnieuw, anders vergelijk je niet eerlijk.",
    configIds: ["s25-edit", "s25-edit-xhigh"],
  },
];

export const laatsteRonde = testRondes[testRondes.length - 1].nr;

export function vindConfig(id: unknown): TekenConfig | null {
  return tekenConfigs.find((c) => c.id === id) ?? null;
}

export function vindRonde(nr: unknown): TestRonde | null {
  const n = typeof nr === "string" ? Number(nr) : nr;
  return testRondes.find((r) => r.nr === n) ?? null;
}

export function configsVoorRonde(ronde: TestRonde): TekenConfig[] {
  return ronde.configIds.map((id) => vindConfig(id)).filter((c): c is TekenConfig => !!c);
}
