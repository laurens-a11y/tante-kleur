import { testActie } from "@/lib/test-api";
import { bewaarFotoVelden, verwijderTestFoto } from "@/lib/testomgeving";

export async function PATCH(request: Request, ctx: RouteContext<"/api/beheer/test/fotos/[id]">) {
  const { id } = await ctx.params;
  return testActie(request, "Opslaan", async () => {
    const invoer = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    await bewaarFotoVelden(id, invoer ?? {});
  });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/beheer/test/fotos/[id]">) {
  const { id } = await ctx.params;
  return testActie(request, "Verwijderen", () => verwijderTestFoto(id));
}
