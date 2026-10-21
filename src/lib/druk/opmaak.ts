// Opmaak van de drukbestanden voor PrintAPI: binnenwerk en cover.
// Binnenwerk volgens de briefing van de designer (Fraunces 9pt Black + Archivo
// SemiBold, vaste tekstvakken, kleurthema's, platen paginavullend).
// Bewust zonder "server-only" en zonder database, zodat deze module ook los
// te testen is met een script. Invoer: teksten, kleuren en tekenplaten.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFPage, PDFImage, rgb, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Font as FkFont } from "@pdf-lib/fontkit";
import sharp from "sharp";
import { coverOpmaak, plaatNabewerking, plaatsUitsnede, standaardUitsnede, type CoverUitsnede } from "../../config";
import { nabewerkPlaat } from "./nabewerking";

const MM = 72 / 25.4;
const mm = (waarde: number) => waarde * MM;

export type Kleur = { achtergrond: string; tekst: string };

// Kleurthema van een tekstpagina (hex): achtergrond, titel en beschrijving.
export type Thema = { achtergrond: string; titel: string; tekst: string };

export type DrukBoek = {
  titel: string;
  cover: Kleur;
  inleiding: string;
  inleidingThema: Thema;
  // In de volgorde van het boek; tekenplaat als PNG/JPG, of null als die ontbreekt.
  paginas: { titel: string; verhaal: string; plaat: Buffer | null; thema: Thema }[];
  // Index (0-based) van de pagina waarvan de plaat op de cover komt, en de uitsnede.
  // Leeg = eerste pagina met een plaat, gecentreerd.
  coverIndex?: number | null;
  coverUitsnede?: CoverUitsnede | null;
};

export type Maten = {
  voorPaginas: number;
  binnenwerk: { breedte: number; hoogte: number; afloop: number };
  cover: { breedte: number; hoogte: number; afloop: number; rug: number };
};

function hex(waarde: string): RGB {
  const h = waarde.replace("#", "");
  return rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
}

// Alleen tekens die in de lettertypes zitten (Latijns schrift en gangbare leestekens);
// emoji en dergelijke vallen weg in plaats van als lege vakjes te drukken.
function schoon(tekst: string) {
  return tekst
    .replace(/\r\n/g, "\n")
    .replace(/[^\n -~ -ɏ–—‘-‟…€]/g, "")
    .trim();
}

const assets = path.join(process.cwd(), "assets");

/** Breekt tekst af op de beschikbare breedte; lege regels blijven als witregel. */
function breekAf(tekst: string, font: PDFFont, grootte: number, breedte: number): string[] {
  const regels: string[] = [];
  for (const alinea of tekst.split("\n")) {
    if (!alinea.trim()) {
      regels.push("");
      continue;
    }
    let regel = "";
    for (const woord of alinea.split(/\s+/)) {
      const proef = regel ? `${regel} ${woord}` : woord;
      if (font.widthOfTextAtSize(proef, grootte) <= breedte || !regel) regel = proef;
      else {
        regels.push(regel);
        regel = woord;
      }
    }
    regels.push(regel);
  }
  // Geen witregels aan begin of eind.
  while (regels[0] === "") regels.shift();
  while (regels.at(-1) === "") regels.pop();
  return regels;
}

function plaatOntbreekt(pagina: PDFPage, vak: { x: number; y: number; breedte: number; hoogte: number }, font: PDFFont) {
  const blauw = hex("#002cd4");
  pagina.drawRectangle({ ...{ x: vak.x, y: vak.y, width: vak.breedte, height: vak.hoogte }, borderColor: blauw, borderWidth: 1, borderDashArray: [6, 6] });
  const tekst = "Kleurplaat ontbreekt";
  const w = font.widthOfTextAtSize(tekst, 14);
  pagina.drawText(tekst, { x: vak.x + (vak.breedte - w) / 2, y: vak.y + vak.hoogte / 2, size: 14, font, color: blauw });
}

/** Zet de snij- en afloopkaders, zodat de drukker de maten zeker weet. */
function zetKaders(pagina: PDFPage, breedte: number, hoogte: number, afloop: number) {
  pagina.setBleedBox(0, 0, mm(breedte), mm(hoogte));
  pagina.setTrimBox(mm(afloop), mm(afloop), mm(breedte - 2 * afloop), mm(hoogte - 2 * afloop));
}

