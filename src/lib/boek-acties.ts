import "server-only";
import { boek } from "@/config";
import { getSupabase, buckets } from "@/lib/supabase";
import { haalOrderOpCode, haalPaginas, hernummer, verwijderBestanden, boekUrl, type Order, type Pagina } from "@/lib/orders";
import { verrijkTekst } from "@/lib/ai";
import { stuurIngediend } from "@/lib/mail";

// Alle wijzigingen die een klant in het boekformulier kan doen. Elke actie
// controleert eerst de code én of het boek nog bewerkt mag worden.

export class Weigering extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export async function bewerkbareOrder(code: string): Promise<Order> {
  const order = await haalOrderOpCode(code);
  if (!order) throw new Weigering("Dit boek bestaat niet.", 404);
  if (order.status !== "betaald") throw new Weigering("Je boek is al ingediend en kan niet meer worden aangepast.", 409);
  return order;
}

async function eigenPagina(order: Order, pageId: unknown): Promise<Pagina> {
  if (typeof pageId !== "string") throw new Weigering("Onbekende pagina.");
  const { data } = await getSupabase().from("pages").select().eq("id", pageId).eq("order_id", order.id).maybeSingle<Pagina>();
  if (!data) throw new Weigering("Onbekende pagina.", 404);
  return data;
}

function tekst(waarde: unknown, max: number, veld: string): string | null {
  if (waarde === null || waarde === undefined) return null;
  if (typeof waarde !== "string") throw new Weigering(`Ongeldige ${veld}.`);
  const schoon = waarde.replace(/\r\n/g, "\n").trim();
  if (schoon.length > max) throw new Weigering(`De ${veld} is te lang (maximaal ${max} tekens).`);
  return schoon === "" ? null : schoon;
}

async function update(tabel: "orders" | "pages", id: string, velden: Record<string, unknown>) {
  const { error } = await getSupabase().from(tabel).update(velden).eq("id", id);
  if (error) throw new Error(`Opslaan mislukt: ${error.message}`);
}

