import "server-only";
import { randomBytes } from "node:crypto";
import { buckets, getSupabase } from "@/lib/supabase";
import { boekUrl, haalPaginas, verwijderBestanden, type Order, type OrderStatus, type Pagina } from "@/lib/orders";
import { stuurProef } from "@/lib/mail";
import { verwijderDrukbestanden } from "@/lib/druk/drukbestanden";

export type OrderVolledig = Order & {
  verzendadres: { line1?: string; line2?: string; postal_code?: string; city?: string; country?: string } | null;
  aangemaakt_op: string;
};

export type OrderRegel = Pick<OrderVolledig, "id" | "code" | "status" | "cover_titel" | "naam" | "email" | "aangemaakt_op" | "ingediend_op" | "livemode" | "cover_kleur" | "binnen_kleur"> & {
  pages: { id: string; foto_pad: string | null; tekenplaat_pad: string | null; opmerking: string | null }[];
};

export const alleStatussen: { value: OrderStatus; label: string }[] = [
  { value: "betaald", label: "Klant vult in" },
  { value: "ingediend", label: "Ingediend" },
  { value: "in_productie", label: "In productie" },
  { value: "proef_klaar", label: "Proef bij klant" },
  { value: "akkoord", label: "Akkoord" },
  { value: "gedrukt", label: "Naar drukker" },
  { value: "verzonden", label: "Verzonden" },
];

export function statusLabel(status: OrderStatus) {
  return alleStatussen.find((s) => s.value === status)?.label ?? status;
}

export async function lijstOrders(): Promise<OrderRegel[]> {
  const { data, error } = await getSupabase()
    .from("orders")
    .select("id, code, status, cover_titel, naam, email, aangemaakt_op, ingediend_op, livemode, cover_kleur, binnen_kleur, pages(id, foto_pad, tekenplaat_pad, opmerking)")
    .order("aangemaakt_op", { ascending: false })
    .limit(500)
    .returns<OrderRegel[]>();
  if (error) throw new Error(`Orders ophalen mislukt: ${error.message}`);
  return data ?? [];
}

export async function haalOrder(id: string): Promise<OrderVolledig | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data, error } = await getSupabase().from("orders").select().eq("id", id).maybeSingle<OrderVolledig>();
  if (error) throw new Error(`Order ophalen mislukt: ${error.message}`);
  return data;
}

export type PaginaLinks = { klein: string | null; groot: string | null; tekenplaat: string | null };

/** Tijdelijke links (2 uur) naar foto's en tekenplaten van een order. */
export async function linksVoorPaginas(paginas: Pagina[], metOrigineel: boolean): Promise<Record<string, PaginaLinks>> {
  const db = getSupabase();
  const fotoPaden = paginas.flatMap((p) => [p.foto_klein_pad, metOrigineel ? p.foto_pad : null]).filter((p): p is string => !!p);
  const plaatPaden = paginas.map((p) => p.tekenplaat_pad).filter((p): p is string => !!p);
  const [fotos, platen] = await Promise.all([
    fotoPaden.length ? db.storage.from(buckets.fotos).createSignedUrls(fotoPaden, 2 * 60 * 60) : { data: [], error: null },
    plaatPaden.length ? db.storage.from(buckets.tekenplaten).createSignedUrls(plaatPaden, 2 * 60 * 60) : { data: [], error: null },
  ]);
  if (fotos.error || platen.error) throw new Error(`Links maken mislukt: ${(fotos.error ?? platen.error)?.message}`);
  const url = new Map<string, string>();
  for (const d of [...(fotos.data ?? []), ...(platen.data ?? [])]) if (d.path && d.signedUrl) url.set(d.path, d.signedUrl);
  const uit: Record<string, PaginaLinks> = {};
  for (const p of paginas) {
    uit[p.id] = {
      klein: p.foto_klein_pad ? (url.get(p.foto_klein_pad) ?? null) : null,
      groot: p.foto_pad ? (url.get(p.foto_pad) ?? null) : null,
      tekenplaat: p.tekenplaat_pad ? (url.get(p.tekenplaat_pad) ?? null) : null,
    };
  }
  return uit;
}

export class BeheerFout extends Error {}

