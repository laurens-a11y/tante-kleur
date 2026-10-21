import { isBeheerVerzoek } from "@/lib/beheer";
import { BeheerFout, haalOrder, verstuurProef, verwijderTekenplaat, zetCover, zetStatus } from "@/lib/beheer-orders";
import type { OrderStatus } from "@/lib/orders";

export const maxDuration = 60;

export async function POST(request: Request, ctx: RouteContext<"/api/beheer/orders/[id]">) {
  if (!isBeheerVerzoek(request)) return Response.json({ fout: "Niet ingelogd." }, { status: 401 });
  const { id } = await ctx.params;
  const order = await haalOrder(id);
  if (!order) return Response.json({ fout: "Order niet gevonden." }, { status: 404 });

  const invoer = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  try {
    switch (invoer?.actie) {
      case "status":
        await zetStatus(order, invoer.status as OrderStatus);
        return Response.json({ ok: true });
      case "proef":
        await verstuurProef(order, new URL(request.url).origin);
        return Response.json({ ok: true });
      case "verwijderTekenplaat":
        if (typeof invoer.pageId !== "string") throw new BeheerFout("Onbekende pagina.");
        await verwijderTekenplaat(order, invoer.pageId);
        return Response.json({ ok: true });
      case "cover":
        await zetCover(order, invoer.pageId, invoer.uitsnede);
        return Response.json({ ok: true });
      default:
        return Response.json({ fout: "Onbekende actie." }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof BeheerFout) return Response.json({ fout: e.message }, { status: 400 });
    console.error("Beheeractie mislukt:", e instanceof Error ? e.message : e);
    return Response.json({ fout: e instanceof Error ? e.message : "Er ging iets mis." }, { status: 500 });
  }
}
