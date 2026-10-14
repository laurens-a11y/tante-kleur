import "server-only";
import OpenAI from "openai";
import sharp from "sharp";
import { tekenplaatPrompt } from "@/content/tekenplaat-prompt";
import { buckets, getSupabase } from "@/lib/supabase";
import { bewaarTekenplaat, BeheerFout } from "@/lib/beheer-orders";
import type { Order, Pagina } from "@/lib/orders";

// Alles instelbaar via Vercel zonder codewijziging.
// Het taalmodel beoordeelt eerst de foto en roept dan de beeldgenerator aan;
// is de foto ongeschikt, dan antwoordt het met tekst in plaats van een plaat.
const regisseur = process.env.OPENAI_PLAAT_MODEL || "gpt-5.5";
const beeldModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
// Staand in A4-verhouding (210:297), beide zijden deelbaar door 16.
const formaat = process.env.OPENAI_IMAGE_SIZE || "1440x2032";
const kwaliteit = (process.env.OPENAI_IMAGE_QUALITY || "high") as "low" | "medium" | "high";
// Stijlreferentie ("image 2" in de prompt): de goedgekeurde kleurplaat van de selfie op het treinperron.
const referentieUrl =
  process.env.STIJL_REFERENTIE_URL ||
  "https://cdn.sanity.io/images/hera4nnf/production/8508016daaadccd4acb3bbddec8a276bdec92c5a-584x911.jpg";

let client: OpenAI | null = null;
function getOpenAI() {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new Error("OPENAI_API_KEY ontbreekt");
    client = new OpenAI({ apiKey, timeout: 285_000, maxRetries: 0 });
  }
  return client;
}

let referentieCache: string | null = null;
async function referentie(): Promise<string> {
  if (referentieCache) return referentieCache;
  const res = await fetch(referentieUrl);
  if (!res.ok) throw new Error(`Stijlreferentie ophalen mislukt (${res.status})`);
  const type = res.headers.get("content-type") || "image/jpeg";
  referentieCache = `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  return referentieCache;
}

/** Fout als het model de foto ongeschikt vindt; de reden is voor Tante (en de klant). */
export class FotoAfgekeurd extends BeheerFout {}

/**
 * Maakt van de foto op een pagina een tekenplaat met OpenAI en slaat die op
 * als de tekenplaat van die pagina (de vorige wordt vervangen).
 */
export async function genereerTekenplaat(order: Order, pageId: string, extra?: string | null) {
  const db = getSupabase();
  const { data: pagina } = await db.from("pages").select().eq("id", pageId).eq("order_id", order.id).maybeSingle<Pagina & { generaties?: number }>();
  if (!pagina) throw new BeheerFout("Onbekende pagina.");
  if (!pagina.foto_pad) throw new BeheerFout("Deze pagina heeft geen foto (meer).");

  // Origineel ophalen en rechtop zetten zoals de klant het wilde.
  const { data: bestand, error } = await db.storage.from(buckets.fotos).download(pagina.foto_pad);
  if (error || !bestand) throw new Error(`Foto ophalen mislukt: ${error?.message}`);
  const foto = await sharp(Buffer.from(await bestand.arrayBuffer()))
    .rotate(pagina.draaiing || 0)
    .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toBuffer();
  const fotoUrl = `data:image/jpeg;base64,${foto.toString("base64")}`;

  const prompt = extra?.trim() ? `${tekenplaatPrompt}\n\nAdditional instruction for this photograph: ${extra.trim().slice(0, 500)}` : tekenplaatPrompt;

  const antwoord = await getOpenAI().responses.create({
    model: regisseur,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_text", text: "Image 1 (source photograph):" },
          { type: "input_image", image_url: fotoUrl, detail: "high" },
          { type: "input_text", text: "Image 2 (style reference, approved colouring page):" },
          { type: "input_image", image_url: await referentie(), detail: "high" },
        ],
      },
    ],
    tools: [
      {
        type: "image_generation",
        model: beeldModel,
        size: formaat,
        quality: kwaliteit,
        output_format: "png",
        background: "opaque",
        action: "edit",
      },
    ],
    // 'auto': het model mag weigeren met uitleg als de foto ongeschikt is.
    tool_choice: "auto",
    store: false,
  });

  const beeld = antwoord.output.find((o) => o.type === "image_generation_call");
  const b64 = beeld && "result" in beeld ? beeld.result : null;
  if (!b64) {
    const reden = antwoord.output_text?.trim();
    if (reden) throw new FotoAfgekeurd(`Foto afgekeurd door de AI: ${reden.slice(0, 600)}`);
    throw new Error("OpenAI gaf geen afbeelding terug");
  }

  // Zwart-wit en compact opslaan; de lijnen blijven scherp.
  const png = await sharp(Buffer.from(b64, "base64")).grayscale().png({ compressionLevel: 9 }).toBuffer();
  const url = await bewaarTekenplaat(order, pagina.id, new Blob([new Uint8Array(png)], { type: "image/png" }));

  // Bijhouden hoe vaak er per pagina gegenereerd is (voor de keep-rate).
  // Werkt pas na migratie 0002; zonder die kolom gaat dit stil mis.
  await db
    .from("pages")
    .update({ generaties: (pagina.generaties ?? 0) + 1 })
    .eq("id", pagina.id)
    .then(
      () => undefined,
      () => undefined,
    );

  return url;
}
