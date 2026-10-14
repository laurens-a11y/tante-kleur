import { isBeheerVerzoek } from "@/lib/beheer";
import { BeheerFout, bewaarTekenplaat, haalOrder } from "@/lib/beheer-orders";

// Vercel accepteert maximaal 4,5 MB per verzoek; een lijntekening als PNG
// op A4 past daar ruim in.
export const maxDuration = 60;
const MAX = 4.4 * 1024 * 1024;

export async function POST(request: Request, ctx: RouteContext<"/api/beheer/orders/[id]/tekenplaat">) {
  if (!isBeheerVerzoek(request)) return Response.json({ fout: "Niet ingelogd." }, { status: 401 });
  const { id } = await ctx.params;
  const order = await haalOrder(id);
  if (!order) return Response.json({ fout: "Order niet gevonden." }, { status: 404 });

  try {
    const form = await request.formData().catch(() => null);
    const bestand = form?.get("bestand");
    const pageId = form?.get("pageId");
    if (!(bestand instanceof Blob) || typeof pageId !== "string") throw new BeheerFout("Geen bestand ontvangen.");
    if (bestand.size > MAX) throw new BeheerFout("Bestand is groter dan 4,4 MB. Verklein of comprimeer de PNG.");
    const url = await bewaarTekenplaat(order, pageId, bestand);
    return Response.json({ url });
  } catch (e) {
    if (e instanceof BeheerFout) return Response.json({ fout: e.message }, { status: 400 });
    console.error("Tekenplaat uploaden mislukt:", e instanceof Error ? e.message : e);
    return Response.json({ fout: "Uploaden mislukt." }, { status: 500 });
  }
}