export type Platen = { binnen: (Buffer | null)[]; voorplaat: Buffer | null };

function rgbVan(kleur: string) {
  const h = kleur.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

/**
 * Bereidt de tekenplaten voor op druk, zonder details te verliezen:
 * - binnenwerk: automatische nabewerking (zuiver wit, vlekjes weg, lijnen strak) op drukresolutie;
 * - cover: de eerste plaat ongewijzigd (zie maakCover).
 */
export async function bereidPlatenVoor(boek: DrukBoek, maten: Maten): Promise<Platen> {
  const binnen: (Buffer | null)[] = [];
  for (const p of boek.paginas) {
    // Alle platen automatisch dezelfde nabewerking (zie plaatNabewerking in config).
    binnen.push(p.plaat ? await nabewerkPlaat(p.plaat, plaatNabewerking, maten.binnenwerk.hoogte) : null);
  }
  // Coverbeeld: de gekozen pagina (of de eerste met een plaat); inkleuren en uitsnijden gebeurt in maakCover.
  const gekozen = boek.coverIndex != null ? boek.paginas[boek.coverIndex]?.plaat : null;
  const voorplaat = gekozen ?? boek.paginas.find((p) => p.plaat)?.plaat ?? null;
  return { binnen, voorplaat };
}

// ---------- Binnenwerk volgens het ontwerp van de designer ----------
//
// Losse pagina's van 216 × 303 mm (A4 + 3 mm afloop), geen snijtekens.
// Pagina 1 (links) leeg, pagina 2 (rechts) titel + inleiding, daarna per foto
// links een gekleurde tekstpagina (titel + verhaal) en rechts de kleurplaat
// paginavullend. Vakken in mm vanaf linksboven van het netto A4-formaat.

type Vak = { x: number; y: number; breedte: number; hoogte: number };
const TITELVAK: Vak = { x: 25, y: 45, breedte: 160, hoogte: 100 };
const TEKSTVAK: Vak = { x: 40, y: 150, breedte: 130, hoogte: 85 };
// De inleiding is langer dan een verhaal: zelfde breedte, vak loopt door tot 25 mm boven de onderrand.
const INLEIDINGVAK: Vak = { x: 40, y: 150, breedte: 130, hoogte: 122 };

const TITEL = { grootte: 90, regelafstand: 80 / 90, min: 50, stap: 0.5, maxRegels: 3 };
const TEKST = { grootte: 15, regelafstand: 22 / 15, min: 13, stap: 0.25 };
// Vangnet als iets op de minimale maat toch niet past (het formulier voorkomt dat).
const NOODMIN = { titel: 30, tekst: 9 };

type Meetfont = { pdf: PDFFont; fk: FkFont };

/** Inkt-boven- en onderkant van een regel in pt t.o.v. de basislijn (boven positief). */
function inkt(font: Meetfont, regel: string, grootte: number) {
  const run = font.fk.layout(regel);
  const schaal = grootte / font.fk.unitsPerEm;
  return { boven: run.bbox.maxY * schaal, onder: run.bbox.minY * schaal, breedte: run.advanceWidth * schaal };
}

function breedte(font: Meetfont, tekst: string, grootte: number) {
  return (font.fk.layout(tekst).advanceWidth * grootte) / font.fk.unitsPerEm;
}

/**
 * Titel: alleen breken op woordgrenzen, zo min mogelijk regels (max. 3) en zo
 * evenwichtig mogelijk. Geeft de regels terug, of null als het niet past.
 */
function titelRegels(woorden: string[], font: Meetfont, grootte: number, maxBreedte: number, maxRegels: number): string[] | null {
  const n = woorden.length;
  let beste: { regels: string[]; score: number } | null = null;
  for (let aantal = 1; aantal <= Math.min(maxRegels, n); aantal++) {
    // Alle manieren om n woorden in `aantal` regels te verdelen.
    const verdeel = (start: number, over: number): string[][] => {
      if (over === 1) return [[woorden.slice(start).join(" ")]];
      const uit: string[][] = [];
      for (let eind = start + 1; eind <= n - over + 1; eind++) {
        for (const rest of verdeel(eind, over - 1)) uit.push([woorden.slice(start, eind).join(" "), ...rest]);
      }
      return uit;
    };
    for (const regels of verdeel(0, aantal)) {
      const breedtes = regels.map((r) => breedte(font, r, grootte));
      if (breedtes.some((b) => b > maxBreedte)) continue;
      // Evenwichtig: zo klein mogelijk verschil tussen de regels.
      const score = Math.max(...breedtes) - Math.min(...breedtes);
      if (!beste || score < beste.score) beste = { regels, score };
    }
    if (beste) return beste.regels;
  }
  return null;
}

/** Hoogte van de zichtbare inkt van een blok regels (boven eerste tot onder laatste). */
function inktHoogte(font: Meetfont, regels: string[], grootte: number, lijn: number) {
  const eerste = inkt(font, regels[0], grootte);
  const laatste = inkt(font, regels.at(-1)!, grootte);
  return eerste.boven + (regels.length - 1) * lijn - laatste.onder;
}

/** Zet een titel gecentreerd in het titelvak, met de zichtbare inkt op de onderkant. */
function zetTitel(pagina: PDFPage, tekst: string, font: Meetfont, kleur: RGB, vak: Vak, afloop: number, paginaHoogte: number) {
  const woorden = tekst.split(/\s+/).filter(Boolean);
  if (!woorden.length) return;
  const maxB = mm(vak.breedte);
  const maxH = mm(vak.hoogte);
  let grootte = TITEL.grootte;
  let regels: string[] | null = null;
  for (; grootte >= NOODMIN.titel; grootte -= TITEL.stap) {
    regels = titelRegels(woorden, font, grootte, maxB, TITEL.maxRegels);
    if (regels && inktHoogte(font, regels, grootte, grootte * TITEL.regelafstand) <= maxH) break;
    regels = null;
  }
  if (!regels) {
    grootte = NOODMIN.titel;
    regels = breekAf(woorden.join(" "), font.pdf, grootte, maxB);
  }
  const lijn = grootte * TITEL.regelafstand;
  // Onderkant van het vak in PDF-coördinaten (oorsprong linksonder, inclusief afloop).
  const onderkant = mm(paginaHoogte - afloop - vak.y - vak.hoogte);
  let y = onderkant - inkt(font, regels.at(-1)!, grootte).onder + (regels.length - 1) * lijn;
  const midden = mm(afloop + vak.x + vak.breedte / 2);
  for (const regel of regels) {
    pagina.drawText(regel, { x: midden - breedte(font, regel, grootte) / 2, y, size: grootte, font: font.pdf, color: kleur });
    y -= lijn;
  }
  return grootte;
}

/** Breekt tekst op woordgrenzen; `\n` begint een nieuwe regel, een lege regel blijft leeg. */
function tekstRegels(tekst: string, font: Meetfont, grootte: number, maxB: number): string[] | null {
  const regels: string[] = [];
  for (const alinea of tekst.split("\n")) {
    if (!alinea.trim()) {
      regels.push("");
      continue;
    }
    let regel = "";
    for (const woord of alinea.split(/\s+/).filter(Boolean)) {
      if (breedte(font, woord, grootte) > maxB) return null; // woord nooit afbreken
      const proef = regel ? `${regel} ${woord}` : woord;
      if (breedte(font, proef, grootte) <= maxB) regel = proef;
      else {
        regels.push(regel);
        regel = woord;
      }
    }
    regels.push(regel);
  }
  while (regels[0] === "") regels.shift();
  while (regels.at(-1) === "") regels.pop();
  return regels;
}

/** Zet tekst gecentreerd en bovenaan uitgelijnd in een vak; verkleint in stapjes tot het past. */
function zetTekst(pagina: PDFPage, tekst: string, font: Meetfont, kleur: RGB, vak: Vak, afloop: number, paginaHoogte: number) {
  if (!tekst.trim()) return;
  const maxB = mm(vak.breedte);
  const maxH = mm(vak.hoogte);
  const kap = (font.fk.capHeight / font.fk.unitsPerEm);
  const onderlengte = -font.fk.descent / font.fk.unitsPerEm;
  let grootte = TEKST.grootte;
  let regels: string[] | null = null;
  for (; grootte >= NOODMIN.tekst; grootte -= TEKST.stap) {
    regels = tekstRegels(tekst, font, grootte, maxB);
    if (regels && grootte * kap + (regels.length - 1) * grootte * TEKST.regelafstand + grootte * onderlengte <= maxH) break;
    regels = null;
  }
  if (!regels) {
    grootte = NOODMIN.tekst;
    regels = breekAf(tekst, font.pdf, grootte, maxB);
  }
  const lijn = grootte * TEKST.regelafstand;
  // Bovenkant van de hoofdletters op de bovenkant van het vak.
  let y = mm(paginaHoogte - afloop - vak.y) - grootte * kap;
  const midden = mm(afloop + vak.x + vak.breedte / 2);
  for (const regel of regels) {
    if (regel) pagina.drawText(regel, { x: midden - breedte(font, regel, grootte) / 2, y, size: grootte, font: font.pdf, color: kleur });
    y -= lijn;
  }
  return grootte;
}

/** Plaat over de hele pagina inclusief afloop: proportioneel, gecentreerd, kleinst mogelijke uitsnede. */
function plaatVullend(pagina: PDFPage, plaat: PDFImage, b: number, h: number) {
  const schaal = Math.max(mm(b) / plaat.width, mm(h) / plaat.height);
  const w = plaat.width * schaal;
  const hh = plaat.height * schaal;
  pagina.drawImage(plaat, { x: (mm(b) - w) / 2, y: (mm(h) - hh) / 2, width: w, height: hh });
}

/** Eén doorlopende alinea: regeleinden van de klant worden spaties. */
function alinea(tekst: string) {
  return schoon(tekst).replace(/\s*\n\s*/g, " ");
}

export async function maakBinnenwerk(boek: DrukBoek, maten: Maten, platen: Platen): Promise<Uint8Array> {
  const { breedte: b, hoogte: h, afloop } = maten.binnenwerk;
  const doc = await PDFDocument.create();
  doc.setTitle(`${boek.titel} – binnenwerk`);
  doc.setProducer("Tante Kleur");
  doc.registerFontkit(fontkit);
  const lees = (naam: string) => readFile(path.join(assets, "fonts", naam));
  const [titelBestand, tekstBestand] = await Promise.all([lees("Fraunces-9pt-Black.ttf"), lees("Archivo-SemiBold.ttf")]);
  const titelFont: Meetfont = { pdf: await doc.embedFont(titelBestand, { subset: true }), fk: fontkit.create(titelBestand) };
  const tekstFont: Meetfont = { pdf: await doc.embedFont(tekstBestand, { subset: true }), fk: fontkit.create(tekstBestand) };

  function nieuwePagina(achtergrond: string) {
    const pagina = doc.addPage([mm(b), mm(h)]);
    zetKaders(pagina, b, h, afloop);
    // Achtergrond loopt door tot de buitenrand van de afloop.
    pagina.drawRectangle({ x: 0, y: 0, width: mm(b), height: mm(h), color: hex(achtergrond) });
    return pagina;
  }

  // 1 (links): leeg.
  nieuwePagina("#ffffff");

  // 2 (rechts): titel van het boek en de inleiding.
  {
    const t = boek.inleidingThema;
    const pagina = nieuwePagina(t.achtergrond);
    zetTitel(pagina, schoon(boek.titel).replace(/\s+/g, " "), titelFont, hex(t.titel), TITELVAK, afloop, h);
    zetTekst(pagina, schoon(boek.inleiding), tekstFont, hex(t.tekst), INLEIDINGVAK, afloop, h);
  }

  // Per foto: links titel + verhaal, rechts de kleurplaat.
  for (const [i, bron] of boek.paginas.entries()) {
    {
      const pagina = nieuwePagina(bron.thema.achtergrond);
      zetTitel(pagina, schoon(bron.titel).replace(/\s+/g, " "), titelFont, hex(bron.thema.titel), TITELVAK, afloop, h);
      zetTekst(pagina, alinea(bron.verhaal), tekstFont, hex(bron.thema.tekst), TEKSTVAK, afloop, h);
    }
    {
      const pagina = doc.addPage([mm(b), mm(h)]);
      zetKaders(pagina, b, h, afloop);
      const plaat = platen.binnen[i];
      if (plaat) plaatVullend(pagina, await doc.embedJpg(plaat), b, h);
      else {
        pagina.drawRectangle({ x: 0, y: 0, width: mm(b), height: mm(h), color: rgb(1, 1, 1) });
        plaatOntbreekt(pagina, { x: mm(afloop + 20), y: mm(afloop + 20), breedte: mm(b - 2 * afloop - 40), hoogte: mm(h - 2 * afloop - 40) }, tekstFont.pdf);
      }
    }
  }

  const verwacht = maten.voorPaginas + 2 * boek.paginas.length;
  if (doc.getPageCount() !== verwacht) throw new Error(`Binnenwerk heeft ${doc.getPageCount()} pagina's in plaats van ${verwacht}`);
  return doc.save();
}

// ---------- Cover volgens de kernbriefing van de designer ----------
//
// Eén doorlopende pagina: achterplat links, rug, voorplat rechts. Roze boven,
// blauw ondervlak over de hele breedte. Coverbeeld (oranjerood lijnwerk op
// roze) op het voorplat tot aan de afloop, titel in Archivo Black op de
// scheidingslijn, sticker rechtsboven, merkuiting op het achterplat.

export type CoverControle = {
  titelGrootte: number | null; // null = past niet, ook niet op de minimale maat
  titelRegels: string[];
  beeldPpi: number | null; // effectieve resolutie van de bronplaat op het geplaatste formaat
  beeldPixels: string | null;
  rugBreedte: number;
  covermaat: string;
  bevestigd: boolean;
  waarschuwingen: string[];
};

/** Zichtbare inkt van een regel in pt: links/rechts t.o.v. de oorsprong, boven/onder t.o.v. de basislijn. */
function inktRegel(font: Meetfont, regel: string, grootte: number) {
  const run = font.fk.layout(regel);
  const s = grootte / font.fk.unitsPerEm;
  return { links: run.bbox.minX * s, rechts: run.bbox.maxX * s, boven: run.bbox.maxY * s, onder: run.bbox.minY * s };
}

/** Tekent een regel glyph voor glyph op de posities van fontkit, zodat de kerning klopt. */
function tekenMetKerning(pagina: PDFPage, font: Meetfont, regel: string, grootte: number, x: number, y: number, kleur: RGB) {
  const run = font.fk.layout(regel);
  const s = grootte / font.fk.unitsPerEm;
  let pen = 0;
  run.glyphs.forEach((glyph, i) => {
    const pos = run.positions[i];
    const tekst = String.fromCodePoint(...glyph.codePoints);
    if (tekst.trim()) pagina.drawText(tekst, { x: x + (pen + pos.xOffset) * s, y: y + pos.yOffset * s, size: grootte, font: font.pdf, color: kleur });
    pen += pos.xAdvance;
  });
}

/** Woorden op volgorde over regels verdelen; een woord gaat in zijn geheel naar de volgende regel. */
function verdeelWoorden(woorden: string[], font: Meetfont, grootte: number, maxB: number): string[] | null {
  const regels: string[] = [];
  let regel = "";
  for (const woord of woorden) {
    const proef = regel ? `${regel} ${woord}` : woord;
    if (inktRegel(font, proef, grootte).rechts <= maxB) regel = proef;
    else {
      if (!regel) return null; // één woord is al te breed
      regels.push(regel);
      regel = woord;
      if (inktRegel(font, woord, grootte).rechts > maxB) return null;
    }
  }
  if (regel) regels.push(regel);
  return regels;
}

/** Coverbeeld: tekenplaat (zwart op wit) → oranjerood lijnwerk op roze, exact op maat volgens de uitsnede. */
async function maakCoverbeeld(plaat: Buffer, breedtePx: number, hoogtePx: number, uitsnede: CoverUitsnede) {
  const { roze, lijn } = coverOpmaak.kleuren;
  const rechtop = await sharp(plaat).rotate().flatten({ background: "#ffffff" }).grayscale().toBuffer({ resolveWithObject: true });
  const bronB = rechtop.info.width;
  const bronH = rechtop.info.height;
  // Zelfde rekensom als de preview in beheer (plaatsUitsnede in config).
  const p = plaatsUitsnede({ breedte: bronB, hoogte: bronH }, { breedte: breedtePx, hoogte: hoogtePx }, uitsnede);
  const geschaaldB = Math.max(breedtePx, Math.round(p.breedte));
  const geschaaldH = Math.max(hoogtePx, Math.round(p.hoogte));
  const links = Math.min(geschaaldB - breedtePx, Math.max(0, Math.round(-p.links)));
  const boven = Math.min(geschaaldH - hoogtePx, Math.max(0, Math.round(-p.boven)));
  const { data, info } = await sharp(rechtop.data)
    .resize({ width: geschaaldB, height: geschaaldH, fit: "fill", kernel: "lanczos3" })
    .extract({ left: links, top: boven, width: breedtePx, height: hoogtePx })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const r = rgbVan(roze);
  const l = rgbVan(lijn);
  const uit = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < info.width * info.height; i++) {
    const a = 1 - data[i * info.channels] / 255; // donker = lijn
    uit[i * 3] = Math.round(r.r + (l.r - r.r) * a);
    uit[i * 3 + 1] = Math.round(r.g + (l.g - r.g) * a);
    uit[i * 3 + 2] = Math.round(r.b + (l.b - r.b) * a);
  }
  const jpg = await sharp(uit, { raw: { width: info.width, height: info.height, channels: 3 } })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toBuffer();
  return { jpg, bronB, bronH, schaal: p.schaal };
}

