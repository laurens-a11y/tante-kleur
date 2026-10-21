import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { boek, geldendeKleuren, standaardBinnenKleur } from "@/config";
import { haalOrderOpCode, haalPaginas, kleineFotoLinks, type Order } from "@/lib/orders";
import s from "../../page.module.css";
import b from "./boek.module.css";
import { Boekbouwer } from "./Boekbouwer";
import { Proef } from "./Proef";
import { linksVoorPaginas } from "@/lib/beheer-orders";

export const metadata: Metadata = {
  title: "Jouw kleurboek – Tante Kleur",
  robots: { index: false, follow: false },
  // De persoonlijke link niet meesturen naar andere sites.
  referrer: "no-referrer",
};

export default function BoekPagina({ params }: PageProps<"/boek/[code]">) {
  return (
    <main className={b.pagina}>
      <div className={b.kop}>
        <Link href="/" aria-label="Tante Kleur, naar de homepage">
          <Image src="/brand/mark-color.png" alt="Tante Kleur" width={118} height={52} preload />
        </Link>
      </div>
      <Suspense fallback={<p className={`${s.lead} ${b.midden}`}>Je boek wordt geopend…</p>}>
        <BoekInhoud params={params} />
      </Suspense>
    </main>
  );
}

async function BoekInhoud({ params }: { params: PageProps<"/boek/[code]">["params"] }) {
  await connection();
  const { code } = await params;
  const order = await haalOrderOpCode(code);
  if (!order) notFound();

  // Bij vaste kleuren (fase 1) ziet de klant die, niet zijn eerdere keuze.
  const kleuren = geldendeKleuren(order.cover_kleur, order.binnen_kleur);

  if (order.status === "proef_klaar") {
    const paginas = await haalPaginas(order.id);
    const links = await linksVoorPaginas(paginas, false);
    const kleur = boek.coverKleuren.find((k) => k.value === kleuren.cover);
    return (
      <Proef
        code={order.code}
        titel={order.cover_titel ?? ""}
        kleur={{ achtergrond: kleur?.kleur ?? "blauw", tekst: kleur?.tekst ?? "wit" }}
        binnenKleur={kleuren.binnen ?? standaardBinnenKleur}
        inleiding={order.inleiding ?? ""}
        nawoord={order.nawoord ?? ""}
        paginas={paginas.map((p) => ({ id: p.id, titel: p.titel ?? "", verhaal: p.verhaal ?? "", opmerking: p.opmerking ?? "", tekenplaat: links[p.id]?.tekenplaat ?? null }))}
      />
    );
  }
  if (order.status !== "betaald") return <BoekStatus order={order} />;

  const paginas = await haalPaginas(order.id);
  const links = await kleineFotoLinks(paginas);

  return (
    <Boekbouwer
      code={order.code}
      voornaam={order.naam?.split(" ")[0] ?? null}
      begin={{
        titel: order.cover_titel ?? "",
        kleur: kleuren.cover ?? "",
        binnenKleur: kleuren.binnen ?? standaardBinnenKleur,
        inleiding: order.inleiding ?? "",
        nawoord: order.nawoord ?? "",
        paginas: paginas.map((p) => ({
          id: p.id,
          titel: p.titel ?? "",
          verhaal: p.verhaal ?? "",
          draaiing: p.draaiing,
          kleinUrl: links[p.id] ?? null,
        })),
      }}
    />
  );
}

const statusTekst: Record<Exclude<Order["status"], "betaald">, { kop: string; tekst: string }> = {
  ingediend: {
    kop: "Tante is aan de slag!",
    tekst: "We hebben alles binnen. Tante maakt nu de kleurplaten van je foto's. Binnen een paar dagen krijg je een mail met de digitale proef.",
  },
  in_productie: {
    kop: "Tante is aan het tekenen",
    tekst: "Je kleurplaten worden gemaakt (of aangepast als je opmerkingen had). Zodra de proef klaar is, krijg je een mail.",
  },
  proef_klaar: {
    kop: "Je proef is klaar",
    tekst: "Je kunt je proef hier bekijken en goedkeuren.",
  },
  akkoord: {
    kop: "Bedankt voor je akkoord!",
    tekst: "Je boek gaat naar de drukker. Je hoort van ons zodra het onderweg is.",
  },
  gedrukt: {
    kop: "Je boek is gedrukt",
    tekst: "Het wordt ingepakt en komt zo snel mogelijk naar je toe.",
  },
  verzonden: {
    kop: "Je boek is onderweg!",
    tekst: "Veel kleurplezier. We zien graag een foto van het resultaat: tag ons op Instagram of Pinterest.",
  },
};

function BoekStatus({ order }: { order: Order }) {
  const status = statusTekst[order.status as Exclude<Order["status"], "betaald">];
  const kleur = boek.coverKleuren.find((k) => k.value === order.cover_kleur);
  return (
    <section className={`${b.blok} ${b.midden}`}>
      {order.cover_titel && (
        <div
          className={b.coverMini}
          style={{ background: `var(--${kleur?.kleur ?? "blauw"})`, color: `var(--${kleur?.tekst ?? "wit"})` }}
        >
          <span className={s.display}>{order.cover_titel}</span>
        </div>
      )}
      <h1 className={`${s.display} ${s.h2}`}>{status.kop}</h1>
      <p className={s.lead}>{status.tekst}</p>
    </section>
  );
}
