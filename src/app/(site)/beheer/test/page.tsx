import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { vereisBeheer } from "@/lib/beheer";
import { tekenConfigs } from "@/lib/tekenconfigs";
import { lijstTestFotos } from "@/lib/testomgeving";
import s from "../../page.module.css";
import b from "../beheer.module.css";
import t from "./test.module.css";
import { TestLab } from "./TestLab";

export const metadata: Metadata = {
  title: "Testomgeving – Beheer – Tante Kleur",
  robots: { index: false, follow: false },
};

export default function TestPagina() {
  return (
    <main className={b.pagina}>
      <div className={t.breed}>
        <Link href="/beheer">← Alle bestellingen</Link>
        <div className={b.kopRij}>
          <h1 className={`${s.display} ${s.h3}`}>Testomgeving tekenplaten</h1>
        </div>
        <p className={t.uitleg}>
          Los van de bestellingen. Upload testfoto&apos;s, laat de foto analyseren (keuring + tekenbriefing) en laat alle configuraties met dezelfde
          briefing tekenen. Zet de ChatGPT-plaat ernaast en beoordeel elke plaat. Klik op een afbeelding om groot te vergelijken.
        </p>
        <Suspense fallback={<p>Laden…</p>}>
          <Inhoud />
        </Suspense>
      </div>
    </main>
  );
}

async function Inhoud() {
  await connection();
  await vereisBeheer();
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
  return <TestLab beginFotos={fotos} configs={[...tekenConfigs]} />;
}
