// Zet een tekenplaat (pixels) om naar vectorlijnen, zodat de lijnen bij elk
// drukformaat haarscherp blijven. Werkt voor zuivere zwart-witlijntekeningen.

import sharp from "sharp";
import { Potrace } from "potrace";

export type Vector = { breedte: number; hoogte: number; paden: string[] };

export async function traceerPlaat(bron: Buffer): Promise<Vector> {
  // Grijs, rechtop, en op ~2400 px hoogte: genoeg detail, nog snel te traceren.
  const { data, info } = await sharp(bron)
    .rotate()
    .flatten({ background: "#ffffff" })
    .grayscale()
    .resize({ height: 2400, withoutEnlargement: false, kernel: "lanczos3" })
    .png()
    .toBuffer({ resolveWithObject: true });

  const potrace = new Potrace({
    threshold: 165, // alles donkerder dan dit wordt lijn
    turdSize: 6, // spikkels en ruis weglaten
    optTolerance: 0.3,
    alphaMax: 1,
    blackOnWhite: true,
  });
  await new Promise<void>((klaar, fout) => potrace.loadImage(data, (err: Error | null) => (err ? fout(err) : klaar())));

  const tag = potrace.getPathTag("black");
  const paden = [...tag.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).filter((d) => d.trim().length > 0);
  return { breedte: info.width, hoogte: info.height, paden };
}

export type PadStap = { op: "M" | "L" | "C" | "Z"; p: number[] };

/**
 * Leest de padgegevens van potrace (alleen absolute M, L, C en Z) als losse stappen.
 * Na een commando mogen meerdere coördinaatgroepen volgen (zoals in SVG).
 */
export function leesPad(d: string): PadStap[] {
  const delen = d.match(/[MLCZmlcz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const stappen: PadStap[] = [];
  let op: PadStap["op"] | null = null;
  let getallen: number[] = [];
  const nodig = { M: 2, L: 2, C: 6, Z: 0 } as const;
  const leeg = () => {
    if (!op) return;
    if (op === "Z") {
      stappen.push({ op: "Z", p: [] });
      return;
    }
    const n = nodig[op];
    for (let i = 0; i + n <= getallen.length; i += n) {
      // Na een M gelden volgende paren als L (SVG-regel).
      stappen.push({ op: op === "M" && i > 0 ? "L" : op, p: getallen.slice(i, i + n) });
    }
  };
  for (const deel of delen) {
    if (/[A-Za-z]/.test(deel)) {
      leeg();
      op = deel.toUpperCase() as PadStap["op"];
      getallen = [];
    } else getallen.push(parseFloat(deel));
  }
  leeg();
  return stappen;
}
