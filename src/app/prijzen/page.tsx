import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { site } from "@/config";
import { getInstellingen, getPagina, getMetadata } from "@/sanity/content";
import { JsonLd } from "@/components/JsonLd";
import { product } from "@/lib/gestructureerde-data";
import { CheckoutButton } from "../CheckoutButton";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import s from "../page.module.css";
import x from "@/components/site.module.css";
import { Icon } from "@/components/Icon";

export async function generateMetadata(): Promise<Metadata> {
  return getMetadata("prijzenPagina");
}

function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default async function PrijzenPage() {
  const { price } = site;
  const [p, instellingen] = await Promise.all([getPagina("prijzenPagina"), getInstellingen()]);
  return (
    <>
      <JsonLd data={product({ omschrijving: instellingen.merkOmschrijving })} />
      <SiteHeader current="/prijzen" />
      <main>
        <section className={x.pageHero}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <p className={s.tag}>Prijs</p>
            <h1 className={`${s.display} ${s.h1}`}>{p.kop}</h1>
            <p className={s.lead}>{p.intro}</p>
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
                {p.kenmerken.map((k) => (
                  <Fragment key={k._key ?? k.label}>
                    <dt>{k.label}</dt>
                    <dd>{k.waarde}</dd>
                  </Fragment>
                ))}
              </dl>
              <CheckoutButton className={s.btn} />
            </div>
          </div>
        </section>

        <section id="verzending" className={s.section}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <Icon name="verzending" size={64} />
            <h2 className={`${s.display} ${s.h2}`}>{p.verzendingKop}</h2>
            <ul className={s.checks}>
              {p.verzendingPunten.map((t) => (
                <li key={t}><Icon name="akkoord" size={22} /><span>{t}</span></li>
              ))}
              {site.deadlines.map((d) => (
                <li key={d.feest}><Icon name="cadeau" size={22} /><span>Voor {d.feest}: bestel uiterlijk {d.datum}.</span></li>
              ))}
            </ul>
          </div>
        </section>

        <section className={s.b2b}>
          <div className={s.wrap} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
            <div className={s.stack} style={{ flex: "1 1 520px", minWidth: 0, gap: 12 }}>
              <h2 className={`${s.display} ${s.h2}`}>{p.zakelijkKop}</h2>
              <p className={s.body} style={{ fontSize: 18 }}>{p.zakelijkTekst}</p>
            </div>
            <Link href="/zakelijk" className={s.btn}>Bekijk zakelijk</Link>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 32 }}>
            <h2 className={`${s.display} ${s.h2}`}>{p.weetjesKop}</h2>
            <div className={s.faq}>
              {p.weetjes.map((w) => (
                <div key={w._key ?? w.titel} className={s.faqItem}>
                  <h3>{w.titel}</h3>
                  <p className={s.body}>{w.tekst}</p>
                </div>
              ))}
            </div>
            <Link href="/vragen" className={s.btnGhost} style={{ alignSelf: "flex-start" }}>Alle vragen</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
