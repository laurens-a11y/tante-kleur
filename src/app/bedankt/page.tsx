import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getStripe } from "@/lib/stripe";
import { site } from "@/config";
import s from "../page.module.css";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Bedankt voor je bestelling – Tante Kleur",
  robots: { index: false },
};

export default function BedanktPage({ searchParams }: PageProps<"/bedankt">) {
  return (
    <main className={s.hero} style={{ minHeight: "100vh" }}>
      <div className={`${s.narrow} ${s.stack}`} style={{ gap: 28, paddingTop: 48 }}>
        <Link href="/" className={s.tag} style={{ display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}><Icon name="links" size={18} />Tante Kleur</Link>
        <Suspense fallback={<p className={s.lead}>Even kijken…</p>}>
          <OrderStatus searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function OrderStatus({ searchParams }: { searchParams: PageProps<"/bedankt">["searchParams"] }) {
  const { session_id } = await searchParams;
  // De Stripe SDK gebruikt Date.now(); pas op request-tijd uitvoeren.
  await connection();
  const sessionId = typeof session_id === "string" ? session_id : null;

  let name: string | null = null;
  let paid = false;
  if (sessionId?.startsWith("cs_")) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      name = session.customer_details?.name?.split(" ")[0] ?? null;
      paid = session.payment_status !== "unpaid";
    } catch {
      // Onbekende sessie: toon de algemene tekst.
    }
  }

  const uploadUrl = site.uploadUrl && sessionId ? `${site.uploadUrl}?order=${encodeURIComponent(sessionId)}` : null;

  return (
    <>
      <h1 className={`${s.display} ${s.h1}`}>{name ? `Dankjewel, ${name}!` : "Dankjewel!"}</h1>
      <p className={s.lead}>
        {paid
          ? "Je betaling is binnen. Tante gaat er eens lekker voor zitten."
          : "We wachten nog op de bevestiging van je betaling. Je krijgt een mail zodra die binnen is."}
      </p>
      <p className={s.lead}>
        Volgende stap: stuur Tante je 20 tot 25 mooiste foto&apos;s. Daarna krijg je binnen een paar dagen een
        digitale proef van je boek.
      </p>
      {uploadUrl ? (
        <a href={uploadUrl} className={s.btn} style={{ alignSelf: "flex-start" }}>Upload je foto&apos;s</a>
      ) : (
        <p className={s.body}>Je ontvangt per mail een link om je foto&apos;s te uploaden.</p>
      )}
    </>
  );
}
