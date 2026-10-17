import { binnenKleur, boek } from "@/config";
import b from "./beheer.module.css";

// Gekozen kleuren van een boek, als vlakje met naam. Voor de beheerpagina's.

function coverKleur(value: string | null) {
  return boek.coverKleuren.find((k) => k.value === value) ?? null;
}

export function KleurVlak({ kleur, label }: { kleur: string; label: string }) {
  return (
    <span className={b.kleurRegel}>
      <span className={b.kleurVlak} style={{ background: `var(--${kleur})` }} aria-hidden />
      {label}
    </span>
  );
}

/** Uitgebreid: voor de orderpagina. */
export function GekozenKleuren({ cover, binnen }: { cover: string | null; binnen: string | null }) {
  const c = coverKleur(cover);
  const v = binnenKleur(binnen);
  return (
    <div className={b.kleurenBlok}>
      <div>
        <p className={b.klein}>Cover</p>
        {c ? <KleurVlak kleur={c.kleur} label={c.label} /> : <span>Nog niet gekozen</span>}
      </div>
      <div>
        <p className={b.klein}>Verhaalpagina&apos;s</p>
        <KleurVlak kleur={v.value} label={binnen ? v.label : `${v.label} (standaard)`} />
      </div>
    </div>
  );
}

/** Compact: voor de bestellijst. */
export function KleurenKort({ cover, binnen }: { cover: string | null; binnen: string | null }) {
  const c = coverKleur(cover);
  const v = binnenKleur(binnen);
  return (
    <span className={b.kleurenKort} title={`Cover: ${c?.label ?? "nog niet gekozen"} · Verhaalpagina's: ${v.label}`}>
      <span className={b.kleurVlak} style={{ background: c ? `var(--${c.kleur})` : "transparent" }} aria-hidden />
      <span className={b.kleurVlak} style={{ background: `var(--${v.value})` }} aria-hidden />
      <span className={b.klein}>
        {c?.label ?? "–"} / {v.label}
      </span>
    </span>
  );
}
