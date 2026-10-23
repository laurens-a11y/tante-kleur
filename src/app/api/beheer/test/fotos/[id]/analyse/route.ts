import { testActie } from "@/lib/test-api";
import { analyseerTestFoto } from "@/lib/testomgeving";

// De analyse door het taalmodel kan een minuut of langer duren.
export const maxDuration = 300;

export async function POST(request: Request, ctx: RouteContext<"/api/beheer/test/fotos/[id]/analyse">) {
  const { id } = await ctx.params;
  return testActie(request, "Analyseren", () => analyseerTestFoto(id));
}
