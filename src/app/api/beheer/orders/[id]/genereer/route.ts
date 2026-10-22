import { isBeheerVerzoek } from "@/lib/beheer";
import { BeheerFout, haalOrder } from "@/lib/beheer-orders";
import { genereerTekenplaat } from "@/lib/tekenplaat";

// Een tekenplaat genereren kan een paar minuten duren.
export const maxDuration = 300;

export async function POST(request: Request, ctx: RouteContext<"/api/beheer/orders/[id]/genereer">) {
  if (!isBeheerVerzoek(request)) return Response.json({ fout: "Niet ingelogd." }, { status: 401 });
  const { id } = await ctx.params;
  const order = await haalOrder(id);
  if (!order) return Response.json({ fout: "Order niet gevonden." }, { status: 404 });

  const invoer = (await request.json().catch(() => null)) as { pageId?: unknown; extra?: unknown; methode?: unknown } | null;
  if (typeof invoer?.pageId !== "string") return Response.json({ fout: "Onbekende pagina." }, { status: 400 });

  try {
    const methode = invoer.methode === "B" || invoer.methode === "C" || invoer.methode === "D" || invoer.methode === "E" || invoer.methode === "F" ? invoer.methode : "A";
    const generatie = await genereerTekenplaat(order, invoer.pageId, typeof invoer.extra === "string" ? invoer.extra : null, methode);
    return Response.json(generatie);
  } catch (e) {
    if (e instanceof BeheerFout) return Response.json({ fout: e.message }, { status: 400 });
    const melding = e instanceof Error ? e.message : String(e);
    console.error(`Tekenplaat genereren mislukt (order ${order.id}, pagina ${invoer.pageId}):`, melding);
    // OpenAI weigert soms een foto (veiligheidsfilter); geef die melding door.
    return Response.json({ fout: `Genereren mislukt: ${melding.slice(0, 300)}` }, { status: 502 });
  }
}
