import "server-only";
import { isBeheerVerzoek } from "@/lib/beheer";
import { BeheerFout } from "@/lib/beheer-orders";

// Gedeelde afhandeling voor de API-routes van de testomgeving: inlogcheck en nette foutmeldingen.
export async function testActie(request: Request, wat: string, actie: () => Promise<unknown>) {
  if (!isBeheerVerzoek(request)) return Response.json({ fout: "Niet ingelogd." }, { status: 401 });
  try {
    const resultaat = await actie();
    return Response.json(resultaat ?? { ok: true });
  } catch (e) {
    if (e instanceof BeheerFout) return Response.json({ fout: e.message }, { status: 400 });
    const melding = e instanceof Error ? e.message : String(e);
    console.error(`Testomgeving: ${wat} mislukt:`, melding);
    return Response.json({ fout: `${wat} mislukt: ${melding.slice(0, 300)}` }, { status: 502 });
  }
}

export async function leesBestand(request: Request, veld: string) {
  const form = await request.formData().catch(() => null);
  const bestand = form?.get(veld);
  if (!(bestand instanceof Blob) || !bestand.size) throw new BeheerFout("Geen bestand ontvangen.");
  // Vercel accepteert maximaal 4,5 MB per verzoek; de browser verkleint vooraf.
  if (bestand.size > 4.4 * 1024 * 1024) throw new BeheerFout("Bestand is te groot (max. 4,4 MB).");
  if (!["image/jpeg", "image/png", "image/webp"].includes(bestand.type)) throw new BeheerFout("Gebruik een JPG-, PNG- of WebP-bestand.");
  return { bestand, form: form! };
}
