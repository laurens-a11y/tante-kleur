import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config";
import { vragenPerThema } from "@/content/vragen";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import s from "../page.module.css";
import x from "@/components/site.module.css";

export const metadata: Metadata = {
  title: "Veelgestelde vragen – Tante Kleur",
  description: "Antwoorden over het boek, je foto's, privacy, bestellen, levertijd en retour.",
};

export default function VragenPage() {
  return (
    <>
      <SiteHeader current="/vragen" />
      <main>
        <section className={x.pageHero}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <p className={s.tag}>Vragen</p>
            <h1 className={`${s.display} ${s.h1}`}>Tante legt het even uit.</h1>
            <p className={s.lead}>
              Staat je vraag er niet bij? Mail Tante via <a href={`mailto:${site.email}`}>{site.email}</a>.
            </p>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.narrow} ${x.faqGroups}`}>
            {vragenPerThema.map((groep) => (
              <div key={groep.thema} className={s.stack} style={{ gap: 16 }}>
                <h2 className={`${s.display} ${s.h3}`}>{groep.thema}</h2>
                <div>
                  {groep.vragen.map((v) => (
                    <details key={v.q} className={x.faqDetails}>
                      <summary>{v.q}</summary>
                      <p className={s.body}>{v.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
            <p className={s.body}>
              Meer over je gegevens lees je in de <Link href="/privacy">privacyverklaring</Link> en de{" "}
              <Link href="/voorwaarden">algemene voorwaarden</Link>.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
