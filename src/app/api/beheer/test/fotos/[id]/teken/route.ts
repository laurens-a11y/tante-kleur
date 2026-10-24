import { BeheerFout } from "@/lib/beheer-orders";
import { vindConfig, vindRonde } from "@/lib/tekenconfigs";
import { testActie } from "@/lib/test-api";
import { tekenTestFoto } from "@/lib/testomgeving";

// Een plaat tekenen kan een paar minuten duren.
export const maxDuration = 300;

export async function POST(request: Request, ctx: RouteContext<"/api/beheer/test/fotos/[id]/teken">) {
  const { id } = await ctx.params;
  return testActie(request, "Tekenen", async () => {
    const invoer = (await request.json().catch(() => null)) as { config?: unknown; ronde?: unknown } | null;
    const config = vindConfig(invoer?.config);
    const ronde = vindRonde(invoer?.ronde);
    if (!config || !ronde || !ronde.configIds.includes(config.id)) throw new BeheerFout("Onbekende configuratie of ronde.");
    return tekenTestFoto(id, config, ronde.nr);
  });
}
