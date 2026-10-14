// Foto's voorbereiden in de browser, vóór het uploaden:
// - HEIC (iPhone) omzetten als de browser het zelf niet kan openen;
// - rechtop zetten volgens de EXIF-oriëntatie (en daarmee EXIF/GPS weghalen);
// - verkleinen tot een ruime maat voor de AI, onder de 4 MB;
// - een kleine versie maken voor op het scherm.

const GROOT = 2560; // langste zijde in pixels
const KLEIN = 520;
const MAX_BYTES = 3.8 * 1024 * 1024;

export type VoorbereideFoto = { groot: Blob; klein: Blob; teKlein: boolean };

function isHeic(bestand: File) {
  return /hei[cf]/i.test(bestand.type) || /\.(heic|heif)$/i.test(bestand.name);
}

async function openBeeld(bestand: Blob): Promise<ImageBitmap> {
  return createImageBitmap(bestand, { imageOrientation: "from-image" });
}

function naarJpeg(beeld: ImageBitmap, langsteZijde: number, kwaliteit: number): Promise<Blob> {
  const schaal = Math.min(1, langsteZijde / Math.max(beeld.width, beeld.height));
  const breedte = Math.round(beeld.width * schaal);
  const hoogte = Math.round(beeld.height * schaal);
  const canvas = document.createElement("canvas");
  canvas.width = breedte;
  canvas.height = hoogte;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas niet beschikbaar");
  ctx.fillStyle = "#ffffff"; // transparante PNG's krijgen een witte achtergrond
  ctx.fillRect(0, 0, breedte, hoogte);
  ctx.drawImage(beeld, 0, 0, breedte, hoogte);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Omzetten mislukt"))), "image/jpeg", kwaliteit),
  );
}

export async function bereidFotoVoor(bestand: File): Promise<VoorbereideFoto> {
  let beeld: ImageBitmap;
  try {
    beeld = await openBeeld(bestand);
  } catch (eerste) {
    if (!isHeic(bestand)) throw new Error("Deze foto kan niet worden geopend. Kies een JPG- of PNG-foto.", { cause: eerste });
    // Pas laden als het nodig is: de HEIC-omzetter is vrij groot.
    const { default: heic2any } = await import("heic2any");
    const omgezet = await heic2any({ blob: bestand, toType: "image/jpeg", quality: 0.92 });
    beeld = await openBeeld(Array.isArray(omgezet) ? omgezet[0] : omgezet);
  }

  try {
    let groot = await naarJpeg(beeld, GROOT, 0.88);
    for (const kwaliteit of [0.78, 0.68, 0.58]) {
      if (groot.size <= MAX_BYTES) break;
      groot = await naarJpeg(beeld, GROOT, kwaliteit);
    }
    if (groot.size > MAX_BYTES) groot = await naarJpeg(beeld, 2000, 0.7);
    const klein = await naarJpeg(beeld, KLEIN, 0.75);
    return { groot, klein, teKlein: Math.max(beeld.width, beeld.height) < 1200 };
  } finally {
    beeld.close();
  }
}
