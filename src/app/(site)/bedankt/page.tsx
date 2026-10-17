import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getStripe } from "@/lib/stripe";
import { site } from "@/config";
import { zorgVoorOrder } from "@/lib/orders";
import { headers } from "next/headers";
import s from "../page.module.css";
import { Icon } from "@/components/Icon";
import { knopStijl } from "@/components/merkkleur";
import { knop } from "@/content/knoppen";

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
  let boekLink: string | null = null;
  if (sessionId?.startsWith("cs_")) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      name = session.customer_details?.name?.split(" ")[0] ?? null;
      paid = session.payment_status !== "unpaid";
      if (paid) {
        // Meestal heeft de webhook de order al aangemaakt; zo niet, dan doen we het hier.
        const host = (await headers()).get("host");
        const origin = host ? `${host.startsWith("localhost") ? "http" : "https"}://${host}` : "https://tantekleur.nl";
        const order = await zorgVoorOrder(session, origin);
        if (order) boekLink = `/boek/${order.code}`;
      }
    } catch (error) {
      // Onbekende sessie of tijdelijke storing: toon de algemene tekst. De klant krijgt de link ook per mail.
      console.error("Bedankpagina: order ophalen mislukt:", error instanceof Error ? error.message : error);
    }
  }

  return (
    <>
      <h1 className={`${s.display} ${s.h1}`}>{name ? `Dankjewel, ${name}!` : "Dankjewel!"}</h1>
      <p className={s.lead}>
        {paid
          ? "Je betaling is binnen. Tante gaat er eens lekker voor zitten."
          : "We wachten nog op de bevestiging van je betaling. Je krijgt een mail zodra die binnen is."}
      </p>
      <p className={s.lead}>
        Volgende stap: kies de titel van je cover en stuur Tante je {site.plates} mooiste foto&apos;s, met bij
        elke foto een verhaaltje als je wilt. Daarna krijg je binnen een paar dagen een digitale proef van je boek.
      </p>
      {boekLink ? (
        <>
          <a href={boekLink} {...knopStijl(knop("Vul mijn boek"), { style: { alignSelf: "flex-start" } })}>Vul mijn boek</a>
          <p className={s.body}>We hebben de link ook gemaild, zodat je later verder kunt.</p>
        </>
      ) : (
        <p className={s.body}>
          Je ontvangt binnen een paar minuten een mail met de link naar je boek. Niets ontvangen? Mail Tante via {site.email}.
        </p>
      )}
    </>
  );
}
