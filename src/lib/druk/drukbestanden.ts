import "server-only";
import { binnenwerkPaginas, boek as boekConfig, drukwerk, inleidingThema, merkHex, themaVoorFoto } from "@/config";
import { getSupabase, buckets } from "@/lib/supabase";
import { haalPaginas, type Order } from "@/lib/orders";
import { bereidPlatenVoor, maakBinnenwerk, maakCover, type DrukBoek, type Thema } from "./opmaak";

// Privé-opslag voor de drukklare PDF's (bevatten kleurplaten van klantfoto's).
const BUCKET = "drukbestanden";

async function zorgVoorBucket() {
  const db = getSupabase();
  const { data } = await db.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await db.storage.createBucket(BUCKET, { public: false, allowedMimeTypes: ["application/pdf"], fileSizeLimit: 52428800 });
  if (error && !/already exists/i.test(error.message)) throw new Error(`Bucket aanmaken mislukt: ${error.message}`);
}

const alsHex = (t: { achtergrond: string; titel: string; tekst: string }): Thema => ({ achtergrond: t.achtergrond, titel: t.titel, tekst: t.tekst });

/**
 * Maakt binnenwerk.pdf en cover.pdf volgens de specs van PrintAPI (losse
 * pagina's met afloop, geen snijtekens), slaat ze op in Supabase en geeft
 * tijdelijke downloadlinks (2 uur) terug.
 */
export async function maakDrukbestanden(order: Order) {
  const db = getSupabase();
  const paginas = await haalPaginas(order.id);
  const gebruikt = paginas.slice(0, boekConfig.maxFotos);

  // Tekenplaten ophalen.
  const plaatBestanden = await Promise.all(
    gebruikt.map(async (p) => {
      if (!p.tekenplaat_pad) return null;
      const { data, error } = await db.storage.from(buckets.tekenplaten).download(p.tekenplaat_pad);
      if (error || !data) throw new Error(`Tekenplaat pagina ${p.positie} ophalen mislukt: ${error?.message}`);
      return Buffer.from(await data.arrayBuffer());
    }),
  );

  // Cover: vaste kleur (fase 1) of de keuze van de klant.
  const coverKeuze = drukwerk.vasteKleuren?.cover ?? order.cover_kleur;
  const cover = boekConfig.coverKleuren.find((k) => k.value === coverKeuze) ?? boekConfig.coverKleuren[0];
  const boek: DrukBoek = {
    titel: order.cover_titel ?? "Mijn kleurboek",
    cover: { achtergrond: merkHex[cover.kleur], tekst: merkHex[cover.tekst] },
    inleiding: order.inleiding ?? "",
    inleidingThema: alsHex(inleidingThema),
    paginas: gebruikt.map((p, i) => ({ titel: p.titel ?? "", verhaal: p.verhaal ?? "", plaat: plaatBestanden[i], thema: alsHex(themaVoorFoto(i)) })),
  };

  const platen = await bereidPlatenVoor(boek);
  const [binnenwerk, coverPdf] = await Promise.all([maakBinnenwerk(boek, drukwerk, platen), maakCover(boek, drukwerk, platen)]);

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
  // Oude bestanden van vorige versies opruimen.
  await opslag.remove(["binnenwerk-spreads-snijtekens.pdf", "cover-snijtekens.pdf", "binnenwerk-printapi.pdf", "cover-printapi.pdf"].map((n) => `${order.id}/${n}`));
  const links = await opslag.createSignedUrls(
    bestanden.map((b) => `${order.id}/${b.naam}`),
    2 * 60 * 60,
  );
  if (links.error) throw new Error(`Downloadlinks maken mislukt: ${links.error.message}`);
  const url = (i: number) => links.data[i]?.signedUrl ?? null;
  const aantalPaginas = binnenwerkPaginas(gebruikt.length);

  return {
    paginas: aantalPaginas,
    veelvoudVan4: aantalPaginas % 4 === 0,
    fotosGebruikt: gebruikt.length,
    fotosTotaal: paginas.length,
    platenOntbreken: gebruikt.filter((p) => !p.tekenplaat_pad).map((p) => p.positie),
    vasteCoverKleur: drukwerk.vasteKleuren ? cover.label : null,
    binnenwerk: url(0),
    cover: url(1),
  };
}

/** Drukbestanden opruimen (na verzending). Fouten worden gelogd, niet gegooid. */
export async function verwijderDrukbestanden(orderId: string) {
  const namen = ["binnenwerk-spreads-snijtekens.pdf", "cover-snijtekens.pdf", "binnenwerk-printapi.pdf", "cover-printapi.pdf", "binnenwerk.pdf", "cover.pdf"];
  const { error } = await getSupabase().storage.from(BUCKET).remove(namen.map((n) => `${orderId}/${n}`));
  if (error && !/not found/i.test(error.message)) console.error("Drukbestanden verwijderen mislukt:", error.message);
}
