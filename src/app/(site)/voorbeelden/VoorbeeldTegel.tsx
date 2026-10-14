"use client";

import Image from "next/image";
import { useState } from "react";
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
          <svg viewBox="0 0 120 50" width="96" height="40">
            <path d="M8 40 C 30 6, 80 2, 108 30" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M96 30 L 109 32 L 106 18" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      <span className={x.wissel} aria-hidden="true">↺</span>
    </button>
  );
}
