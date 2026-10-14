import { vanDezeSite, voerUit, Weigering } from "@/lib/boek-acties";
import { isGeldigeCode } from "@/lib/orders";

// Alle bewaar-acties van het boekformulier (teksten, draaien, volgorde, AI, indienen).
// Bewust een gewone API-route in plaats van Server Actions: klanten laten het
// formulier soms dagen openstaan, en na een nieuwe deploy zouden oude
// Server Action-ID's niet meer werken.
export const maxDuration = 60;

export async function POST(request: Request, ctx: RouteContext<"/api/boek/[code]">) {
  const { code } = await ctx.params;
  if (!isGeldigeCode(code)) return Response.json({ fout: "Dit boek bestaat niet." }, { status: 404 });
  if (!vanDezeSite(request)) return Response.json({ fout: "Niet toegestaan." }, { status: 403 });

  let invoer: unknown;
  try {
    invoer = await request.json();
  } catch {
    return Response.json({ fout: "Ongeldig verzoek." }, { status: 400 });
  }
  if (!invoer || typeof invoer !== "object") return Response.json({ fout: "Ongeldig verzoek." }, { status: 400 });

  try {
    const resultaat = await voerUit(code, invoer as Record<string, unknown>, new URL(request.url).origin);
    return Response.json(resultaat);
  } catch (e) {
    if (e instanceof Weigering) return Response.json({ fout: e.message }, { status: e.status });
    console.error("Boekactie mislukt:", e instanceof Error ? e.message : e);
    return Response.json({ fout: "Er ging iets mis bij het bewaren. Probeer het nog eens." }, { status: 500 });
  }
}
