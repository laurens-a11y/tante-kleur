"use client";

import { binnenKleuren, binnenKleur } from "@/config";
import b from "./boek.module.css";

// Keuze voor de kleur van de verhaalpagina's, met een klein voorbeeld van
// een opengeslagen boek: verhaal links in de gekozen kleur, kleurplaat rechts wit.
export function BinnenKleurKiezer({
  waarde,
  onKies,
  naam = "binnenkleur",
}: {
  waarde: string;
  onKies: (kleur: string) => void;
  naam?: string;
}) {
  const gekozen = binnenKleur(waarde);
  return (
    <fieldset className={b.veld}>
      <legend className={b.label}>Kleur van de verhaalpagina&apos;s</legend>
      <p className={b.hulp}>
        De linkerpagina&apos;s met je inleiding, verhaaltjes en nawoord krijgen deze kleur. De kleurplaten zelf blijven wit,
        zodat je er fijn in kunt kleuren.
      </p>
      <div className={b.binnenRij}>
        <div className={b.kleuren}>
          {binnenKleuren.map((k) => (
            <label key={k.value} className={b.kleurKeuze}>
              <input type="radio" name={naam} value={k.value} checked={gekozen.value === k.value} onChange={() => onKies(k.value)} />
              <span className={b.kleurBol} style={{ background: `var(--${k.value})` }} aria-hidden />
              <span>{k.label}</span>
            </label>
          ))}
        </div>
        <div className={b.spreadVoorbeeld} aria-label={`Voorbeeld: verhaalpagina in ${gekozen.label.toLowerCase()}`}>
          <div className={b.spreadLinks} style={{ background: `var(--${gekozen.value})`, color: `var(--${gekozen.tekst})` }}>
            <span className={b.spreadRegel} />
            <span className={b.spreadRegel} />
            <span className={b.spreadRegelKort} />
          </div>
          <div className={b.spreadRechts} aria-hidden>
            <svg viewBox="0 0 40 56" className={b.spreadPlaat}>
              <circle cx="20" cy="20" r="8" />
              <path d="M8 50 C10 36 30 36 32 50" />
            </svg>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