export async function zetStatus(order: Order, status: OrderStatus) {
  if (!alleStatussen.some((s) => s.value === status)) throw new BeheerFout("Onbekende status.");
  const { error } = await getSupabase().from("orders").update({ status }).eq("id", order.id);
  if (error) throw new Error(`Status opslaan mislukt: ${error.message}`);
  // Afspraak: klantfoto's verdwijnen zodra het boek naar de drukker gaat.
  if (status === "gedrukt" || status === "verzonden") await verwijderOriginelen(order.id);
  // Drukbestanden zijn na verzending niet meer nodig.
  if (status === "verzonden") await verwijderDrukbestanden(order.id);
}

export async function verwijderOriginelen(orderId: string) {
  const paginas = await haalPaginas(orderId);
  await verwijderBestanden(buckets.fotos, paginas.flatMap((p) => [p.foto_pad, p.foto_klein_pad]));
  const { error } = await getSupabase().from("pages").update({ foto_pad: null, foto_klein_pad: null }).eq("order_id", orderId);
  if (error) throw new Error(`Foto's loskoppelen mislukt: ${error.message}`);
}

const plaatTypes: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export async function bewaarTekenplaat(order: Order, pageId: string, bestand: Blob) {
  const ext = plaatTypes[bestand.type];
  if (!ext) throw new BeheerFout("Gebruik een PNG-, JPG- of WebP-bestand.");
  const db = getSupabase();
  const { data: pagina } = await db.from("pages").select().eq("id", pageId).eq("order_id", order.id).maybeSingle<Pagina>();
  if (!pagina) throw new BeheerFout("Onbekende pagina.");

  const pad = `${order.id}/${pagina.id}-${randomBytes(6).toString("hex")}.${ext}`;
  const { error: upErr } = await db.storage.from(buckets.tekenplaten).upload(pad, bestand, { contentType: bestand.type, upsert: false });
  if (upErr) throw new Error(`Tekenplaat uploaden mislukt: ${upErr.message}`);
  const { error } = await db.from("pages").update({ tekenplaat_pad: pad }).eq("id", pagina.id);
  if (error) throw new Error(`Tekenplaat koppelen mislukt: ${error.message}`);
  await verwijderBestanden(buckets.tekenplaten, [pagina.tekenplaat_pad]);

  // Eerste tekenplaat? Dan staat het boek 'in productie'.
  if (order.status === "ingediend") await db.from("orders").update({ status: "in_productie" }).eq("id", order.id);

  const { data: link } = await db.storage.from(buckets.tekenplaten).createSignedUrl(pad, 2 * 60 * 60);
  return link?.signedUrl ?? null;
}

export async function verwijderTekenplaat(order: Order, pageId: string) {
  const db = getSupabase();
  const { data: pagina } = await db.from("pages").select().eq("id", pageId).eq("order_id", order.id).maybeSingle<Pagina>();
  if (!pagina) throw new BeheerFout("Onbekende pagina.");
  await db.from("pages").update({ tekenplaat_pad: null }).eq("id", pagina.id);
  await verwijderBestanden(buckets.tekenplaten, [pagina.tekenplaat_pad]);
}

export async function verstuurProef(order: Order, origin: string) {
  if (!["ingediend", "in_productie"].includes(order.status)) throw new BeheerFout("De proef kan alleen worden verstuurd als het boek ingediend of in productie is.");
  const paginas = await haalPaginas(order.id);
  const zonder = paginas.filter((p) => !p.tekenplaat_pad).map((p) => p.positie);
  if (zonder.length) throw new BeheerFout(`Nog geen tekenplaat bij pagina ${zonder.join(", ")}.`);

  const db = getSupabase();
  // Opmerkingen van een vorige proefronde wissen.
  await db.from("pages").update({ opmerking: null }).eq("order_id", order.id);
  const { error } = await db.from("orders").update({ status: "proef_klaar" }).eq("id", order.id);
  if (error) throw new Error(`Status opslaan mislukt: ${error.message}`);
  await stuurProef({ aan: order.email, naam: order.naam, url: boekUrl(origin, order.code), titel: order.cover_titel ?? "je boek" });
}
