import { testActie } from "@/lib/test-api";
import { beoordeelPlaat, verwijderTestPlaat } from "@/lib/testomgeving";

export async function PATCH(request: Request, ctx: RouteContext<"/api/beheer/test/platen/[id]">) {
  const { id } = await ctx.params;
  return testActie(request, "Beoordelen", async () => {
    const invoer = (await request.json().catch(() => null)) as { score?: unknown; notitie?: unknown } | null;
    await beoordeelPlaat(id, invoer?.score, invoer?.notitie);
  });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/beheer/test/platen/[id]">) {
  const { id } = await ctx.params;
  return testActie(request, "Verwijderen", () => verwijderTestPlaat(id));
}
