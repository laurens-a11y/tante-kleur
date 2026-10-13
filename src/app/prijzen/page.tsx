import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/config";
import { CheckoutButton } from "../CheckoutButton";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import s from "../page.module.css";
import x from "@/components/site.module.css";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Prijs – Tante Kleur",
  description: `Jouw persoonlijke hardcover kleurboek voor €${site.price.intro} (introductieprijs). Inclusief btw, verzending in Nederland en België.`,
};

function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function PrijzenPage() {
  const { price } = site;
  return (
    <>
      <SiteHeader current="/prijzen" />
      <main>
        <section className={x.pageHero}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <p className={s.tag}>Prijs</p>
            <h1 className={`${s.display} ${s.h1}`}>Eén boek, helemaal van jou.</h1>
            <p className={s.lead}>Alle prijzen zijn inclusief btw.</p>
          </div>
        </section>

        <section className={s.section} style={{ background: "var(--lichtblauw)" }}>
          <div className={`${s.wrap} ${s.priceRow}`}>
            <div className={s.priceMedia}>
              <Image src="/brand/hero.jpg" alt="Drie Tante Kleur-kleurboeken op een zonnige tafel" fill sizes="(max-width: 900px) 100vw, 600px" style={{ objectFit: "cover" }} />
            </div>
            <div className={s.priceCard}>
              <p className={s.tag}>Het kleurboek</p>
              <p style={{ margin: 0, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 12 }}>
                <span className={`${s.display} ${s.price}`}>€{price.intro}</span>
                <span style={{ fontSize: 15 }}>incl. btw</span>
              </p>
              <p style={{ margin: 0, fontSize: 15 }}>
                Introductieprijs, daarna €{price.regular}. Verzending NL en BE: {formatEuro(site.shippingCents)}.
              </p>
              <dl className={x.specs}>
                <dt>Kleurplaten</dt>
                <dd>{site.plates}, van jouw eigen foto&apos;s</dd>
                <dt>Formaat</dt>
                <dd>A4, staand</dd>
                <dt>Kaft</dt>
                <dd>Stevige hardcover met je eigen titel en kleur</dd>
                <dt>Proef</dt>
                <dd>Eerst digitaal bekijken, pas daarna drukken</dd>
              </dl>
              <CheckoutButton className={s.btn} />
            </div>
          </div>
        </section>

        <section id="verzending" className={s.section}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <Icon name="verzending" size={64} />
            <h2 className={`${s.display} ${s.h2}`}>Verzending en levertijd</h2>
            <ul className={s.checks}>
              <li><Icon name="akkoord" size={22} /><span>We bezorgen in Nederland en België voor {formatEuro(site.shippingCents)} per boek.</span></li>
              <li><Icon name="akkoord" size={22} /><span>Na je akkoord op de proef ligt je boek binnen {site.leadTimeDays} werkdagen bij je thuis.</span></li>
              {site.deadlines.map((d) => (
                <li key={d.feest}><Icon name="cadeau" size={22} /><span>Voor {d.feest}: bestel uiterlijk {d.datum}.</span></li>
              ))}
            </ul>
          </div>
        </section>

        <section className={s.b2b}>
          <div className={s.wrap} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
            <div className={s.stack} style={{ flex: "1 1 520px", minWidth: 0, gap: 12 }}>
              <h2 className={`${s.display} ${s.h2}`}>Meer dan tien boeken?</h2>
              <p className={s.body} style={{ fontSize: 18 }}>Voor je team, een jubileum of als relatiegeschenk maken we graag een voorstel.</p>
            </div>
            <Link href="/zakelijk" className={s.btn}>Bekijk zakelijk</Link>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 32 }}>
            <h2 className={`${s.display} ${s.h2}`}>Goed om te weten</h2>
            <div className={s.faq}>
              <div className={s.faqItem}>
                <h3>Hoe kan ik betalen?</h3>
                <p className={s.body}>Via Stripe, met de betaalmethoden die je bij het afrekenen ziet. Je betaalgegevens komen niet bij ons terecht.</p>
              </div>
              <div className={s.faqItem}>
                <h3>Kan ik mijn boek retourneren?</h3>
                <p className={s.body}>Omdat elk boek speciaal voor jou wordt gemaakt, geldt het herroepingsrecht niet. Gaat er iets mis bij het drukken of de bezorging, dan lossen we het op.</p>
              </div>
            </div>
            <Link href="/vragen" className={s.btnGhost} style={{ alignSelf: "flex-start" }}>Alle vragen</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
