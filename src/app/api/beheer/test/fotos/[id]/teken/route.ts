import { BeheerFout } from "@/lib/beheer-orders";
import { vindConfig } from "@/lib/tekenconfigs";
import { testActie } from "@/lib/test-api";
import { tekenTestFoto } from "@/lib/testomgeving";

// Een plaat tekenen kan een paar minuten duren.
export const maxDuration = 300;

export async function POST(request: Request, ctx: RouteContext<"/api/beheer/test/fotos/[id]/teken">) {
  const { id } = await ctx.params;
  return testActie(request, "Tekenen", async () => {
    const invoer = (await request.json().catch(() => null)) as { config?: unknown } | null;
    const config = vindConfig(invoer?.config);
    if (!config) throw new BeheerFout("Onbekende configuratie.");
    return tekenTestFoto(id, config);
  });
}
