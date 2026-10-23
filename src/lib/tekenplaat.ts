import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { regieOpdracht, tekenplaatPrompt, tekenplaatPromptDirect } from "@/content/tekenplaat-prompt";
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
// Methode B: rechtstreeks naar de beeld-API, zonder regisseur die de prompt
// herschrijft. Standaard het beeldmodel van ChatGPT zelf; dat model ondersteunt
// alleen de standaardformaten, dus staand 1024x1536 (2:3, iets smaller dan A4).
const directModel = process.env.OPENAI_DIRECT_IMAGE_MODEL || "chatgpt-image-latest";
const directFormaat = process.env.OPENAI_DIRECT_IMAGE_SIZE || "1024x1536";
const directKwaliteit = (process.env.OPENAI_DIRECT_IMAGE_QUALITY || "high") as "low" | "medium" | "high";

// Methode C: als A (hele prompt + foto + referentie naar de regisseur, met fotocheck),
// maar met de keuzes die ChatGPT zelf maakt: ChatGPT-beeldmodel, bewerken of nieuw
// beeld naar eigen keuze, formaat en kwaliteit automatisch.
const chatgptModel = process.env.OPENAI_CHATGPT_IMAGE_MODEL || "chatgpt-image-latest";

// Methode D: twee stappen zoals ChatGPT (regisseur schrijft een opdracht voor deze foto,
// die gaat letterlijk naar het beeldmodel). Formaat "auto", zoals in ChatGPT.
const dModel = process.env.OPENAI_D_IMAGE_MODEL || "chatgpt-image-latest";
const dFormaat = process.env.OPENAI_D_IMAGE_SIZE || "auto";

// Methode E: opdracht zoals D, maar zoals ChatGPT waarschijnlijk tekent: gpt-image-2 in
// A4-formaat en een NIEUW beeld (action "generate") met foto + referentie als voorbeeld,
// in plaats van de foto te bewerken.
const eModel = process.env.OPENAI_E_IMAGE_MODEL || "gpt-image-2";
const eFormaat = process.env.OPENAI_E_IMAGE_SIZE || "1440x2032";

// Methode F: opdracht per foto zoals D, maar met OpenAI's beste beeldmodel (gpt-image-2.5-sunburst,
// vaste snapshot) in A4-formaat. Geen input_fidelity: die werkt volgens de SDK alleen op
// gpt-image-1/1.5 en moet bij gpt-image-2 en nieuwer weggelaten worden.
const fModel = process.env.OPENAI_F_IMAGE_MODEL || "gpt-image-2.5-sunburst-2026-09-08";
const fFormaat = process.env.OPENAI_F_IMAGE_SIZE || "1440x2032";
const fKwaliteit = (process.env.OPENAI_F_IMAGE_QUALITY || "high") as "low" | "medium" | "high" | "xhigh" | "max";

export type Methode = "A" | "B" | "C" | "D" | "E" | "F";
export type Generatie = { url: string | null; methode: Methode; model: string; prompt: string | null; referentie: string; formaat: string };

// Stijlreferentie ("image 2" in de prompt): de goedgekeurde kleurplaat van de selfie op het treinperron.
// Standaard het bestand assets/stijlreferentie.png; via STIJL_REFERENTIE_URL te vervangen.
const referentieUrl = process.env.STIJL_REFERENTIE_URL?.trim() || null;

let client: OpenAI | null = null;
export function getOpenAI() {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new Error("OPENAI_API_KEY ontbreekt");
    client = new OpenAI({ apiKey, timeout: 285_000, maxRetries: 0 });
  }
  return client;
}

export type Referentie = { dataUrl: string; bron: "bestand" | "url" | "websiteversie (kleiner)"; bytes: number };
let referentieCache: Referentie | null = null;
export async function referentie(): Promise<Referentie> {
  if (referentieCache) return referentieCache;
  if (referentieUrl) {
    const res = await fetch(referentieUrl);
    if (!res.ok) throw new Error(`Stijlreferentie ophalen mislukt (${res.status})`);
    const type = res.headers.get("content-type") || "image/jpeg";
    const data = Buffer.from(await res.arrayBuffer());
    referentieCache = { dataUrl: `data:${type};base64,${data.toString("base64")}`, bron: "url", bytes: data.length };
  } else {
    try {
      const bestand = await readFile(path.join(process.cwd(), "assets", "stijlreferentie.png"));
      referentieCache = { dataUrl: `data:image/png;base64,${bestand.toString("base64")}`, bron: "bestand", bytes: bestand.length };
    } catch (e) {
      // Vangnet: de kleinere versie van de voorbeeldenpagina (niet gecachet, zodat het bestand een volgende keer weer geprobeerd wordt).
      console.error("Stijlreferentie niet gevonden, val terug op de websiteversie:", e instanceof Error ? e.message : e);
      const res = await fetch("https://cdn.sanity.io/images/hera4nnf/production/8508016daaadccd4acb3bbddec8a276bdec92c5a-584x911.jpg");
      if (!res.ok) throw new Error(`Stijlreferentie ophalen mislukt (${res.status})`);
      const data = Buffer.from(await res.arrayBuffer());
      return { dataUrl: `data:image/jpeg;base64,${data.toString("base64")}`, bron: "websiteversie (kleiner)", bytes: data.length };
    }
  }
  return referentieCache;
}

