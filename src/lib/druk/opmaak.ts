// Opmaak van de drukbestanden voor PrintAPI: binnenwerk en cover.
// Binnenwerk volgens de briefing van de designer (Fraunces 9pt Black + Archivo
// SemiBold, vaste tekstvakken, kleurthema's, platen paginavullend).
// Bewust zonder "server-only" en zonder database, zodat deze module ook los
// te testen is met een script. Invoer: teksten, kleuren en tekenplaten.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFPage, PDFImage, degrees, rgb, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Font as FkFont } from "@pdf-lib/fontkit";
import sharp from "sharp";

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

type Fonts = { titel: PDFFont; tekst: PDFFont; vet: PDFFont };

const assets = path.join(process.cwd(), "assets");

async function laadFonts(doc: PDFDocument): Promise<Fonts> {
  doc.registerFontkit(fontkit);
  const lees = (naam: string) => readFile(path.join(assets, "fonts", naam));
  const [titel, tekst, vet] = await Promise.all([
    lees("fraunces-latin-900-normal.woff"),
    lees("archivo-latin-400-normal.woff"),
    lees("archivo-latin-600-normal.woff"),
  ]);
  return {
    titel: await doc.embedFont(titel, { subset: true }),
    tekst: await doc.embedFont(tekst, { subset: true }),
    vet: await doc.embedFont(vet, { subset: true }),
  };
}

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

