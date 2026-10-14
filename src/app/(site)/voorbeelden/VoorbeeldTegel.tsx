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
  breed: "(max-width: 700px) 100vw, 600px",
  groot: "(max-width: 700px) 100vw, 600px",
};

// Eén voorbeeld in de bento grid: de kleurplaat groot, de originele foto als
// polaroid in de hoek. Tikken wisselt ze om.
export function VoorbeeldTegel({ foto, kleurplaat, fotoGroot, kleurplaatGroot, grootte, achtergrond }: TegelProps) {
  const [omgedraaid, setOmgedraaid] = useState(false);
  const groot = omgedraaid ? { ...foto, ...fotoGroot } : { ...kleurplaat, ...kleurplaatGroot };
  const klein = omgedraaid ? kleurplaat : foto;

  return (
    <button
      type="button"
      className={`${x.tegel} ${x[grootte]}`}
      style={{ background: achtergrond }}
      aria-pressed={omgedraaid}
      aria-label={omgedraaid ? "Toon de kleurplaat groot" : "Toon de originele foto groot"}
      onClick={() => setOmgedraaid((o) => !o)}
    >
      <span className={x.hoofd} key={groot.url}>
        <Image src={groot.url} alt={groot.alt} fill sizes={sizes[grootte]} style={{ objectFit: "cover", objectPosition: groot.positie }} />
      </span>
      <span className={x.polaroid} key={`p-${klein.url}`}>
        <span className={x.polaroidBeeld}>
          <Image src={klein.url} alt={klein.alt} fill sizes="160px" style={{ objectFit: "cover" }} />
        </span>
      </span>
      <span className={x.wissel} aria-hidden="true">↺</span>
    </button>
  );
}