/** Fout als het model de foto ongeschikt vindt; de reden is voor Tante (en de klant). */
export class FotoAfgekeurd extends BeheerFout {}

/** Prompt voor methode B: de korte versie, plus een eventuele extra instructie per foto. */
function kleurplaatPrompt(extra?: string | null) {
  return extra?.trim() ? `${tekenplaatPromptDirect}\n\nAdditional instruction for this photograph: ${extra.trim().slice(0, 500)}` : tekenplaatPromptDirect;
}

function dataUrlNaarBestand(url: string, naam: string) {
  const type = url.slice(5, url.indexOf(";"));
  return toFile(Buffer.from(url.slice(url.indexOf(",") + 1), "base64"), `${naam}.${type === "image/png" ? "png" : "jpg"}`, { type });
}

/**
 * Maakt van de foto op een pagina een tekenplaat met OpenAI en slaat die op
 * als de tekenplaat van die pagina (de vorige wordt vervangen).
 * Methode A: taalmodel beoordeelt de foto en stuurt de beeldgenerator aan (kan weigeren).
 * Methode B: prompt letterlijk naar de beeld-API (ChatGPT-beeldmodel), geen beoordeling.
 * Methode C: als A, maar met de instellingen van ChatGPT (model, bewerken/genereren, formaat automatisch).
 * Methode D: twee stappen zoals ChatGPT: regisseur schrijft een opdracht voor déze foto (kan weigeren),
 *            die opdracht gaat letterlijk met foto + referentie naar het beeldmodel.
 * Methode E: als D, maar gpt-image-2 in A4 en nieuw tekenen i.p.v. bewerken.
 * Methode F: als D, maar met gpt-image-2.5-sunburst (vaste snapshot) in A4.
 */
