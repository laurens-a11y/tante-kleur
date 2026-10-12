import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
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
      {/* Tally past de hoogte van het formulier automatisch aan. */}
      <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" />
    </main>
  );
}

async function TallyForm({ searchParams }: { searchParams: PageProps<"/upload">["searchParams"] }) {
  const { order } = await searchParams;

  const params = new URLSearchParams({
    transparentBackground: "1",
    dynamicHeight: "1",
    alignLeft: "1",
  });
  // Ordernummer (Stripe Checkout Session) als verborgen veld meegeven.
  if (typeof order === "string" && order.startsWith("cs_")) {
    params.set("order", order);
  }

  return (
    <iframe
      data-tally-src={`https://tally.so/r/${site.tallyFormId}?${params.toString()}`}
      loading="lazy"
      width="100%"
      height="900"
      style={{ border: 0, width: "100%" }}
      title="Stuur Tante je mooiste foto's"
    />
  );
}
