// Knoppen die in Sanity instelbaar zijn: tekst, merkkleur en stijl.
// De link staat bewust in de code (bestelknoppen gaan altijd via Stripe).

export const merkkleuren = [
  // contrast: tekstkleur op een gevulde knop in deze kleur, zodat het altijd leesbaar is.
  // hover/hoverContrast: achtergrond en tekst als je over een gevulde knop beweegt.
  { title: "Blauw", value: "blauw", contrast: "wit", hover: "rood", hoverContrast: "wit" },
  { title: "Rood", value: "rood", contrast: "wit", hover: "blauw", hoverContrast: "wit" },
  { title: "Roze", value: "roze", contrast: "blauw", hover: "wit", hoverContrast: "blauw" },
  { title: "Lichtblauw", value: "lichtblauw", contrast: "blauw", hover: "wit", hoverContrast: "blauw" },
  { title: "Geel", value: "geel", contrast: "blauw", hover: "blauw", hoverContrast: "wit" },
  { title: "Wit", value: "wit", contrast: "blauw", hover: "lichtblauw", hoverContrast: "blauw" },
] as const;

export type Merkkleur = (typeof merkkleuren)[number]["value"];

export const knopStijlen = [
  { title: "Primair (gevuld)", value: "primair" },
  { title: "Secundair (omrand)", value: "secundair" },
] as const;

export type KnopStijl = (typeof knopStijlen)[number]["value"];

export type Knop = { tekst: string; kleur: Merkkleur; stijl: KnopStijl };

export const knop = (tekst: string, kleur: Merkkleur = "blauw", stijl: KnopStijl = "primair"): Knop => ({ tekst, kleur, stijl });
