import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { vereisBeheer } from "@/lib/beheer";
import { configsVoorRonde, laatsteRonde, testRondes, vindRonde } from "@/lib/tekenconfigs";
import { lijstTestFotos } from "@/lib/testomgeving";
import s from "../../page.module.css";
import b from "../beheer.module.css";
import t from "./test.module.css";
import { TestLab } from "./TestLab";

export const metadata: Metadata = {
  title: "Testomgeving – Beheer – Tante Kleur",
  robots: { index: false, follow: false },
};

export default function TestPagina({ searchParams }: PageProps<"/beheer/test">) {
  return (
    <main className={b.pagina}>
      <div className={t.breed}>
        <Link href="/beheer">← Alle bestellingen</Link>
        <div className={b.kopRij}>
          <h1 className={`${s.display} ${s.h3}`}>Testomgeving tekenplaten</h1>
        </div>
        <p className={t.uitleg}>
          Los van de bestellingen. Upload testfoto&apos;s, laat de foto analyseren (keuring + tekenbriefing) en laat de configuraties van de ronde
          met dezelfde briefing tekenen. Zet de ChatGPT-plaat ernaast en beoordeel elke plaat. Klik op een afbeelding om groot te vergelijken. Foto&apos;s,
          briefings en de ChatGPT-plaat zijn in elke ronde hetzelfde; platen en scores horen bij één ronde.
        </p>
        <Suspense fallback={<p>Laden…</p>}>
          <Inhoud searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Inhoud({ searchParams }: { searchParams: PageProps<"/beheer/test">["searchParams"] }) {
  await connection();
  await vereisBeheer();
  const ronde = vindRonde((await searchParams).ronde) ?? vindRonde(laatsteRonde)!;
  const fotos = await lijstTestFotos();
  if (!fotos) {
    return (
      <section className={b.kaart}>
        <p className={b.fout}>De testomgeving is nog niet ingericht.</p>
        <p>
          Voer eenmalig <code>supabase/migrations/0006_testomgeving.sql</code> uit in Supabase → SQL Editor → Run, en herlaad deze pagina.
        </p>
      </section>
    );
  }
  // Alleen de platen van deze ronde; eerdere rondes blijven bewaard.
  const vanRonde = fotos.map((f) => ({ ...f, platen: f.platen.filter((p) => (p.ronde ?? 1) === ronde.nr) }));
  return (
    <>
      <nav className={b.filters} aria-label="Testronde">
        {testRondes.map((r) => (
          <Link key={r.nr} href={`/beheer/test?ronde=${r.nr}`} className={`${b.filter} ${r.nr === ronde.nr ? b.filterActief : ""}`}>
            {r.naam}
          </Link>
        ))}
      </nav>
      <p className={t.uitleg}>{ronde.uitleg}</p>
      <TestLab key={ronde.nr} beginFotos={vanRonde} configs={configsVoorRonde(ronde)} ronde={ronde.nr} />
    </>
  );
}
