import "server-only";
import sharp from "sharp";
import { analyseOpdracht, tekenplaatPrompt } from "@/content/tekenplaat-prompt";
import { getOpenAI, referentie } from "@/lib/tekenplaat";
import type { TekenConfig } from "@/lib/tekenconfigs";

// Twee losse stappen, zodat de briefing bewaard, bekeken en aangepast kan worden:
// 1. analyseer: de regisseur keurt de foto en schrijft een tekenbriefing voor déze foto.
// 2. teken: de briefing gaat ongewijzigd, met foto en stijlreferentie, naar het beeldmodel.
// Gebruikt door de testomgeving (/beheer/test); de winnende configuratie gaat later naar de bestellingen.

const regisseur = process.env.OPENAI_PLAAT_MODEL || "gpt-5.5";
// Staand in A4-verhouding (210:297), beide zijden deelbaar door 16.
const formaat = process.env.OPENAI_IMAGE_SIZE || "1440x2032";

export type Analyse = { geschikt: boolean; reden: string | null; briefing: string | null };
export type Tekening = { png: Buffer; revisedPrompt: string | null; duurMs: number; usage: unknown };

/** Foto zoals het model hem ziet: maximaal 2048 px, JPEG. */
export async function fotoVoorModel(origineel: Buffer) {
  const foto = await sharp(origineel).rotate().resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 92 }).toBuffer();
  return `data:image/jpeg;base64,${foto.toString("base64")}`;
}

async function beeldInvoer(fotoUrl: string) {
  const ref = await referentie();
  return [
    { type: "input_text" as const, text: "Image 1 (source photograph):" },
    { type: "input_image" as const, image_url: fotoUrl, detail: "high" as const },
    { type: "input_text" as const, text: "Image 2 (style reference, approved colouring page):" },
    { type: "input_image" as const, image_url: ref.dataUrl, detail: "high" as const },
  ];
}

/** Stap 1: foto keuren en een tekenbriefing schrijven. */
export async function analyseer(origineel: Buffer, extra?: string | null): Promise<Analyse> {
  const fotoUrl = await fotoVoorModel(origineel);
  const opdracht = analyseOpdracht + tekenplaatPrompt + (extra?.trim() ? `\n\nAdditional instruction for this photograph: ${extra.trim().slice(0, 500)}` : "");
  const antwoord = await getOpenAI().responses.create({
    model: regisseur,
    input: [{ role: "user", content: [{ type: "input_text", text: opdracht }, ...(await beeldInvoer(fotoUrl))] }],
    text: {
      format: {
        type: "json_schema",
        name: "tekenbriefing",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["geschikt", "reden", "beeldprompt"],
          properties: {
            geschikt: { type: "boolean" },
            reden: { type: "string" },
            beeldprompt: { type: "string" },
          },
        },
      },
    },
    store: false,
  });
  let data: { geschikt?: unknown; reden?: unknown; beeldprompt?: unknown };
  try {
    data = JSON.parse(antwoord.output_text);
  } catch {
    throw new Error("De analyse gaf geen geldig antwoord terug");
  }
  const briefing = typeof data.beeldprompt === "string" && data.beeldprompt.trim() ? data.beeldprompt.trim() : null;
  const reden = typeof data.reden === "string" && data.reden.trim() ? data.reden.trim() : null;
  return { geschikt: data.geschikt === true && !!briefing, reden, briefing };
}

/** Stap 2: de briefing letterlijk laten tekenen, met foto en stijlreferentie als invoer. */
export async function teken(origineel: Buffer, briefing: string, config: TekenConfig): Promise<Tekening> {
  const start = Date.now();
  const fotoUrl = await fotoVoorModel(origineel);
  const antwoord = await getOpenAI().responses.create({
    model: regisseur,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Generate one image with the image generation tool. Pass the following prompt to the tool exactly as written, without changing, shortening or adding anything. Image 1 below is the source photograph, image 2 the style reference.\n\nPROMPT:\n${briefing}`,
          },
          ...(await beeldInvoer(fotoUrl)),
        ],
      },
    ],
    tools: [{ type: "image_generation", model: config.model, size: config.formaat ?? formaat, quality: config.kwaliteit ?? "high", output_format: "png", background: "opaque", action: config.actie }],
    tool_choice: { type: "image_generation" },
    store: false,
  });
  const beeld = antwoord.output.find((o) => o.type === "image_generation_call");
  const b64 = beeld && "result" in beeld ? (beeld.result ?? null) : null;
  if (!b64) throw new Error(antwoord.output_text?.trim() ? `Geen plaat: ${antwoord.output_text.trim().slice(0, 300)}` : "OpenAI gaf geen afbeelding terug");
  const revisedPrompt = beeld && "revised_prompt" in beeld ? ((beeld as { revised_prompt?: string | null }).revised_prompt ?? null) : null;
  // Zwart-wit opslaan, net als bij de bestellingen.
  const png = await sharp(Buffer.from(b64, "base64")).grayscale().png({ compressionLevel: 9 }).toBuffer();
  return { png, revisedPrompt, duurMs: Date.now() - start, usage: antwoord.usage ?? null };
}
