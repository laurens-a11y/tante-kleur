import { randomBytes } from "node:crypto";
import { boek } from "@/config";
import { bewerkbareOrder, vanDezeSite, Weigering } from "@/lib/boek-acties";
import { haalPaginas, isGeldigeCode, verwijderBestanden, type Pagina } from "@/lib/orders";
import { buckets, getSupabase } from "@/lib/supabase";

// Upload van één foto: nieuw (er komt een pagina bij) of als vervanging van de
// foto op een bestaande pagina. De browser heeft de foto al omgezet naar JPEG,
// rechtop gezet en verkleind, plus een kleine versie voor op het scherm.
// Vercel staat maximaal 4,5 MB per verzoek toe; de browser blijft daaronder.
export const maxDuration = 60;

const MAX_FOTO = 4 * 1024 * 1024;
const MAX_KLEIN = 600 * 1024;

async function isJpeg(bestand: Blob) {
  const kop = new Uint8Array(await bestand.slice(0, 3).arrayBuffer());
  return kop[0] === 0xff && kop[1] === 0xd8 && kop[2] === 0xff;
}

export async function POST(request: Request, ctx: RouteContext<"/api/boek/[code]/foto">) {
  const { code } = await ctx.params;
  if (!isGeldigeCode(code)) return Response.json({ fout: "Dit boek bestaat niet." }, { status: 404 });
  if (!vanDezeSite(request)) return Response.json({ fout: "Niet toegestaan." }, { status: 403 });

  try {
    const order = await bewerkbareOrder(code);

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new Weigering("De foto kwam niet goed aan. Probeer het nog eens.");
    }
    const foto = form.get("foto");
    const klein = form.get("klein");
    const pageId = form.get("pageId");
    if (!(foto instanceof Blob) || !(klein instanceof Blob)) throw new Weigering("Geen foto ontvangen.");
    if (foto.size > MAX_FOTO || klein.size > MAX_KLEIN) throw new Weigering("Deze foto is te groot.");
    if (!(await isJpeg(foto)) || !(await isJpeg(klein))) throw new Weigering("Dit bestand is geen foto die Tante kan gebruiken.");

    const db = getSupabase();

    // Bestaande pagina (vervangen) of een nieuwe aan het eind.
    let pagina: Pagina | null = null;
    if (typeof pageId === "string" && pageId) {
      const { data } = await db.from("pages").select().eq("id", pageId).eq("order_id", order.id).maybeSingle<Pagina>();
      if (!data) throw new Weigering("Onbekende pagina.", 404);
      pagina = data;
    } else {
      const paginas = await haalPaginas(order.id);
      if (paginas.length >= boek.maxFotos) throw new Weigering(`Er passen maximaal ${boek.maxFotos} foto's in het boek.`);
      const positie = (paginas.at(-1)?.positie ?? 0) + 1;
      const { data, error } = await db.from("pages").insert({ order_id: order.id, positie }).select().single<Pagina>();
      if (error) throw new Error(`Pagina aanmaken mislukt: ${error.message}`);
      pagina = data;
    }

    // Nieuwe, onvoorspelbare bestandsnamen; de oude foto ruimen we daarna op.
    const sleutel = randomBytes(8).toString("hex");
    const fotoPad = `${order.id}/${pagina.id}-${sleutel}.jpg`;
    const kleinPad = `${order.id}/${pagina.id}-${sleutel}-klein.jpg`;
    const opslag = db.storage.from(buckets.fotos);
    const [a, b] = await Promise.all([
      opslag.upload(fotoPad, foto, { contentType: "image/jpeg", upsert: false }),
      opslag.upload(kleinPad, klein, { contentType: "image/jpeg", upsert: false }),
    ]);
    if (a.error || b.error) {
      await verwijderBestanden(buckets.fotos, [a.error ? null : fotoPad, b.error ? null : kleinPad]);
      if (!pageId) await db.from("pages").delete().eq("id", pagina.id);
      throw new Error(`Upload naar opslag mislukt: ${a.error?.message ?? b.error?.message}`);
    }

    const { data: bijgewerkt, error } = await db
      .from("pages")
      .update({ foto_pad: fotoPad, foto_klein_pad: kleinPad, draaiing: 0 })
      .eq("id", pagina.id)
      .select()
      .single<Pagina>();
    if (error) throw new Error(`Pagina bijwerken mislukt: ${error.message}`);
    await verwijderBestanden(buckets.fotos, [pagina.foto_pad, pagina.foto_klein_pad]);

    const { data: link } = await opslag.createSignedUrl(kleinPad, 60 * 60);
    return Response.json({ pagina: bijgewerkt, kleinUrl: link?.signedUrl ?? null });
  } catch (e) {
    if (e instanceof Weigering) return Response.json({ fout: e.message }, { status: e.status });
    console.error("Foto-upload mislukt:", e instanceof Error ? e.message : e);
    return Response.json({ fout: "Het uploaden ging mis. Probeer het nog eens." }, { status: 500 });
  }
}
