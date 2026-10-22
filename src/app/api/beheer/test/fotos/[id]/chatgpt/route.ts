import { leesBestand, testActie } from "@/lib/test-api";
import { bewaarChatgptPlaat } from "@/lib/testomgeving";

export const maxDuration = 60;

export async function POST(request: Request, ctx: RouteContext<"/api/beheer/test/fotos/[id]/chatgpt">) {
  const { id } = await ctx.params;
  return testActie(request, "ChatGPT-plaat uploaden", async () => {
    const { bestand } = await leesBestand(request, "bestand");
    return bewaarChatgptPlaat(id, bestand);
  });
}
