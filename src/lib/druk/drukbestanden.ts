import "server-only";
import { binnenKleur, boek as boekConfig, drukwerk, merkHex } from "@/config";
import { getSupabase, buckets } from "@/lib/supabase";
import { haalPaginas, type Order } from "@/lib/orders";
import { aantalFotos, maakBinnenwerk, maakCover, traceerAlle, type DrukBoek } from "./opmaak";

// Privé-opslag voor de drukklare PDF's (bevatten kleurplaten van klantfoto's).
const BUCKET = "drukbestanden";

async function zorgVoorBucket() {
  const db = getSupabase();
  const { data } = await db.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await db.storage.createBucket(BUCKET, { public: false, allowedMimeTypes: ["application/pdf"], fileSizeLimit: 52428800 });
  if (error && !/already exists/i.test(error.message)) throw new Error(`Bucket aanmaken mislukt: ${error.message}`);
}

/**
 * Maakt cover.pdf en binnenwerk.pdf voor een order, slaat ze op in Supabase
 * en geeft tijdelijke downloadlinks (2 uur) terug.
 */
export async function maakDrukbestanden(order: Order) {
  const db = getSupabase();
  const paginas = await haalPaginas(order.id);
  const n = aantalFotos(drukwerk);
  const gebruikt = paginas.slice(0, n);

  // Tekenplaten ophalen.
  const platen = await Promise.all(
    gebruikt.map(async (p) => {
      if (!p.tekenplaat_pad) return null;
      const { data, error } = await db.storage.from(buckets.tekenplaten).download(p.tekenplaat_pad);
      if (error || !data) throw new Error(`Tekenplaat pagina ${p.positie} ophalen mislukt: ${error?.message}`);
      return Buffer.from(await data.arrayBuffer());
    }),
  );

  const cover = boekConfig.coverKleuren.find((k) => k.value === order.cover_kleur) ?? boekConfig.coverKleuren[0];
  const binnen = binnenKleur(order.binnen_kleur);
  const boek: DrukBoek = {
    titel: order.cover_titel ?? "Mijn kleurboek",
    cover: { achtergrond: merkHex[cover.kleur], tekst: merkHex[cover.tekst] },
    binnen: { achtergrond: merkHex[binnen.value], tekst: merkHex[binnen.tekst] },
    inleiding: order.inleiding ?? "",
    nawoord: order.nawoord ?? "",
    paginas: gebruikt.map((p, i) => ({ verhaal: p.verhaal ?? "", plaat: platen[i] })),
  };

  const vectoren = await traceerAlle(boek, drukwerk);
  const [binnenwerk, coverPdf] = await Promise.all([
    maakBinnenwerk(boek, drukwerk, vectoren),
    maakCover(boek, drukwerk, vectoren.find((v) => v) ?? null),
  ]);

  await zorgVoorBucket();
  const opslag = db.storage.from(BUCKET);
  const bestanden = [
    { naam: "binnenwerk.pdf", data: binnenwerk },
    { naam: "cover.pdf", data: coverPdf },
  ];
  for (const b of bestanden) {
    const { error } = await opslag.upload(`${order.id}/${b.naam}`, b.data, { contentType: "application/pdf", upsert: true });
    if (error) throw new Error(`${b.naam} opslaan mislukt: ${error.message}`);
  }
  const links = await opslag.createSignedUrls(
    bestanden.map((b) => `${order.id}/${b.naam}`),
    2 * 60 * 60,
    // Downloaden met een herkenbare naam.
  );
  if (links.error) throw new Error(`Downloadlinks maken mislukt: ${links.error.message}`);

  return {
    paginas: drukwerk.paginas,
    fotosGebruikt: gebruikt.length,
    fotosTotaal: paginas.length,
    platenOntbreken: gebruikt.filter((p) => !p.tekenplaat_pad).map((p) => p.positie),
    binnenwerk: links.data[0]?.signedUrl ?? null,
    cover: links.data[1]?.signedUrl ?? null,
  };
}

/** Drukbestanden opruimen (na verzending). Fouten worden gelogd, niet gegooid. */
export async function verwijderDrukbestanden(orderId: string) {
  const { error } = await getSupabase().storage.from(BUCKET).remove([`${orderId}/binnenwerk.pdf`, `${orderId}/cover.pdf`]);
  if (error && !/not found/i.test(error.message)) console.error("Drukbestanden verwijderen mislukt:", error.message);
}