// Alleen verzoeken vanaf onze eigen site (extra drempel naast de geheime code).
export function vanDezeSite(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

type Invoer = Record<string, unknown>;

export async function voerUit(code: string, invoer: Invoer, origin: string): Promise<Record<string, unknown>> {
  const order = await bewerkbareOrder(code);

  switch (invoer.actie) {
    case "cover": {
      const velden: Record<string, unknown> = {};
      if ("titel" in invoer) velden.cover_titel = tekst(invoer.titel, boek.maxTitel, "titel");
      if ("kleur" in invoer) {
        if (!boek.coverKleuren.some((k) => k.value === invoer.kleur)) throw new Weigering("Onbekende coverkleur.");
        velden.cover_kleur = invoer.kleur;
      }
      await update("orders", order.id, velden);
      return {};
    }

    case "tekst": {
      // Inleiding of nawoord. `eigen` = de eigen tekst van de klant vóór een overgenomen AI-voorstel.
      const soort = invoer.soort;
      if (soort !== "inleiding" && soort !== "nawoord") throw new Weigering("Onbekend tekstveld.");
      const max = soort === "inleiding" ? boek.maxInleiding : boek.maxNawoord;
      const velden: Record<string, unknown> = { [soort]: tekst(invoer.tekst, max, soort) };
      if ("eigen" in invoer) velden[`${soort}_eigen`] = tekst(invoer.eigen, 4000, soort);
      await update("orders", order.id, velden);
      return {};
    }

    case "verhaal": {
      const pagina = await eigenPagina(order, invoer.pageId);
      const velden: Record<string, unknown> = { verhaal: tekst(invoer.tekst, boek.maxVerhaal, "verhaal") };
      if ("eigen" in invoer) velden.verhaal_eigen = tekst(invoer.eigen, 4000, "verhaal");
      await update("pages", pagina.id, velden);
      return {};
    }

    case "draai": {
      const pagina = await eigenPagina(order, invoer.pageId);
      const graden = invoer.graden;
      if (graden !== 0 && graden !== 90 && graden !== 180 && graden !== 270) throw new Weigering("Ongeldige draaiing.");
      await update("pages", pagina.id, { draaiing: graden });
      return {};
    }

    case "verplaats": {
      const pagina = await eigenPagina(order, invoer.pageId);
      const stap = invoer.richting === "omhoog" ? -1 : invoer.richting === "omlaag" ? 1 : 0;
      if (!stap) throw new Weigering("Ongeldige richting.");
      const paginas = await haalPaginas(order.id);
      const i = paginas.findIndex((p) => p.id === pagina.id);
      const j = i + stap;
      if (j < 0 || j >= paginas.length) return { volgorde: paginas.map((p) => p.id) };
      [paginas[i], paginas[j]] = [paginas[j], paginas[i]];
      await Promise.all(paginas.map((p, n) => (p.positie === n + 1 ? null : update("pages", p.id, { positie: n + 1 }))));
      return { volgorde: paginas.map((p) => p.id) };
    }

    case "verwijder": {
      const pagina = await eigenPagina(order, invoer.pageId);
      const { error } = await getSupabase().from("pages").delete().eq("id", pagina.id);
      if (error) throw new Error(`Verwijderen mislukt: ${error.message}`);
      await verwijderBestanden(buckets.fotos, [pagina.foto_pad, pagina.foto_klein_pad]);
      await hernummer(order.id);
      return {};
    }

    case "verrijk": {
      const soort = invoer.soort;
      if (soort !== "verhaal" && soort !== "inleiding" && soort !== "nawoord") throw new Weigering("Onbekend tekstveld.");
      const bron = tekst(invoer.tekst, 2000, "tekst");
      if (!bron || bron.length < 3) throw new Weigering("Schrijf eerst een paar woorden, dan maakt Tante er iets moois van.");
      if (order.ai_aanroepen >= boek.maxAiAanroepen) {
        throw new Weigering("Je hebt het maximale aantal voorstellen voor dit boek gebruikt. Je eigen tekst werkt natuurlijk ook prima!", 429);
      }
      // Eerst tellen, dan aanroepen: zo telt ook een mislukte poging mee (tegen misbruik).
      await update("orders", order.id, { ai_aanroepen: order.ai_aanroepen + 1 });
      try {
        const voorstel = await verrijkTekst({ soort, tekst: bron, titel: order.cover_titel });
        if (!voorstel) throw new Error("Leeg antwoord");
        return { voorstel, over: boek.maxAiAanroepen - order.ai_aanroepen - 1 };
      } catch (e) {
        console.error(`AI-verrijking mislukt voor order ${order.id}:`, e instanceof Error ? e.message : e);
        throw new Weigering("Tante kon nu even geen voorstel maken. Probeer het zo nog eens.", 502);
      }
    }

    case "indienen": {
      const paginas = await haalPaginas(order.id);
      const metFoto = paginas.filter((p) => p.foto_pad);
      const problemen: string[] = [];
      if (!order.cover_titel) problemen.push("Kies een titel voor de cover.");
      if (!order.cover_kleur) problemen.push("Kies een kleur voor de cover.");
      if (metFoto.length < boek.minFotos) problemen.push(`Voeg minimaal ${boek.minFotos} foto's toe (nu ${metFoto.length}).`);
      if (paginas.length > boek.maxFotos) problemen.push(`Er passen maximaal ${boek.maxFotos} foto's in het boek.`);
      if (problemen.length) return { problemen };

      // Alleen van 'betaald' naar 'ingediend', zodat dubbel klikken niets dubbel doet.
      const { data, error } = await getSupabase()
        .from("orders")
        .update({ status: "ingediend", ingediend_op: new Date().toISOString() })
        .eq("id", order.id)
        .eq("status", "betaald")
        .select("id");
      if (error) throw new Error(`Indienen mislukt: ${error.message}`);
      if (data?.length) {
        try {
          await stuurIngediend({ aan: order.email, naam: order.naam, url: boekUrl(origin, order.code), titel: order.cover_titel! });
        } catch (e) {
          console.error(`Bevestigingsmail mislukt voor order ${order.id}:`, e instanceof Error ? e.message : e);
        }
      }
      return { ingediend: true };
    }

    default:
      throw new Weigering("Onbekende actie.");
  }
}
