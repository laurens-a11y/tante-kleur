// Opmaak van de drukbestanden voor PrintAPI: binnenwerk en cover.
// Bewust zonder "server-only" en zonder database, zodat deze module ook los
// te testen is met een script. Invoer: teksten, kleuren en tekenplaten.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFPage, PDFImage, degrees, rgb, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";

const MM = 72 / 25.4;
const mm = (waarde: number) => waarde * MM;

export type Kleur = { achtergrond: string; tekst: string };

export type DrukBoek = {
  titel: string;
  cover: Kleur;
  binnen: Kleur;
  inleiding: string;
  nawoord: string;
  // In de volgorde van het boek; tekenplaat als PNG/JPG, of null als die ontbreekt.
  paginas: { verhaal: string; plaat: Buffer | null }[];
};

export type Maten = {
  paginas: number;
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

/**
 * Zet een tekstblok verticaal gecentreerd in een vak. Is de tekst te lang,
 * dan wordt de letter kleiner (tot een minimum) zodat alles past.
 */
function tekstBlok(
  pagina: PDFPage,
  tekst: string,
  opties: {
    font: PDFFont;
    grootte: number;
    min: number;
    kleur: RGB;
    x: number;
    y: number;
    breedte: number;
    hoogte: number;
    regelafstand?: number;
    gecentreerd?: boolean;
  },
) {
  const factor = opties.regelafstand ?? 1.5;
  let grootte = opties.grootte;
  let regels = breekAf(tekst, opties.font, grootte, opties.breedte);
  while (regels.length * grootte * factor > opties.hoogte && grootte > opties.min) {
    grootte -= 0.5;
    regels = breekAf(tekst, opties.font, grootte, opties.breedte);
  }
  const lijn = grootte * factor;
  const totaal = regels.length * lijn;
  let y = opties.y + opties.hoogte / 2 + totaal / 2 - grootte;
  for (const regel of regels) {
    if (regel) {
      const x = opties.gecentreerd ? opties.x + (opties.breedte - opties.font.widthOfTextAtSize(regel, grootte)) / 2 : opties.x;
      pagina.drawText(regel, { x, y, size: grootte, font: opties.font, color: opties.kleur });
    }
    y -= lijn;
  }
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

export function aantalFotos(maten: Maten) {
  // Pagina 1–2: leeg + inleiding; laatste 2: nawoord + afsluiter; daartussen 2 per foto.
  return Math.max(0, Math.floor((maten.paginas - 4) / 2));
}

export type Platen = { binnen: (Buffer | null)[]; voorplaat: Buffer | null };

function rgbVan(kleur: string) {
  const h = kleur.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

/**
 * Bereidt de tekenplaten voor op druk, zonder details te verliezen:
 * - binnenwerk: grijswaarden, opgeschaald naar ±300 dpi op de pagina;
 * - cover: lijnen in de tekstkleur van de cover, met transparante achtergrond.
 */
export async function bereidPlatenVoor(boek: DrukBoek, maten: Maten): Promise<Platen> {
  const n = aantalFotos(maten);
  const binnen: (Buffer | null)[] = [];
  for (const p of boek.paginas.slice(0, n)) {
    binnen.push(
      p.plaat
        ? // Grijze JPEG: wordt ongewijzigd in de PDF gezet (PNG zou als volle kleur worden opgeslagen).
          await sharp(p.plaat).rotate().flatten({ background: "#ffffff" }).grayscale().toColourspace("b-w").resize({ height: 3300, kernel: "lanczos3" }).jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true }).toBuffer()
        : null,
    );
  }
  const eerste = boek.paginas.slice(0, n).find((p) => p.plaat)?.plaat ?? null;
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

export async function maakBinnenwerk(boek: DrukBoek, maten: Maten, platen: Platen): Promise<Uint8Array> {
  const { breedte, hoogte, afloop } = maten.binnenwerk;
  const doc = await PDFDocument.create();
  doc.setTitle(`${boek.titel} – binnenwerk`);
  doc.setProducer("Tante Kleur");
  const fonts = await laadFonts(doc);
  const binnenAchtergrond = hex(boek.binnen.achtergrond);
  const binnenTekst = hex(boek.binnen.tekst);
  const blauw = hex("#002cd4");
  const n = aantalFotos(maten);

  // Marges vanaf de snijlijn; aan de rugzijde iets ruimer.
  const buiten = 20;
  const rugzijde = 24;
  const boven = 28;
  const onder = 28;

  function nieuwePagina(kant: "links" | "rechts", achtergrond?: RGB) {
    const pagina = doc.addPage([mm(breedte), mm(hoogte)]);
    zetKaders(pagina, breedte, hoogte, afloop);
    // Achtergrondkleur loopt door tot in de afloop.
    if (achtergrond) pagina.drawRectangle({ x: 0, y: 0, width: mm(breedte), height: mm(hoogte), color: achtergrond });
    const links = afloop + (kant === "links" ? buiten : rugzijde);
    const rechts = afloop + (kant === "links" ? rugzijde : buiten);
    const vak = { x: mm(links), y: mm(afloop + onder), breedte: mm(breedte - links - rechts), hoogte: mm(hoogte - afloop * 2 - boven - onder) };
    return { pagina, vak };
  }

  const isWit = boek.binnen.achtergrond.toLowerCase() === "#ffffff";
  const kleurvlak = isWit ? undefined : binnenAchtergrond;

  // 1 (links): leeg (wit vlak, zodat de pagina inhoud heeft voor de spreads).
  nieuwePagina("links", rgb(1, 1, 1));

  // 2 (rechts): titel en inleiding, samen verticaal gecentreerd.
  {
    const { pagina, vak } = nieuwePagina("rechts", kleurvlak);
    const titelGrootte = 28;
    const titelRegels = breekAf(schoon(boek.titel), fonts.titel, titelGrootte, vak.breedte);
    const titelHoogte = titelRegels.length * titelGrootte * 1.1;
    const tussen = mm(10);
    let grootte = 13;
    let regels = breekAf(schoon(boek.inleiding), fonts.tekst, grootte, vak.breedte);
    while (titelHoogte + tussen + regels.length * grootte * 1.5 > vak.hoogte && grootte > 9) {
      grootte -= 0.5;
      regels = breekAf(schoon(boek.inleiding), fonts.tekst, grootte, vak.breedte);
    }
    const totaal = titelHoogte + (regels.length ? tussen + regels.length * grootte * 1.5 : 0);
    let y = vak.y + vak.hoogte / 2 + totaal / 2 - titelGrootte;
    for (const regel of titelRegels) {
      pagina.drawText(regel, { x: vak.x, y, size: titelGrootte, font: fonts.titel, color: binnenTekst });
      y -= titelGrootte * 1.1;
    }
    // Van de laatste titelregel naar de eerste tekstregel.
    y = y + titelGrootte * 1.1 - tussen - grootte;
    for (const regel of regels) {
      if (regel) pagina.drawText(regel, { x: vak.x, y, size: grootte, font: fonts.tekst, color: binnenTekst });
      y -= grootte * 1.5;
    }
  }

  // Spreads: verhaal links, plaat rechts.
  for (let i = 0; i < n; i++) {
    const bron = boek.paginas[i];
    {
      const { pagina, vak } = nieuwePagina("links", kleurvlak);
      if (bron) tekstBlok(pagina, schoon(bron.verhaal), { font: fonts.tekst, grootte: 15, min: 10, kleur: binnenTekst, x: vak.x, y: vak.y, breedte: vak.breedte, hoogte: vak.hoogte, gecentreerd: true });
    }
    {
      const pagina = doc.addPage([mm(breedte), mm(hoogte)]);
      zetKaders(pagina, breedte, hoogte, afloop);
      // Plaat: ruim op de pagina, 12 mm van de snijlijn, 16 mm aan de rugzijde.
      const vak = { x: mm(afloop + 16), y: mm(afloop + 12), breedte: mm(breedte - 2 * afloop - 16 - 12), hoogte: mm(hoogte - 2 * afloop - 24) };
      const plaat = platen.binnen[i];
      if (plaat) tekenPlaat(pagina, await doc.embedJpg(plaat), vak);
      else plaatOntbreekt(pagina, vak, fonts.tekst);
    }
  }

  // Voorlaatste (links): nawoord.
  {
    const { pagina, vak } = nieuwePagina("links", kleurvlak);
    tekstBlok(pagina, schoon(boek.nawoord), { font: fonts.tekst, grootte: 13, min: 9, kleur: binnenTekst, x: vak.x, y: vak.y, breedte: vak.breedte, hoogte: vak.hoogte, gecentreerd: true });
  }

  // Laatste (rechts): afsluiter met logo.
  {
    const { pagina, vak } = nieuwePagina("rechts");
    const logo = await doc.embedPng(await readFile(path.join(assets, "brand", "mark-color.png")));
    const b = mm(60);
    const h = (logo.height / logo.width) * b;
    pagina.drawImage(logo, { x: vak.x + (vak.breedte - b) / 2, y: vak.y + vak.hoogte / 2, width: b, height: h });
    const regel = "Met liefde getekend door Tante Kleur · tantekleur.nl";
    const w = fonts.tekst.widthOfTextAtSize(regel, 9);
    pagina.drawText(regel, { x: vak.x + (vak.breedte - w) / 2, y: vak.y + vak.hoogte / 2 - 24, size: 9, font: fonts.tekst, color: blauw });
  }

  if (doc.getPageCount() !== maten.paginas) {
    throw new Error(`Binnenwerk heeft ${doc.getPageCount()} pagina's in plaats van ${maten.paginas}`);
  }
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
