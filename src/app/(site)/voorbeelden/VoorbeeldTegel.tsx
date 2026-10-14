"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { GrootBeeld } from "@/sanity/content";
import x from "./voorbeelden.module.css";

type Beeld = { url: string; alt: string };

export type TegelProps = {
  foto: Beeld;
  kleurplaat: Beeld;
  fotoGroot: GrootBeeld;
  kleurplaatGroot: GrootBeeld;
  achtergrond: string;
  // Positie in het grid; bepaalt hoe polaroid en papier net anders liggen.
  index: number;
};

// Per tegel een iets andere draaiing, zodat het grid niet als een stempel oogt.
const draaiingen = [
  { polaroid: -6, papier: 2 },
  { polaroid: -3, papier: -2 },
  { polaroid: -8, papier: 3 },
  { polaroid: -4, papier: 1 },
];

// Eén voorbeeld als collage: de originele foto als polaroid links, de kleurplaat
// op wit papier rechts, met een handgetekende pijl van voor naar na. Tikken
// wisselt foto en kleurplaat om.
export function VoorbeeldTegel({ foto, kleurplaat, fotoGroot, kleurplaatGroot, achtergrond, index }: TegelProps) {
  const [omgedraaid, setOmgedraaid] = useState(false);
  const filterId = `hand-${useId().replace(/:/g, "")}`;
  const groot = omgedraaid ? { ...foto, ...fotoGroot } : { ...kleurplaat, ...kleurplaatGroot };
  const klein = omgedraaid ? kleurplaat : foto;
  const draai = draaiingen[index % draaiingen.length];
  // Pijl leesbaar op de tegelkleur: wit op rood, blauw op geel, anders rood.
  const pijlKleur = achtergrond.includes("rood") ? "var(--wit)" : achtergrond.includes("geel") ? "var(--blauw)" : "var(--rood)";

  return (
    <button
      type="button"
      className={x.tegel}
      style={
        {
          background: achtergrond,
          "--draai-polaroid": `${draai.polaroid}deg`,
          "--draai-papier": `${draai.papier}deg`,
        } as React.CSSProperties
      }
      aria-pressed={omgedraaid}
      aria-label={omgedraaid ? "Toon de kleurplaat groot" : "Toon de originele foto groot"}
      onClick={() => setOmgedraaid((o) => !o)}
    >
      <span className={x.collage}>
        <span className={x.polaroid} key={`p-${klein.url}`}>
          <span className={x.polaroidBeeld}>
            <Image src={klein.url} alt={klein.alt} fill sizes="(max-width: 640px) 35vw, 160px" style={{ objectFit: "cover" }} />
          </span>
        </span>
        <span className={x.papier} key={groot.url}>
          <span className={x.beeld}>
            <Image src={groot.url} alt={groot.alt} fill sizes="(max-width: 640px) 55vw, 260px" style={{ objectFit: "cover", objectPosition: groot.positie }} />
          </span>
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
      <span className={x.wissel} aria-hidden="true">↺</span>
    </button>
  );
}
