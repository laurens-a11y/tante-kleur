import { stegaClean } from "next-sanity";
import { merkkleuren, knopStijlen, type Knop, type Merkkleur } from "@/content/knoppen";
import s from "@/app/(site)/page.module.css";

// className en style voor een knop uit Sanity; werkt op <a>, <Link> en <button>.
// Kleur en stijl worden opgeschoond (stega in draft mode) en gecontroleerd.
export function knopStijl(knop: Knop, extra?: { className?: string; style?: React.CSSProperties }) {
  const kleur = merkkleuren.find((k) => k.value === stegaClean(knop.kleur)) ?? merkkleuren[0];
  const stijl = knopStijlen.find((k) => k.value === stegaClean(knop.stijl))?.value ?? "primair";
  return {
    className: [s.knop, stijl === "secundair" ? s.knopSecundair : s.knopPrimair, extra?.className].filter(Boolean).join(" "),
    style: {
      "--knop-kleur": `var(--${kleur.value})`,
      "--knop-contrast": `var(--${kleur.contrast})`,
      "--knop-hover": `var(--${kleur.hover})`,
      "--knop-hover-contrast": `var(--${kleur.hoverContrast})`,
      ...extra?.style,
    } as React.CSSProperties,
  };
}

// Achtergrond van een blok (kaart, stap) uit Sanity, met leesbare tekst erop.
// Geen of een onbekende kleur? Dan de standaardkleur die de pagina meegeeft.
export function blokStijl(kleur: string | undefined, standaard: Merkkleur) {
  const k = merkkleuren.find((m) => m.value === stegaClean(kleur)) ?? merkkleuren.find((m) => m.value === standaard)!;
  return {
    style: { background: `var(--${k.value})`, color: `var(--${k.contrast})` } as React.CSSProperties,
    // Kleur voor accenten als "Stap 1": rood, behalve waar rood slecht leesbaar is.
    accent: k.value === "roze" || k.value === "lichtblauw" || k.value === "wit" ? "var(--rood)" : `var(--${k.contrast})`,
  };
}
