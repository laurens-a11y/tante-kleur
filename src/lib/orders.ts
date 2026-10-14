import "server-only";
import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import { buckets, getSupabase } from "@/lib/supabase";
import { stuurBoekLink } from "@/lib/mail";
import { site } from "@/config";

export type OrderStatus = "betaald" | "ingediend" | "in_productie" | "proef_klaar" | "akkoord" | "gedrukt" | "verzonden";

export type Order = {
  id: string;
  code: string;
  stripe_session_id: string;
  email: string | null;
  naam: string | null;
  status: OrderStatus;
  cover_titel: string | null;
  cover_kleur: string | null;
  inleiding: string | null;
  inleiding_eigen: string | null;
  nawoord: string | null;
  nawoord_eigen: string | null;
  ai_aanroepen: number;
  ingediend_op: string | null;
};

export type Pagina = {
  id: string;
  order_id: string;
  positie: number;
  foto_pad: string | null;
  foto_klein_pad: string | null;
  draaiing: 0 | 90 | 180 | 270;
  verhaal: string | null;
  verhaal_eigen: string | null;
  tekenplaat_pad: string | null;
  opmerking: string | null;
};

// Codes in de link zijn 24 tekens base64url (144 bits): niet te raden.
const CODE_PATROON = /^[A-Za-z0-9_-]{24}$/;

export function isGeldigeCode(code: unknown): code is string {
  return typeof code === "string" && CODE_PATROON.test(code);
}

function nieuweCode() {
  return randomBytes(18).toString("base64url");
}

// In productie altijd het echte domein in mails; in previews het preview-adres.
export function boekUrl(origin: string, code: string) {
  const basis = process.env.VERCEL_ENV === "production" ? site.url : origin;
  return `${basis}/boek/${code}`;
}

/**
 * Zorgt dat er voor een betaalde Checkout Session precies één order bestaat.
 * Wordt aangeroepen door de webhook én door de bedankpagina (wie het eerst
 * komt). Alleen degene die de order echt aanmaakt, stuurt de mail.
 */
export async function zorgVoorOrder(session: Stripe.Checkout.Session, origin: string): Promise<Order | null> {
  if (session.payment_status === "unpaid") return null;

  const db = getSupabase();
  const bestaand = await haalOrderOpSession(session.id);
  if (bestaand) return bestaand;

  // Oude bestellingen hadden de titel nog in Stripe; neem die dan over.
  const coverTitel = session.custom_fields?.find((f) => f.key === "cover_titel")?.text?.value ?? null;
  const shipping = session.collected_information?.shipping_details;

  const { data, error } = await db
    .from("orders")
    .insert({
      code: nieuweCode(),
      stripe_session_id: session.id,
      email: session.customer_details?.email ?? null,
      naam: shipping?.name ?? session.customer_details?.name ?? null,
      verzendadres: shipping?.address ?? null,
      cover_titel: coverTitel,
    })
    .select()
    .single<Order>();

  if (error) {
    // 23505 = unieke sleutel: tegelijk aangemaakt door webhook en bedankpagina.
    if (error.code === "23505") return haalOrderOpSession(session.id);
    throw new Error(`Order opslaan mislukt: ${error.message}`);
  }

  try {
    await stuurBoekLink({ aan: data.email, naam: data.naam, url: boekUrl(origin, data.code) });
  } catch (e) {
    // De klant ziet de link ook op de bedankpagina; een mislukte mail mag de order niet blokkeren.
    console.error(`Mail met boeklink mislukt voor order ${data.id}:`, e instanceof Error ? e.message : e);
  }
  return data;
}

export async function haalOrderOpSession(sessionId: string): Promise<Order | null> {
  const { data, error } = await getSupabase().from("orders").select().eq("stripe_session_id", sessionId).maybeSingle<Order>();
  if (error) throw new Error(`Order ophalen mislukt: ${error.message}`);
  return data;
}

export async function haalOrderOpCode(code: string): Promise<Order | null> {
  if (!isGeldigeCode(code)) return null;
  const { data, error } = await getSupabase().from("orders").select().eq("code", code).maybeSingle<Order>();
  if (error) throw new Error(`Order ophalen mislukt: ${error.message}`);
  return data;
}

export async function haalPaginas(orderId: string): Promise<Pagina[]> {
  const { data, error } = await getSupabase()
    .from("pages")
    .select()
    .eq("order_id", orderId)
    .order("positie", { ascending: true })
    .returns<Pagina[]>();
  if (error) throw new Error(`Pagina's ophalen mislukt: ${error.message}`);
  return data ?? [];
}

/** Tijdelijke links (1 uur) naar de kleine versies van de foto's, voor het scherm. */
export async function kleineFotoLinks(paginas: Pagina[]): Promise<Record<string, string>> {
  const paden = paginas.map((p) => p.foto_klein_pad).filter((p): p is string => !!p);
  if (paden.length === 0) return {};
  const { data, error } = await getSupabase().storage.from(buckets.fotos).createSignedUrls(paden, 60 * 60);
  if (error) throw new Error(`Fotolinks maken mislukt: ${error.message}`);
  const perPad = new Map(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
  const links: Record<string, string> = {};
  for (const p of paginas) {
    const url = p.foto_klein_pad ? perPad.get(p.foto_klein_pad) : undefined;
    if (url) links[p.id] = url;
  }
  return links;
}

/** Nummert de pagina's opnieuw 1..n in hun huidige volgorde. */
export async function hernummer(orderId: string) {
  const paginas = await haalPaginas(orderId);
  const db = getSupabase();
  await Promise.all(
    paginas.map((p, i) => (p.positie === i + 1 ? null : db.from("pages").update({ positie: i + 1 }).eq("id", p.id))),
  );
}

/** Verwijdert bestanden uit opslag; fouten worden gelogd, niet gegooid. */
export async function verwijderBestanden(bucket: string, paden: (string | null)[]) {
  const echt = paden.filter((p): p is string => !!p);
  if (echt.length === 0) return;
  const { error } = await getSupabase().storage.from(bucket).remove(echt);
  if (error) console.error(`Bestanden verwijderen mislukt (${bucket}):`, error.message);
}