export async function genereerTekenplaat(order: Order, pageId: string, extra?: string | null, methode: Methode = "A"): Promise<Generatie> {
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

  let b64: string | null = null;
  let gebruiktePrompt: string | null = null;
  let model = beeldModel;
  const ref = await referentie();

  if (methode === "D" || methode === "E" || methode === "F") {
    model = methode === "D" ? dModel : methode === "E" ? eModel : fModel;
    const regie = await getOpenAI().responses.create({
      model: regisseur,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: regieOpdracht + tekenplaatPrompt + (extra?.trim() ? `\n\nAdditional instruction for this photograph: ${extra.trim().slice(0, 500)}` : "") },
            { type: "input_text", text: "Image 1 (source photograph):" },
            { type: "input_image", image_url: fotoUrl, detail: "high" },
            { type: "input_text", text: "Image 2 (style reference, approved colouring page):" },
            { type: "input_image", image_url: ref.dataUrl, detail: "high" },
          ],
        },
      ],
      store: false,
    });
    const tekst = regie.output_text?.trim() ?? "";
    if (!tekst) throw new Error("De regisseur gaf geen opdracht terug");
    if (/^AFGEKEURD:/i.test(tekst)) throw new FotoAfgekeurd(`Foto afgekeurd door de AI: ${tekst.replace(/^AFGEKEURD:\s*/i, "").slice(0, 600)}`);
    gebruiktePrompt = tekst.replace(/^"|"$/g, "");
    if (methode === "E") {
      // Stap 2: nieuw beeld laten tekenen met precies deze opdracht; foto en referentie als voorbeeld.
      const teken = await getOpenAI().responses.create({
        model: regisseur,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Generate one image with the image generation tool. Pass the following prompt to the tool exactly as written, without changing, shortening or adding anything. Image 1 below is the source photograph, image 2 the style reference.\n\nPROMPT:\n${gebruiktePrompt}`,
              },
              { type: "input_text", text: "Image 1 (source photograph):" },
              { type: "input_image", image_url: fotoUrl, detail: "high" },
              { type: "input_text", text: "Image 2 (style reference, approved colouring page):" },
              { type: "input_image", image_url: ref.dataUrl, detail: "high" },
            ],
          },
        ],
        tools: [{ type: "image_generation", model: eModel, size: eFormaat, quality: "high", output_format: "png", background: "opaque", action: "generate" }],
        tool_choice: { type: "image_generation" },
        store: false,
      });
      const beeld = teken.output.find((o) => o.type === "image_generation_call");
      b64 = beeld && "result" in beeld ? (beeld.result ?? null) : null;
      const doorgegeven = beeld && "revised_prompt" in beeld ? (beeld as { revised_prompt?: string | null }).revised_prompt : null;
      // Laat zien of de opdracht ongewijzigd is doorgegeven.
      if (doorgegeven && doorgegeven.trim() !== gebruiktePrompt.trim()) gebruiktePrompt = `${gebruiktePrompt}\n\n--- Werkelijk doorgegeven aan het beeldmodel ---\n${doorgegeven}`;
      if (!b64) throw new Error("OpenAI gaf geen afbeelding terug");
    } else {
    const resultaat = await getOpenAI().images.edit({
      model,
      image: [await toFile(foto, "foto.jpg", { type: "image/jpeg" }), await dataUrlNaarBestand(ref.dataUrl, "stijlreferentie")],
      prompt: gebruiktePrompt,
      size: methode === "F" ? fFormaat : dFormaat,
      quality: methode === "F" ? fKwaliteit : "high",
      output_format: "png",
      background: "opaque",
    });
    b64 = resultaat.data?.[0]?.b64_json ?? null;
    if (!b64) throw new Error("OpenAI gaf geen afbeelding terug");
    }
  } else if (methode === "B") {
    model = directModel;
    gebruiktePrompt = kleurplaatPrompt(extra);
    const resultaat = await getOpenAI().images.edit({
      model: directModel,
      image: [await toFile(foto, "foto.jpg", { type: "image/jpeg" }), await dataUrlNaarBestand(ref.dataUrl, "stijlreferentie")],
      prompt: gebruiktePrompt,
      size: directFormaat,
      quality: directKwaliteit,
      output_format: "png",
      background: "opaque",
    });
    b64 = resultaat.data?.[0]?.b64_json ?? null;
    if (!b64) throw new Error("OpenAI gaf geen afbeelding terug");
  } else {
  if (methode === "C") model = chatgptModel;
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
          { type: "input_image", image_url: ref.dataUrl, detail: "high" },
        ],
      },
    ],
    tools: [
      methode === "C"
        ? { type: "image_generation", model: chatgptModel, size: "auto", quality: "auto", output_format: "png", background: "opaque", action: "auto" }
        : { type: "image_generation", model: beeldModel, size: formaat, quality: kwaliteit, output_format: "png", background: "opaque", action: "edit" },
    ],
    // 'auto': het model mag weigeren met uitleg als de foto ongeschikt is.
    tool_choice: "auto",
    store: false,
  });

  const beeld = antwoord.output.find((o) => o.type === "image_generation_call");
  b64 = beeld && "result" in beeld ? (beeld.result ?? null) : null;
  // De opdracht die de beeldgenerator echt kreeg (door de regisseur herschreven).
  gebruiktePrompt = beeld && "revised_prompt" in beeld ? ((beeld as { revised_prompt?: string | null }).revised_prompt ?? null) : null;
  if (!b64) {
    const reden = antwoord.output_text?.trim();
    if (reden) throw new FotoAfgekeurd(`Foto afgekeurd door de AI: ${reden.slice(0, 600)}`);
    throw new Error("OpenAI gaf geen afbeelding terug");
  }
  }
  const referentieInfo = `${ref.bron}, ${Math.round(ref.bytes / 1024)} kB`;
  const meta = await sharp(Buffer.from(b64, "base64")).metadata();
  const formaatInfo = `${meta.width}×${meta.height}`;
  console.log(`Tekenplaat order ${order.id} pagina ${pagina.positie}: methode ${methode}, model ${model}, formaat ${formaatInfo}, stijlreferentie ${referentieInfo}`);

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

  return { url, methode, model, prompt: gebruiktePrompt, referentie: referentieInfo, formaat: formaatInfo };
}
