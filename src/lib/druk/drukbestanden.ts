import "server-only";
import { binnenKleur, boek as boekConfig, drukwerk, merkHex } from "@/config";
import { getSupabase, buckets } from "@/lib/supabase";
import { haalPaginas, type Order } from "@/lib/orders";
import { aantalFotos, bereidPlatenVoor, maakBinnenwerk, maakCover, type DrukBoek } from "./opmaak";
import { binnenwerkInSpreads, coverMetSnijtekens } from "./uitvoer";

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
  const plaatBestanden = await Promise.all(
    gebruikt.map(async (p) => {
      if (!p.tekenplaat_pad) return null;
      const { data, error } = await db.storage.from(buckets.tekenplaten).download(p.tekenplaat_pad);
      if (error || !data) throw new Error(`Tekenplaat pagina ${p.positie} ophalen mislukt: ${error?.message}`);
      return Buffer.from(await data.arrayBuffer());
    }),
  );

  // Vaste kleuren (fase 1) of de keuze van de klant.
  const coverKeuze = drukwerk.vasteKleuren?.cover ?? order.cover_kleur;
  const binnenKeuze = drukwerk.vasteKleuren?.binnen ?? order.binnen_kleur;
  const cover = boekConfig.coverKleuren.find((k) => k.value === coverKeuze) ?? boekConfig.coverKleuren[0];
  const binnen = binnenKleur(binnenKeuze);
  const boek: DrukBoek = {
    titel: order.cover_titel ?? "Mijn kleurboek",
    cover: { achtergrond: merkHex[cover.kleur], tekst: merkHex[cover.tekst] },
    binnen: { achtergrond: merkHex[binnen.value], tekst: merkHex[binnen.tekst] },
    inleiding: order.inleiding ?? "",
    nawoord: order.nawoord ?? "",
    paginas: gebruikt.map((p, i) => ({ verhaal: p.verhaal ?? "", plaat: plaatBestanden[i] })),
  };

  const platen = await bereidPlatenVoor(boek, drukwerk);
  const [binnenwerk, coverPdf] = await Promise.all([maakBinnenwerk(boek, drukwerk, platen), maakCover(boek, drukwerk, platen)]);
  const [spreads, coverSnij] = await Promise.all([binnenwerkInSpreads(binnenwerk, drukwerk, true), coverMetSnijtekens(coverPdf, drukwerk)]);

  await zorgVoorBucket();
  const opslag = db.storage.from(BUCKET);
  // Twee sets: met spreads en snijtekens, en exact volgens de specs van PrintAPI.
  const bestanden = [
    { naam: "binnenwerk-spreads-snijtekens.pdf", data: spreads },
    { naam: "cover-snijtekens.pdf", data: coverSnij },
    { naam: "binnenwerk-printapi.pdf", data: binnenwerk },
    { naam: "cover-printapi.pdf", data: coverPdf },
  ];
  for (const b of bestanden) {
    const { error } = await opslag.upload(`${order.id}/${b.naam}`, b.data, { contentType: "application/pdf", upsert: true });
    if (error) throw new Error(`${b.naam} opslaan mislukt: ${error.message}`);
  }
  const links = await opslag.createSignedUrls(
    bestanden.map((b) => `${order.id}/${b.naam}`),
    2 * 60 * 60,
  );
  if (links.error) throw new Error(`Downloadlinks maken mislukt: ${links.error.message}`);
  const url = (i: number) => links.data[i]?.signedUrl ?? null;

  return {
    paginas: drukwerk.paginas,
    fotosGebruikt: gebruikt.length,
    fotosTotaal: paginas.length,
    platenOntbreken: gebruikt.filter((p) => !p.tekenplaat_pad).map((p) => p.positie),
    vasteKleuren: drukwerk.vasteKleuren ? { cover: cover.label, binnen: binnen.label } : null,
    spreads: url(0),
    coverSnijtekens: url(1),
    binnenwerk: url(2),
    cover: url(3),
  };
}

/** Drukbestanden opruimen (na verzending). Fouten worden gelogd, niet gegooid. */
export async function verwijderDrukbestanden(orderId: string) {
  const namen = ["binnenwerk-spreads-snijtekens.pdf", "cover-snijtekens.pdf", "binnenwerk-printapi.pdf", "cover-printapi.pdf", "binnenwerk.pdf", "cover.pdf"];
  const { error } = await getSupabase().storage.from(BUCKET).remove(namen.map((n) => `${orderId}/${n}`));
  if (error && !/not found/i.test(error.message)) console.error("Drukbestanden verwijderen mislukt:", error.message);
}
