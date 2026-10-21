// Automatische nabewerking van de tekenplaten voor het binnenwerk.
// Geldt voor élke plaat (gegenereerd of geüpload) met één set instellingen in
// `plaatNabewerking` (config). Het origineel in Supabase blijft ongewijzigd;
// dit gebeurt pas bij het maken van de drukbestanden.
//
// Stappen (alle maten in mm, dus onafhankelijk van de resolutie van de bron):
// 1. Opschalen naar drukresolutie (vóór het zwart-wit maken, voor strakke randen).
// 2. Niveaus: gebroken wit wordt zuiver wit, donkergrijs wordt zwart; zachte
//    overgang blijft (anti-aliasing), lichte arcering verdwijnt.
// 3. Losse vlekjes kleiner dan `minVlek` weg.
// 4. Lijnen een fractie dikker (`verdikking`); dicht meteen kleine gaatjes.
// 5. Lijnkleur: zwart, of bijvoorbeeld donkergrijs voor een zachtere uitstraling.

import sharp from "sharp";

export type NabewerkingInstellingen = {
  aan: boolean;
  doelHoogtePx: number; // hoogte na opschalen (A4 + afloop ≈ 303 mm → 3600 px ≈ 300 dpi)
  zwartpunt: number; // 0–255: alles donkerder wordt volledig zwart
  witpunt: number; // 0–255: alles lichter wordt zuiver wit
  minVlek: number; // mm²: donkere vlekjes kleiner dan dit worden verwijderd (0 = uit)
  verdikking: number; // mm: lijnen zoveel dikker maken (0 = uit)
  lijnKleur: string; // hex, bv. "#000000" of "#3c3c3c"
};

/** Bewerkt een plaat en geeft een grijze JPEG terug op drukresolutie. */
export async function nabewerkPlaat(plaat: Buffer, inst: NabewerkingInstellingen, paginaHoogteMm: number): Promise<Buffer> {
  const basis = sharp(plaat).rotate().flatten({ background: "#ffffff" }).grayscale();
  if (!inst.aan) {
    return basis.toColourspace("b-w").resize({ height: inst.doelHoogtePx, kernel: "lanczos3" }).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  }

  // 1. Opschalen.
  const { data, info } = await basis.resize({ height: inst.doelHoogtePx, kernel: "lanczos3" }).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const kanalen = info.channels;
  const pxPerMm = h / paginaHoogteMm;
  const v = new Uint8Array(w * h);

  // 2. Niveaus.
  const bereik = Math.max(1, inst.witpunt - inst.zwartpunt);
  for (let i = 0; i < w * h; i++) {
    const x = (data[i * kanalen] - inst.zwartpunt) / bereik;
    v[i] = x <= 0 ? 0 : x >= 1 ? 255 : Math.round(x * 255);
  }

  // 3. Losse vlekjes weg: samenhangende donkere gebieden onder de minimale oppervlakte.
  if (inst.minVlek > 0) verwijderVlekjes(v, w, h, Math.round(inst.minVlek * pxPerMm * pxPerMm));

  // 4. Verdikken: grijswaarde-minimumfilter over een schijf, zodat zachte randen zacht blijven.
  //    (De morfologie van sharp werkt op een zwart-witmasker en maakt dunne lijnen vlekkerig.)
  const straal = inst.verdikking * pxPerMm;
  const resultaat = straal >= 0.5 ? minimumFilter(v, w, h, straal) : v;

  let beeld = sharp(Buffer.from(resultaat), { raw: { width: w, height: h, channels: 1 } });

  // 5. Lijnkleur: zwart → lijnKleur, wit blijft wit.
  const k = grijsVan(inst.lijnKleur);
  if (k > 0) beeld = beeld.linear((255 - k) / 255, k);

  return beeld.toColourspace("b-w").jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}

/** Per pixel de donkerste waarde binnen een schijf met straal r (px): donkere lijnen worden dikker. */
function minimumFilter(v: Uint8Array, w: number, h: number, r: number) {
  const offsets: [number, number][] = [];
  const R = Math.ceil(r);
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (dx * dx + dy * dy <= r * r) offsets.push([dx, dy]);
  const uit = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 255;
      for (const [dx, dy] of offsets) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const p = v[ny * w + nx];
        if (p < m) m = p;
      }
      uit[y * w + x] = m;
    }
  }
  return uit;
}

function grijsVan(hex: string) {
  const s = hex.replace("#", "");
  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

/** Maakt kleine samenhangende donkere gebieden (< minPx pixels) wit, inclusief hun zachte rand. */
function verwijderVlekjes(v: Uint8Array, w: number, h: number, minPx: number) {
  const DONKER = 160; // wat telt als inkt
  const gezien = new Uint8Array(w * h);
  const stapel = new Int32Array(w * h);
  const leden: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (gezien[start] || v[start] >= DONKER) continue;
    // Vul het gebied (8-buren); stop met verzamelen zodra het groot genoeg is.
    let top = 0;
    stapel[top++] = start;
    gezien[start] = 1;
    leden.length = 0;
    let groot = false;
    while (top > 0) {
      const i = stapel[--top];
      if (!groot) {
        leden.push(i);
        if (leden.length >= minPx) groot = true;
      }
      const x = i % w;
      const y = (i - x) / w;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if ((dx || dy) && nx >= 0 && nx < w) {
            const j = ny * w + nx;
            if (!gezien[j] && v[j] < DONKER) {
              gezien[j] = 1;
              stapel[top++] = j;
            }
          }
        }
      }
    }
    if (groot) continue;
    // Klein gebied: wit maken, plus de directe rand (zachte overgang) eromheen.
    for (const i of leden) {
      const x = i % w;
      const y = (i - x) / w;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const j = ny * w + nx;
            if (v[j] >= DONKER || j === i) v[j] = 255;
          }
        }
      }
    }
  }
}
