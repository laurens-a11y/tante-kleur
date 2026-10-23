import "server-only";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { BeheerFout } from "@/lib/beheer-orders";
import { verwijderBestanden } from "@/lib/orders";
import { buckets, getSupabase } from "@/lib/supabase";
import type { TekenConfig } from "@/lib/tekenconfigs";
import { analyseer, teken } from "@/lib/tekenstappen";

// Testomgeving voor tekenplaten: losse testfoto's, los van de bestellingen.

type FotoRij = {
  id: string;
  naam: string | null;
  foto_pad: string;
  scherm_pad: string;
  geschikt: boolean | null;
  reden: string | null;
  briefing: string | null;
  chatgpt_pad: string | null;
  chatgpt_score: "goed" | "fout" | null;
  chatgpt_notitie: string | null;
  aangemaakt_op: string;
};

type PlaatRij = {
  id: string;
  foto_id: string;
  config: string;
  model: string;
  actie: string;
  briefing: string;
  revised_prompt: string | null;
  plaat_pad: string;
  duur_ms: number | null;
  score: "goed" | "fout" | null;
  notitie: string | null;
  aangemaakt_op: string;
};

export type TestPlaat = Omit<PlaatRij, "plaat_pad"> & { url: string | null };
export type TestFoto = Omit<FotoRij, "foto_pad" | "scherm_pad" | "chatgpt_pad"> & {
  origineel: string | null;
  scherm: string | null;
  chatgpt: string | null;
  platen: TestPlaat[];
};

const LINK_DUUR = 6 * 60 * 60;

async function links(paden: string[]) {
  const echt = [...new Set(paden.filter(Boolean))];
  if (!echt.length) return new Map<string, string>();
  const { data, error } = await getSupabase().storage.from(buckets.testen).createSignedUrls(echt, LINK_DUUR);
  if (error) throw new Error(`Links maken mislukt: ${error.message}`);
  const map = new Map<string, string>();
  for (const d of data ?? []) if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
  return map;
}

function metLinks(foto: FotoRij, platen: PlaatRij[], url: Map<string, string>): TestFoto {
  const { foto_pad, scherm_pad, chatgpt_pad, ...rest } = foto;
  return {
    ...rest,
    origineel: url.get(foto_pad) ?? null,
    scherm: url.get(scherm_pad) ?? null,
    chatgpt: chatgpt_pad ? (url.get(chatgpt_pad) ?? null) : null,
    platen: platen.map(({ plaat_pad, ...p }) => ({ ...p, url: url.get(plaat_pad) ?? null })),
  };
}

/** Alle testfoto's met hun platen en tijdelijke links. Null als de tabellen nog niet bestaan. */
export async function lijstTestFotos(): Promise<TestFoto[] | null> {
  const db = getSupabase();
  const { data: fotos, error } = await db.from("test_fotos").select().order("aangemaakt_op", { ascending: true }).returns<FotoRij[]>();
  if (error) {
    console.error("Testfoto's ophalen mislukt:", error.message);
    return null;
  }
  const { data: platen, error: pErr } = await db.from("test_platen").select().order("aangemaakt_op", { ascending: true }).returns<PlaatRij[]>();
  if (pErr) throw new Error(`Testplaten ophalen mislukt: ${pErr.message}`);
  const url = await links([...(fotos ?? []).flatMap((f) => [f.foto_pad, f.scherm_pad, f.chatgpt_pad ?? ""]), ...(platen ?? []).map((p) => p.plaat_pad)]);
  return (fotos ?? []).map((f) => metLinks(f, (platen ?? []).filter((p) => p.foto_id === f.id), url));
}

async function haalFotoRij(id: string) {
  const { data } = await getSupabase().from("test_fotos").select().eq("id", id).maybeSingle<FotoRij>();
  if (!data) throw new BeheerFout("Onbekende testfoto.");
  return data;
}