/** Tekent een plaat passend (contain) en gecentreerd in een vak. */
function tekenPlaat(pagina: PDFPage, plaat: PDFImage, vak: { x: number; y: number; breedte: number; hoogte: number }) {
  const schaal = Math.min(vak.breedte / plaat.width, vak.hoogte / plaat.height);
  const b = plaat.width * schaal;
  const h = plaat.height * schaal;
  pagina.drawImage(plaat, { x: vak.x + (vak.breedte - b) / 2, y: vak.y + (vak.hoogte - h) / 2, width: b, height: h });
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

/** Logo (PNG met transparantie) eenkleurig maken in de gegeven kleur. */
async function logoInKleur(kleur: string): Promise<Buffer> {
  const bron = sharp(await readFile(path.join(assets, "brand", "mark-color.png")));
  const { width, height } = await bron.metadata();
  const alfa = await bron.clone().ensureAlpha().extractChannel("alpha").toBuffer();
  return sharp({
    create: { width: width!, height: height!, channels: 3, background: rgbVan(kleur) },
  })
    .joinChannel(alfa)
    .png()
    .toBuffer();
}

export type Platen = { binnen: (Buffer | null)[]; voorplaat: Buffer | null };

function rgbVan(kleur: string) {
  const h = kleur.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

/**
 * Bereidt de tekenplaten voor op druk, zonder details te verliezen:
 * - binnenwerk: grijswaarden, opgeschaald voor een scherpe weergave op de pagina;
 * - cover: lijnen in de tekstkleur van de cover, met transparante achtergrond.
 */
export async function bereidPlatenVoor(boek: DrukBoek): Promise<Platen> {
  const binnen: (Buffer | null)[] = [];
  for (const p of boek.paginas) {
    binnen.push(
      p.plaat
        ? // Grijze JPEG: wordt ongewijzigd in de PDF gezet (PNG zou als volle kleur worden opgeslagen).
          await sharp(p.plaat).rotate().flatten({ background: "#ffffff" }).grayscale().toColourspace("b-w").resize({ height: 3600, kernel: "lanczos3" }).jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true }).toBuffer()
        : null,
    );
  }
  const eerste = boek.paginas.find((p) => p.plaat)?.plaat ?? null;
  let voorplaat: Buffer | null = null;
  if (eerste) {
    // Donker = lijn: de negatieve grijswaarde wordt de dekking, de kleur is die van de covertekst.
    const grijs = sharp(eerste).rotate().flatten({ background: "#ffffff" }).grayscale().resize({ height: 2600, kernel: "lanczos3" });
    const { data, info } = await grijs.negate().raw().toBuffer({ resolveWithObject: true });
    const alfa = await sharp(data, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer();
    voorplaat = await sharp({ create: { width: info.width, height: info.height, channels: 3, background: rgbVan(boek.cover.tekst) } })
      .joinChannel(alfa)
      .png({ compressionLevel: 9 })
      .toBuffer();
  }
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

export async function maakCover(boek: DrukBoek, maten: Maten, platen: Platen): Promise<Uint8Array> {
  const { breedte, hoogte, afloop, rug } = maten.cover;
  const doc = await PDFDocument.create();
  doc.setTitle(`${boek.titel} – cover`);
  doc.setProducer("Tante Kleur");
  const fonts = await laadFonts(doc);
  const achtergrond = hex(boek.cover.achtergrond);
  const tekstKleur = hex(boek.cover.tekst);

  const pagina = doc.addPage([mm(breedte), mm(hoogte)]);
  zetKaders(pagina, breedte, hoogte, afloop);
  pagina.drawRectangle({ x: 0, y: 0, width: mm(breedte), height: mm(hoogte), color: achtergrond });

  const paneel = (breedte - 2 * afloop - rug) / 2; // breedte achter- en voorkant
  const binnenHoogte = hoogte - 2 * afloop;
  const achter = { x: afloop, y: afloop };
  const rugX = afloop + paneel;
  const voor = { x: rugX + rug, y: afloop };
  const marge = 18; // veilige afstand tot de snij- en vouwlijn

  // Voorkant: titel bovenaan, eerste kleurplaat eronder in de tekstkleur.
  const titel = schoon(boek.titel);
  const titelBreedte = mm(paneel - 2 * marge);
  let grootte = 54;
  let regels = breekAf(titel, fonts.titel, grootte, titelBreedte);
  while ((regels.length > 2 || regels.some((r) => fonts.titel.widthOfTextAtSize(r, grootte) > titelBreedte)) && grootte > 24) {
    grootte -= 2;
    regels = breekAf(titel, fonts.titel, grootte, titelBreedte);
  }
  let y = mm(voor.y + binnenHoogte - marge - 6) - grootte;
  for (const regel of regels) {
    const w = fonts.titel.widthOfTextAtSize(regel, grootte);
    pagina.drawText(regel, { x: mm(voor.x) + (mm(paneel) - w) / 2, y, size: grootte, font: fonts.titel, color: tekstKleur });
    y -= grootte * 1.08;
  }
  if (platen.voorplaat) {
    const vak = { x: mm(voor.x + marge + 6), y: mm(voor.y + marge), breedte: mm(paneel - 2 * marge - 12), hoogte: y - mm(voor.y + marge) - mm(6) };
    tekenPlaat(pagina, await doc.embedPng(platen.voorplaat), vak);
  }

  // Rug: titel van boven naar beneden.
  {
    const rugGrootte = Math.min(10, mm(rug) * 0.55);
    let rugTitel = titel.replace(/\s*\n\s*/g, " ");
    const max = mm(binnenHoogte - 2 * marge);
    while (fonts.vet.widthOfTextAtSize(rugTitel, rugGrootte) > max && rugTitel.length > 3) rugTitel = `${rugTitel.slice(0, -2).trimEnd()}…`;
    const w = fonts.vet.widthOfTextAtSize(rugTitel, rugGrootte);
    const hoogteLetter = fonts.vet.heightAtSize(rugGrootte, { descender: false });
    pagina.drawText(rugTitel, {
      x: mm(rugX + rug / 2) - hoogteLetter / 2 + hoogteLetter * 0.08,
      y: mm(afloop + binnenHoogte / 2) + w / 2,
      size: rugGrootte,
      font: fonts.vet,
      color: tekstKleur,
      rotate: degrees(-90),
    });
  }

  // Achterkant: logo in de tekstkleur, met de website eronder.
  {
    const logo = await doc.embedPng(await logoInKleur(boek.cover.tekst));
    const b = mm(55);
    const h = (logo.height / logo.width) * b;
    const midden = mm(achter.x + paneel / 2);
    pagina.drawImage(logo, { x: midden - b / 2, y: mm(achter.y + binnenHoogte * 0.42), width: b, height: h });
    const regel = "tantekleur.nl";
    const w = fonts.tekst.widthOfTextAtSize(regel, 11);
    pagina.drawText(regel, { x: midden - w / 2, y: mm(achter.y + binnenHoogte * 0.42) - 22, size: 11, font: fonts.tekst, color: tekstKleur });
  }

  return doc.save();
}
