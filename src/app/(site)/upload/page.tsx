import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { site } from "@/config";
import s from "../page.module.css";

export const metadata: Metadata = {
  title: "Stuur Tante je mooiste foto's – Tante Kleur",
  robots: { index: false },
};

export default function UploadPage({ searchParams }: PageProps<"/upload">) {
  return (
    <main className={s.hero} style={{ minHeight: "100vh", paddingBottom: 48 }}>
      <div className={`${s.narrow} ${s.stack}`} style={{ gap: 24 }}>
        <Link href="/" aria-label="Tante Kleur, naar de homepage" style={{ alignSelf: "flex-start" }}>
          <Image src="/brand/mark-color.png" alt="Tante Kleur" width={118} height={52} priority />
        </Link>
        <Suspense fallback={<p className={s.lead}>Formulier laden…</p>}>
          <TallyForm searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function TallyForm({ searchParams }: { searchParams: PageProps<"/upload">["searchParams"] }) {
  const { order } = await searchParams;

  // Geen dynamicHeight: dan schakelt Tally het scrollen in het formulier uit en
  // moet de pagina de hoogte overnemen, wat niet altijd lukte. Nu scrolt het
  // formulier zelf binnen een iframe ter hoogte van het scherm.
  const params = new URLSearchParams({
    transparentBackground: "1",
    alignLeft: "1",
  });
  // Ordernummer (Stripe Checkout Session) als verborgen veld meegeven.
  if (typeof order === "string" && order.startsWith("cs_")) {
    params.set("order", order);
  }

  const formUrl = `https://tally.so/r/${site.tallyFormId}?${params.toString()}`;

  return (
    <>
      <iframe
        src={formUrl}
        width="100%"
        style={{ border: 0, width: "100%", height: "calc(100dvh - 180px)", minHeight: 560, display: "block" }}
        title="Stuur Tante je mooiste foto's"
      />
      <p className={s.body} style={{ fontSize: 15 }}>
        Lukt het uploaden niet goed? <a href={formUrl} target="_blank" rel="noopener">Open het formulier in een nieuw venster</a>.
      </p>
    </>
  );
}
