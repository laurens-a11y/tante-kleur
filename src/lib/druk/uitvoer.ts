// Uitvoervarianten van de drukbestanden: spreads en snijtekens.
// Werkt op de losse-pagina-PDF's uit opmaak.ts: die blijven precies volgens
// de specs van PrintAPI; hier maken we er een versie met spreads en/of
// snijtekens van, zoals een drukker of designer die gewend is.

import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import type { Maten } from "./opmaak";

const MM = 72 / 25.4;
const mm = (waarde: number) => waarde * MM;

// Ruimte buiten de afloop voor de snijtekens, en hoe die eruitzien.
const RAND = 12; // mm
const AFSTAND = 3; // mm tussen afloop en begin van het teken
const LENGTE = 6; // mm
const DIKTE = 0.25; // pt
// Registerzwart: zichtbaar op alle drukplaten.
const ZWART = rgb(0, 0, 0);

type Rechthoek = { x0: number; y0: number; x1: number; y1: number }; // in mm

/**
 * Snijtekens op de hoeken van het snijformaat, buiten de afloop.
 * `vouwen`: x-posities (mm) waar ook boven en onder een kort teken komt
 * (rugvouw van de cover, midden van een spread).
 */
function tekenSnijtekens(pagina: PDFPage, snij: Rechthoek, afloop: number, vouwen: number[] = []) {
  const lijn = (x1: number, y1: number, x2: number, y2: number) =>
    pagina.drawLine({ start: { x: mm(x1), y: mm(y1) }, end: { x: mm(x2), y: mm(y2) }, thickness: DIKTE, color: ZWART });
  const begin = afloop + AFSTAND;
  const eind = begin + LENGTE;
  for (const x of [snij.x0, snij.x1]) {
    const richting = x === snij.x0 ? -1 : 1;
    for (const y of [snij.y0, snij.y1]) {
      const omhoog = y === snij.y0 ? -1 : 1;
      // horizontaal teken op hoogte van de snijlijn, naar buiten
      lijn(x + richting * begin, y, x + richting * eind, y);
      // verticaal teken op de snijlijn, naar buiten
      lijn(x, y + omhoog * begin, x, y + omhoog * eind);
    }
  }
  for (const x of vouwen) {
    lijn(x, snij.y0 - begin, x, snij.y0 - eind);
    lijn(x, snij.y1 + begin, x, snij.y1 + eind);
  }
}

/** Zet snij- en afloopkaders op een pagina met extra rand. */
function zetKaders(pagina: PDFPage, snij: Rechthoek, afloop: number) {
  pagina.setTrimBox(mm(snij.x0), mm(snij.y0), mm(snij.x1 - snij.x0), mm(snij.y1 - snij.y0));
  pagina.setBleedBox(mm(snij.x0 - afloop), mm(snij.y0 - afloop), mm(snij.x1 - snij.x0 + 2 * afloop), mm(snij.y1 - snij.y0 + 2 * afloop));
}

/**
 * Binnenwerk als spreads (twee pagina's naast elkaar). Pagina 1 is een
 * linkerpagina, dus de spreads zijn 1–2, 3–4, enz. Afloop alleen aan de
 * buitenkant; in het midden sluiten de pagina's precies op elkaar aan.
 */
export async function binnenwerkInSpreads(enkel: Uint8Array, maten: Maten, snijtekens: boolean): Promise<Uint8Array> {
  const { breedte, hoogte, afloop } = maten.binnenwerk;
  const pagina = { b: breedte - 2 * afloop, h: hoogte - 2 * afloop }; // netto paginaformaat
  const rand = snijtekens ? RAND : 0;
  const bron = await PDFDocument.load(enkel);
  const doc = await PDFDocument.create();
  doc.setTitle(`${bron.getTitle() ?? "Binnenwerk"} (spreads)`);
  doc.setProducer("Tante Kleur");
  const n = bron.getPageCount();
  if (n % 2 !== 0) throw new Error("Oneven aantal pagina's; spreads kunnen niet.");

  const totaal = { b: 2 * pagina.b + 2 * afloop + 2 * rand, h: pagina.h + 2 * afloop + 2 * rand };
  const bronPaginas = bron.getPages();
  for (let i = 0; i < n; i += 2) {
    const [links, rechts] = await doc.embedPages([bronPaginas[i], bronPaginas[i + 1]], [
      // links: afloop links, boven, onder; niet rechts (rugzijde)
      { left: 0, bottom: 0, right: mm(afloop + pagina.b), top: mm(hoogte) },
      // rechts: afloop rechts, boven, onder; niet links
      { left: mm(afloop), bottom: 0, right: mm(breedte), top: mm(hoogte) },
    ]);
    const spread = doc.addPage([mm(totaal.b), mm(totaal.h)]);
    spread.drawPage(links, { x: mm(rand), y: mm(rand) });
    spread.drawPage(rechts, { x: mm(rand + afloop + pagina.b), y: mm(rand) });
    const snij = { x0: rand + afloop, y0: rand + afloop, x1: rand + afloop + 2 * pagina.b, y1: rand + afloop + pagina.h };
    zetKaders(spread, snij, afloop);
    if (snijtekens) tekenSnijtekens(spread, snij, afloop, [rand + afloop + pagina.b]);
  }
  return doc.save();
}

/** Cover met snijtekens en tekens voor de rugvouwen, buiten de afloop. */
export async function coverMetSnijtekens(enkel: Uint8Array, maten: Maten): Promise<Uint8Array> {
  const { breedte, hoogte, afloop, rug } = maten.cover;
  const bron = await PDFDocument.load(enkel);
  const doc = await PDFDocument.create();
  doc.setTitle(`${bron.getTitle() ?? "Cover"} (met snijtekens)`);
  doc.setProducer("Tante Kleur");
  const [cover] = await doc.embedPdf(bron, [0]);
  const pagina = doc.addPage([mm(breedte + 2 * RAND), mm(hoogte + 2 * RAND)]);
  pagina.drawPage(cover, { x: mm(RAND), y: mm(RAND) });
  const snij = { x0: RAND + afloop, y0: RAND + afloop, x1: RAND + breedte - afloop, y1: RAND + hoogte - afloop };
  const paneel = (breedte - 2 * afloop - rug) / 2;
  zetKaders(pagina, snij, afloop);
  tekenSnijtekens(pagina, snij, afloop, [snij.x0 + paneel, snij.x0 + paneel + rug]);
  return doc.save();
}
