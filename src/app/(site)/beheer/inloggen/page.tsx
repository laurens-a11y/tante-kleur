import type { Metadata } from "next";
import { Suspense } from "react";
import s from "../../page.module.css";
import b from "../beheer.module.css";

export const metadata: Metadata = {
  title: "Beheer – Tante Kleur",
  robots: { index: false, follow: false },
};

export default function InloggenPagina({ searchParams }: PageProps<"/beheer/inloggen">) {
  return (
    <main className={b.pagina}>
      <form action="/api/beheer/inloggen" method="POST" className={`${b.kaart} ${b.inlog}`}>
        <h1 className={`${s.display} ${s.h3}`}>Beheer</h1>
        <label className={b.label} htmlFor="wachtwoord">
          Wachtwoord
        </label>
        <input id="wachtwoord" name="wachtwoord" type="password" autoComplete="current-password" required className={b.invoer} autoFocus />
        <Suspense fallback={null}>
          <Fout searchParams={searchParams} />
        </Suspense>
        <button type="submit" className={b.knopVol}>
          Inloggen
        </button>
      </form>
    </main>
  );
}

async function Fout({ searchParams }: { searchParams: PageProps<"/beheer/inloggen">["searchParams"] }) {
  const { fout } = await searchParams;
  if (!fout) return null;
  return (
    <p className={b.fout} role="alert">
      Dat wachtwoord klopt niet. Is BEHEER_WACHTWOORD ingesteld in Vercel (minimaal 12 tekens)?
    </p>
  );
}
