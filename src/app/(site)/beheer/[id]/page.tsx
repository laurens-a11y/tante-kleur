import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { nawoordAan } from "@/config";
import { vereisBeheer } from "@/lib/beheer";
import { haalOrder, linksVoorPaginas, statusLabel } from "@/lib/beheer-orders";
import { haalPaginas } from "@/lib/orders";
import s from "../../page.module.css";
import b from "../beheer.module.css";
import { BeheerOrder } from "./BeheerOrder";
import { GekozenKleuren } from "../Kleuren";

export const metadata: Metadata = {
  title: "Bestelling – Beheer – Tante Kleur",
  robots: { index: false, follow: false },
};

export default function OrderPagina({ params }: PageProps<"/beheer/[id]">) {
  return (
    <main className={b.pagina}>
      <div className={b.breed}>
        <Link href="/beheer">← Alle bestellingen</Link>
        <Suspense fallback={<p>Laden…</p>}>
          <OrderInhoud params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function OrderInhoud({ params }: { params: PageProps<"/beheer/[id]">["params"] }) {
  await connection();
  await vereisBeheer();
  const { id } = await params;
  const order = await haalOrder(id);
  if (!order) notFound();
  const paginas = await haalPaginas(order.id);
  const links = await linksVoorPaginas(paginas, true);
  const adres = order.verzendadres;

  return (
    <>
      <div className={b.kopRij}>
        <h1 className={`${s.display} ${s.h3}`}>{order.cover_titel || "(nog geen titel)"}</h1>
        <span className={b.knoppen}>
          {!order.livemode && <span className={b.test}>Test</span>}
          <span className={b.status} data-status={order.status}>
            {statusLabel(order.status)}
          </span>
        </span>
      </div>

      <section className={`${b.kaart} ${b.gegevens}`}>
        <div>
          <p className={b.label}>Klant</p>
          <p className={b.tekstBlok}>
            {order.naam ?? "-"}
            {"\n"}
            {order.email ?? "-"}
          </p>
        </div>
        <div>
          <p className={b.label}>Verzendadres</p>
          <p className={b.tekstBlok}>
            {adres ? [adres.line1, adres.line2, `${adres.postal_code ?? ""} ${adres.city ?? ""}`, adres.country].filter(Boolean).join("\n") : "-"}
          </p>
        </div>
        <div>
          <p className={b.label}>Covertitel</p>
          <p className={b.tekstBlok}>
            {order.cover_titel ?? "-"}
          </p>
        </div>
        <div>
          <p className={b.label}>Kleuren</p>
          <GekozenKleuren cover={order.cover_kleur} binnen={order.binnen_kleur} />
        </div>
        <div>
          <p className={b.label}>Link van de klant</p>
          <p className={b.tekstBlok}>
            <a href={`/boek/${order.code}`} target="_blank" rel="noreferrer">
              Boek openen als klant
            </a>
          </p>
        </div>
      </section>

      <section className={b.kaart}>
        <p className={b.label}>Inleiding</p>
        <p className={b.tekstBlok}>{order.inleiding ?? "(leeg)"}</p>
        <p className={b.label}>{nawoordAan ? "Nawoord" : "Nawoord (staat nu niet in het boek)"}</p>
        <p className={b.tekstBlok}>{order.nawoord ?? "(leeg)"}</p>
      </section>

      <BeheerOrder
        orderId={order.id}
        status={order.status}
        titel={order.cover_titel ?? "boek"}
        paginas={paginas.map((p) => ({
          id: p.id,
          positie: p.positie,
          draaiing: p.draaiing,
          titel: p.titel ?? "",
          verhaal: p.verhaal ?? "",
          opmerking: p.opmerking,
          ...links[p.id],
        }))}
      />
    </>
  );
}
