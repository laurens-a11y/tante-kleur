import { isBeheerVerzoek } from "@/lib/beheer";
import { haalOrder } from "@/lib/beheer-orders";
import { maakDrukbestanden } from "@/lib/druk/drukbestanden";

// Platen omzetten naar vectorlijnen en PDF's opmaken duurt ~15–60 seconden.
export const maxDuration = 300;

export async function POST(request: Request, ctx: RouteContext<"/api/beheer/orders/[id]/druk">) {
  if (!isBeheerVerzoek(request)) return Response.json({ fout: "Niet ingelogd." }, { status: 401 });
  const { id } = await ctx.params;
  const order = await haalOrder(id);
  if (!order) return Response.json({ fout: "Order niet gevonden." }, { status: 404 });

  try {
    return Response.json(await maakDrukbestanden(order));
  } catch (e) {
    const melding = e instanceof Error ? e.message : String(e);
    console.error(`Drukbestanden maken mislukt (order ${order.id}):`, melding);
    return Response.json({ fout: `Drukbestanden maken mislukt: ${melding.slice(0, 300)}` }, { status: 500 });
  }
}
