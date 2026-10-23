import { leesBestand, testActie } from "@/lib/test-api";
import { nieuweTestFoto } from "@/lib/testomgeving";

export const maxDuration = 60;

export async function POST(request: Request) {
  return testActie(request, "Foto uploaden", async () => {
    const { bestand, form } = await leesBestand(request, "foto");
    const naam = form.get("naam");
    return nieuweTestFoto(bestand, typeof naam === "string" ? naam : null);
  });
}
