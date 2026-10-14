import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { vereisBeheer } from "@/lib/beheer";
import { alleStatussen, lijstOrders, statusLabel } from "@/lib/beheer-orders";
import type { OrderStatus } from "@/lib/orders";
import s from "../page.module.css";
import b from "./beheer.module.css";

export const metadata: Metadata = {
  title: "Beheer – Tante Kleur",
  robots: { index: false, follow: false },
};

export default function BeheerPagina({ searchParams }: PageProps<"/beheer">) {
  return (
    <main className={b.pagina}>
      <div className={b.breed}>
        <div className={b.kopRij}>
          <h1 className={`${s.display} ${s.h3}`}>Bestellingen</h1>
          <form action="/api/beheer/uitloggen" method="POST">
            <button type="submit" className={b.knopLeeg}>
              Uitloggen
            </button>
          </form>
        </div>
        <Suspense fallback={<p>Laden…</p>}>
          <Lijst searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

const datum = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

async function Lijst({ searchParams }: { searchParams: PageProps<"/beheer">["searchParams"] }) {
  await connection();
  await vereisBeheer();
  const { status } = await searchParams;
  const filter = alleStatussen.find((x) => x.value === status)?.value;
  const orders = await lijstOrders();
  const aantal = (st: OrderStatus) => orders.filter((o) => o.status === st).length;
  // Standaard: alles wat Tante nog moet doen bovenaan.
  const zichtbaar = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <>
      <nav className={b.filters} aria-label="Filter op status">
        <Link href="/beheer" className={`${b.filter} ${!filter ? b.filterActief : ""}`}>
          Alles ({orders.length})
        </Link>
        {alleStatussen.map((st) => (
          <Link key={st.value} href={`/beheer?status=${st.value}`} className={`${b.filter} ${filter === st.value ? b.filterActief : ""}`}>
            {st.label} ({aantal(st.value)})
          </Link>
        ))}
      </nav>
      <div className={`${b.kaart} ${b.tabelScroll}`}>
        {zichtbaar.length === 0 ? (
          <p>Geen bestellingen.</p>
        ) : (
          <table className={b.tabel}>
            <thead>
              <tr>
                <th>Titel</th>
                <th>Klant</th>
                <th>Status</th>
                <th>Foto&apos;s</th>
                <th>Platen</th>
                <th>Besteld</th>
              </tr>
            </thead>
            <tbody>
              {zichtbaar.map((o) => {
                const fotos = o.pages.filter((p) => p.foto_pad).length;
                const platen = o.pages.filter((p) => p.tekenplaat_pad).length;
                const opmerkingen = o.pages.filter((p) => p.opmerking).length;
                return (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/beheer/${o.id}`}>{o.cover_titel || "(nog geen titel)"}</Link>
                      {opmerkingen > 0 && <div className={b.klein}>{opmerkingen} opmerking(en) van klant</div>}
                    </td>
                    <td>
                      {o.naam ?? "-"}
                      <div className={b.klein}>{o.email}</div>
                    </td>
                    <td>
                      <span className={b.status} data-status={o.status}>
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td>{fotos}</td>
                    <td>
                      {platen}/{o.pages.length}
                    </td>
                    <td className={b.klein}>{datum.format(new Date(o.aangemaakt_op))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