export async function haalTestFoto(id: string): Promise<TestFoto> {
  const foto = await haalFotoRij(id);
  const { data: platen } = await getSupabase().from("test_platen").select().eq("foto_id", id).order("aangemaakt_op", { ascending: true }).returns<PlaatRij[]>();
  const url = await links([foto.foto_pad, foto.scherm_pad, foto.chatgpt_pad ?? "", ...(platen ?? []).map((p) => p.plaat_pad)]);
  return metLinks(foto, platen ?? [], url);
}

async function upload(pad: string, data: Buffer | Blob, type: string) {
  const { error } = await getSupabase().storage.from(buckets.testen).upload(pad, data, { contentType: type, upsert: false });
  if (error) throw new Error(`Opslaan mislukt: ${error.message}`);
}

async function downloadFoto(pad: string) {
  const { data, error } = await getSupabase().storage.from(buckets.testen).download(pad);
  if (error || !data) throw new Error(`Foto ophalen mislukt: ${error?.message}`);
  return Buffer.from(await data.arrayBuffer());
}

/** Nieuwe testfoto: origineel plus een schermversie. */
export async function nieuweTestFoto(bestand: Blob, naam: string | null) {
  const origineel = Buffer.from(await bestand.arrayBuffer());
  const jpeg = await sharp(origineel).rotate().jpeg({ quality: 92 }).toBuffer().catch(() => null);
  if (!jpeg) throw new BeheerFout("Dit bestand is geen foto die gelezen kan worden.");
  const scherm = await sharp(jpeg).resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
  const sleutel = randomBytes(8).toString("hex");
  const fotoPad = `fotos/${sleutel}.jpg`;
  const schermPad = `fotos/${sleutel}-scherm.jpg`;
  await upload(fotoPad, jpeg, "image/jpeg");
  await upload(schermPad, scherm, "image/jpeg");
  const { data, error } = await getSupabase()
    .from("test_fotos")
    .insert({ naam: naam?.trim().slice(0, 120) || null, foto_pad: fotoPad, scherm_pad: schermPad })
    .select("id")
    .single<{ id: string }>();
  if (error) {
    await verwijderBestanden(buckets.testen, [fotoPad, schermPad]);
    throw new Error(`Testfoto opslaan mislukt: ${error.message}`);
  }
  return haalTestFoto(data.id);
}

/** Stap 1: analyseren en de briefing bewaren. */
export async function analyseerTestFoto(id: string) {
  const foto = await haalFotoRij(id);
  const analyse = await analyseer(await downloadFoto(foto.foto_pad));
  const { error } = await getSupabase()
    .from("test_fotos")
    .update({ geschikt: analyse.geschikt, reden: analyse.reden, briefing: analyse.briefing })
    .eq("id", id);
  if (error) throw new Error(`Analyse opslaan mislukt: ${error.message}`);
  return haalTestFoto(id);
}

/** Naam, briefing en de beoordeling van de ChatGPT-plaat bijwerken. */
export async function bewaarFotoVelden(id: string, invoer: { briefing?: unknown; naam?: unknown; chatgpt_score?: unknown; chatgpt_notitie?: unknown }) {
  await haalFotoRij(id);
  const wijziging: Record<string, string | null> = {};
  if (typeof invoer.briefing === "string") wijziging.briefing = invoer.briefing.trim().slice(0, 8000) || null;
  if (typeof invoer.naam === "string") wijziging.naam = invoer.naam.trim().slice(0, 120) || null;
  if (invoer.chatgpt_score === "goed" || invoer.chatgpt_score === "fout" || invoer.chatgpt_score === null) wijziging.chatgpt_score = invoer.chatgpt_score;
  if (typeof invoer.chatgpt_notitie === "string") wijziging.chatgpt_notitie = invoer.chatgpt_notitie.trim().slice(0, 1000) || null;
  if (!Object.keys(wijziging).length) return;
  const { error } = await getSupabase().from("test_fotos").update(wijziging).eq("id", id);
  if (error) throw new Error(`Opslaan mislukt: ${error.message}`);
}