export async function maakCover(boek: DrukBoek, maten: Maten, platen: Platen): Promise<{ pdf: Uint8Array; controle: CoverControle }> {
  const { breedte, hoogte, afloop, rug } = maten.cover;
  const C = coverOpmaak;
  const waarschuwingen: string[] = [];
  const doc = await PDFDocument.create();
  doc.setTitle(`${boek.titel} – cover`);
  doc.setProducer("Tante Kleur");
  doc.registerFontkit(fontkit);

  const pagina = doc.addPage([mm(breedte), mm(hoogte)]);
  zetKaders(pagina, breedte, hoogte, afloop);
  const paneel = (breedte - 2 * afloop - rug) / 2; // netto breedte achter- en voorplat
  const trimBoven = hoogte - afloop; // y van de bovenste TrimBox-rand (mm, vanaf onder)
  const voorX = afloop + paneel + rug; // linkerrand voorplat
  const trimRechts = breedte - afloop;
  const scheiding = trimBoven - C.scheidingVanafBoven; // y van de scheidingslijn (mm, vanaf onder)

  // 1. Achtergrond: blauw ondervlak over de hele breedte, roze erboven.
  pagina.drawRectangle({ x: 0, y: 0, width: mm(breedte), height: mm(hoogte), color: hex(C.kleuren.blauw) });
  pagina.drawRectangle({ x: 0, y: mm(scheiding), width: mm(breedte), height: mm(hoogte - scheiding), color: hex(C.kleuren.roze) });

  // 2. Coverbeeld: van het midden van de rug tot de rechter buitenrand, van de bovenrand tot de scheidingslijn.
  let beeldPpi: number | null = null;
  let beeldPixels: string | null = null;
  if (platen.voorplaat) {
    const vak = { x: afloop + paneel + rug / 2, y: scheiding, b: breedte - (afloop + paneel + rug / 2), h: hoogte - scheiding };
    const doelB = Math.round((vak.b / 25.4) * C.minPpi);
    const doelH = Math.round((vak.h / 25.4) * C.minPpi);
    const uitsnede = boek.coverUitsnede ?? standaardUitsnede;
    const beeld = await maakCoverbeeld(platen.voorplaat, doelB, doelH, uitsnede);
    // Effectieve resolutie van de bron: inzoomen verlaagt die.
    beeldPpi = Math.round(C.minPpi / beeld.schaal);
    beeldPixels = `${beeld.bronB}×${beeld.bronH}`;
    if (beeldPpi < C.minPpi) {
      waarschuwingen.push(`Coverbeeld is ${beeldPpi} ppi (doel ${C.minPpi}). Nodig: ca. ${Math.round(doelB)}×${Math.round(doelH)} px bron; het is nu opgeschaald, dat geeft geen extra detail.`);
    }
    pagina.drawImage(await doc.embedJpg(beeld.jpg), { x: mm(vak.x), y: mm(vak.y), width: mm(vak.b), height: mm(vak.h) });
  } else {
    waarschuwingen.push("Geen tekenplaat beschikbaar voor het coverbeeld; het beeldvlak is leeg (roze).");
  }

  // 3. Sticker rechtsboven over het beeld: vector, eigen kleuren, geen extra rotatie.
  const stickerOnder = trimBoven - C.sticker.marge - C.sticker.maat;
  {
    const [sticker] = await doc.embedPdf(await readFile(path.join(assets, "brand", "sticker-blauw.pdf")));
    pagina.drawPage(sticker, {
      x: mm(trimRechts - C.sticker.marge - C.sticker.maat),
      y: mm(stickerOnder),
      width: mm(C.sticker.maat),
      height: mm(C.sticker.maat),
    });
  }

  // 4. Merkuiting achterplat: vector uit het ontwerp van de designer, ongewijzigd.
  {
    const [logo] = await doc.embedPdf(await readFile(path.join(assets, "brand", "achterplat-logo.pdf")));
    const b = C.achterLogo.breedte;
    const h = (logo.height / logo.width) * b;
    pagina.drawPage(logo, { x: mm(afloop + C.achterLogo.x), y: mm(trimBoven - C.achterLogo.y - h), width: mm(b), height: mm(h) });
  }

  // 5. Titel: Archivo Black, kapitalen, laatste woord roze en alleen op de laatste regel.
  const fontBestand = await readFile(path.join(assets, "fonts", "Archivo-Black.ttf"));
  const font: Meetfont = { pdf: await doc.embedFont(fontBestand, { subset: true }), fk: fontkit.create(fontBestand) };
  const woorden = schoon(boek.titel).toLocaleUpperCase("nl-NL").split(/\s+/).filter(Boolean);
  const laatste = woorden.pop() ?? "";
  const titelX = voorX + C.titel.linksVanafVoorplat;
  const maxB = mm(trimRechts - C.titel.rechtsMarge - titelX);
  const maxOmhoog = mm(stickerOnder - 2 - scheiding); // blauwe regels mogen de sticker niet raken
  const maxOmlaag = mm(scheiding - (afloop + C.titel.onderMarge));
  let titelGrootte: number | null = null;
  let blauw: string[] = [];
  if (laatste) {
    for (let g = C.titel.start; g >= C.titel.min - 1e-9; g = Math.round((g - C.titel.stap) * 100) / 100) {
      const regels = woorden.length ? verdeelWoorden(woorden, font, g, maxB) : [];
      if (!regels || regels.length > C.titel.maxRegels - 1) continue;
      const roze = inktRegel(font, laatste, g);
      if (roze.rechts > maxB || roze.boven - roze.onder > maxOmlaag) continue;
      const omhoog = regels.reduce((som, r) => { const i = inktRegel(font, r, g); return som + i.boven - i.onder; }, 0);
      if (omhoog > maxOmhoog) continue;
      titelGrootte = g;
      blauw = regels;
      break;
    }
    const g = titelGrootte ?? C.titel.min;
    if (titelGrootte === null) {
      waarschuwingen.push(`Titel past niet, ook niet op ${C.titel.min} pt: vraag de klant om een kortere titel (de tekst is niet aangepast).`);
      blauw = woorden.length ? [woorden.join(" ")] : [];
    }
    // Roze regel: zichtbare bovenkant op de scheidingslijn.
    const roze = inktRegel(font, laatste, g);
    tekenMetKerning(pagina, font, laatste, g, mm(titelX), mm(scheiding) - roze.boven, hex(C.kleuren.roze));
    // Blauwe regels: van de scheidingslijn omhoog, zichtbare onderkant op de bovenkant van de regel eronder.
    let rand = mm(scheiding);
    for (const regel of [...blauw].reverse()) {
      const i = inktRegel(font, regel, g);
      tekenMetKerning(pagina, font, regel, g, mm(titelX), rand - i.onder, hex(C.kleuren.blauw));
      rand += i.boven - i.onder;
    }
  }

  if (!C.bevestigd) {
    waarschuwingen.push("Covermaten en rugbreedte komen uit de referentie van de designer en zijn nog niet bevestigd door PrintAPI: niet drukklaar.");
  }

  const pdf = await doc.save();
  return {
    pdf,
    controle: {
      titelGrootte,
      titelRegels: laatste ? [...blauw, laatste] : [],
      beeldPpi,
      beeldPixels,
      rugBreedte: rug,
      covermaat: `${breedte} × ${hoogte} mm (afloop ${afloop} mm)`,
      bevestigd: C.bevestigd,
      waarschuwingen,
    },
  };
}
