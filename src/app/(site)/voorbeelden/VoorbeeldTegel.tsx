"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { GrootBeeld, TegelGrootte } from "@/sanity/content";
import x from "./voorbeelden.module.css";

type Beeld = { url: string; alt: string };

export type TegelProps = {
  foto: Beeld;
  kleurplaat: Beeld;
  fotoGroot: GrootBeeld;
  kleurplaatGroot: GrootBeeld;
  grootte: TegelGrootte;
  achtergrond: string;
};

const sizes: Record<TegelGrootte, string> = {
  normaal: "(max-width: 700px) 50vw, 300px",
  breed: "(max-width: 700px) 50vw, 280px",
  groot: "(max-width: 700px) 100vw, 600px",
};

// Eén voorbeeld in de bento grid: de kleurplaat op wit papier, de originele foto
// als polaroid erop geplakt, met een getekende pijl van voor naar na. Tikken
// wisselt foto en kleurplaat om.
export function VoorbeeldTegel({ foto, kleurplaat, fotoGroot, kleurplaatGroot, grootte, achtergrond }: TegelProps) {
  const [omgedraaid, setOmgedraaid] = useState(false);
  const filterId = `hand-${useId().replace(/:/g, "")}`;
  const groot = omgedraaid ? { ...foto, ...fotoGroot } : { ...kleurplaat, ...kleurplaatGroot };
  const klein = omgedraaid ? kleurplaat : foto;
  // Pijl leesbaar op de tegelkleur: wit op rood, blauw op geel, anders rood.
  const pijlKleur = achtergrond.includes("rood") ? "var(--wit)" : achtergrond.includes("geel") ? "var(--blauw)" : "var(--rood)";

  return (
    <button
      type="button"
      className={`${x.tegel} ${x[grootte]}`}
      style={{ background: achtergrond }}
      aria-pressed={omgedraaid}
      aria-label={omgedraaid ? "Toon de kleurplaat groot" : "Toon de originele foto groot"}
      onClick={() => setOmgedraaid((o) => !o)}
    >
      <span className={x.collage}>
        <span className={x.papier} key={groot.url}>
          <span className={x.beeld}>
            <Image src={groot.url} alt={groot.alt} fill sizes={sizes[grootte]} style={{ objectFit: "cover", objectPosition: groot.positie }} />
          </span>
        </span>
        <span className={x.polaroid} key={`p-${klein.url}`}>
          <span className={x.polaroidBeeld}>
            <Image src={klein.url} alt={klein.alt} fill sizes="(max-width: 700px) 130px, 220px" style={{ objectFit: "cover" }} />
          </span>
        </span>
        <span className={`${x.pijl} ${omgedraaid ? x.pijlTerug : ""}`} style={{ color: pijlKleur }} aria-hidden="true">
          <span className={x.pijlLabel}>Tante tekent</span>
          {/* Handgetekende pijl: lusje halverwege, scheve punt, licht trillende lijn. */}
          <svg viewBox="0 0 140 60" width="104" height="44">
            <defs>
              <filter id={filterId} x="-10%" y="-20%" width="120%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7" />
                <feDisplacementMap in="SourceGraphic" scale="2.5" />
              </filter>
            </defs>
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${filterId})`}>
              <path d="M8 50 C 16 34, 30 22, 48 21 C 66 20, 71 38, 59 41 C 47 44, 50 22, 70 15 C 92 8, 116 18, 129 37" strokeWidth="3.6" />
              <path d="M113 36 C 119 37, 124 38, 130 39" strokeWidth="3.4" />
              <path d="M130 39 C 129 32, 127 26, 124 21" strokeWidth="3.2" />
            </g>
          </svg>
        </span>
      </span>
      <span className={x.wissel} aria-hidden="true">↺</span>
    </button>
  );
}