/** Stap 2: met één configuratie tekenen; de plaat komt erbij, er wordt niets overschreven. */
export async function tekenTestFoto(id: string, config: TekenConfig): Promise<TestPlaat> {
  const foto = await haalFotoRij(id);
  if (!foto.briefing) throw new BeheerFout("Deze foto heeft nog geen briefing. Analyseer eerst, of schrijf zelf een briefing.");
  const tekening = await teken(await downloadFoto(foto.foto_pad), foto.briefing, config);
  const pad = `platen/${id}/${config.id}-${randomBytes(6).toString("hex")}.png`;
  await upload(pad, tekening.png, "image/png");
  const { data, error } = await getSupabase()
    .from("test_platen")
    .insert({
      foto_id: id,
      config: config.id,
      model: config.model,
      actie: config.actie,
      briefing: foto.briefing,
      revised_prompt: tekening.revisedPrompt,
      plaat_pad: pad,
      duur_ms: tekening.duurMs,
      usage: tekening.usage,
    })
    .select()
    .single<PlaatRij>();
  if (error) {
    await verwijderBestanden(buckets.testen, [pad]);
    throw new Error(`Plaat opslaan mislukt: ${error.message}`);
  }
  const url = await links([pad]);
  const { plaat_pad, ...rest } = data;
  return { ...rest, url: url.get(plaat_pad) ?? null };
}

/** De handmatig in ChatGPT gemaakte plaat (vervangt een eerdere). */
export async function bewaarChatgptPlaat(id: string, bestand: Blob) {
  const foto = await haalFotoRij(id);
  const type = bestand.type === "image/png" ? "image/png" : "image/jpeg";
  const pad = `chatgpt/${id}-${randomBytes(6).toString("hex")}.${type === "image/png" ? "png" : "jpg"}`;
  await upload(pad, bestand, type);
  const { error } = await getSupabase().from("test_fotos").update({ chatgpt_pad: pad, chatgpt_score: null, chatgpt_notitie: null }).eq("id", id);
  if (error) throw new Error(`Opslaan mislukt: ${error.message}`);
  await verwijderBestanden(buckets.testen, [foto.chatgpt_pad]);
  return haalTestFoto(id);
}

export async function beoordeelPlaat(plaatId: string, score: unknown, notitie: unknown) {
  const wijziging: Record<string, string | null> = {};
  if (score === "goed" || score === "fout" || score === null) wijziging.score = score;
  if (typeof notitie === "string") wijziging.notitie = notitie.trim().slice(0, 1000) || null;
  if (!Object.keys(wijziging).length) return;
  const { error, count } = await getSupabase().from("test_platen").update(wijziging, { count: "exact" }).eq("id", plaatId);
  if (error) throw new Error(`Opslaan mislukt: ${error.message}`);
  if (!count) throw new BeheerFout("Onbekende plaat.");
}

export async function verwijderTestPlaat(plaatId: string) {
  const db = getSupabase();
  const { data } = await db.from("test_platen").select("plaat_pad").eq("id", plaatId).maybeSingle<{ plaat_pad: string }>();
  if (!data) throw new BeheerFout("Onbekende plaat.");
  await db.from("test_platen").delete().eq("id", plaatId);
  await verwijderBestanden(buckets.testen, [data.plaat_pad]);
}

/** Foto met al zijn platen en bestanden verwijderen. */
export async function verwijderTestFoto(id: string) {
  const foto = await haalFotoRij(id);
  const db = getSupabase();
  const { data: platen } = await db.from("test_platen").select("plaat_pad").eq("foto_id", id).returns<{ plaat_pad: string }[]>();
  const { error } = await db.from("test_fotos").delete().eq("id", id);
  if (error) throw new Error(`Verwijderen mislukt: ${error.message}`);
  await verwijderBestanden(buckets.testen, [foto.foto_pad, foto.scherm_pad, foto.chatgpt_pad, ...(platen ?? []).map((p) => p.plaat_pad)]);
}
