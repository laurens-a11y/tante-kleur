import { isBeheerVerzoek } from "@/lib/beheer";
import { BeheerFout, maakTestboek } from "@/lib/beheer-orders";

// Maakt een testboek (zonder betaling) met titels en verhalen; de platen
// komen daarna per pagina via /api/beheer/orders/[id]/tekenplaat.
export async function POST(request: Request) {
  if (!isBeheerVerzoek(request)) return Response.json({ fout: "Niet ingelogd." }, { status: 401 });
  try {
    return Response.json(await maakTestboek(await request.json()));
  } catch (e) {
    if (e instanceof BeheerFout) return Response.json({ fout: e.message }, { status: 400 });
    console.error("Testboek aanmaken mislukt:", e instanceof Error ? e.message : e);
    return Response.json({ fout: "Testboek aanmaken mislukt." }, { status: 500 });
  }
}
