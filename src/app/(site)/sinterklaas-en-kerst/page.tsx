import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/config";
import { getPagina, getMetadata } from "@/sanity/content";
import { MetOpties } from "@/sanity/MetOpties";
import type { FetchOpties } from "@/sanity/live";
import { CheckoutButton } from "../CheckoutButton";
import { blokStijl, knopStijl } from "@/components/merkkleur";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import s from "../page.module.css";
import x from "@/components/site.module.css";
import { Icon } from "@/components/Icon";

export async function generateMetadata(): Promise<Metadata> {
  return getMetadata("feestdagenPagina");
}

const kleuren = ["roze", "lichtblauw", "geel"] as const;

export default function FeestdagenPage() {
  return <MetOpties>{(opties) => <FeestdagenInhoud opties={opties} />}</MetOpties>;
}

async function FeestdagenInhoud({ opties }: { opties: FetchOpties }) {
  const p = await getPagina("feestdagenPagina", opties);
  return (
    <>
      <SiteHeader current="/sinterklaas-en-kerst" />
      <main>
        <section className={s.hero}>
          <div className={`${s.wrap} ${s.row}`}>
            <div className={`${s.col} ${s.stack}`} style={{ gap: 24 }}>
              <p className={s.tag}>{p.label}</p>
              <h1 className={`${s.display} ${s.h1}`}>{p.kop}</h1>
              <p className={s.lead}>{p.intro}</p>
              <CheckoutButton {...knopStijl(p.heroKnop)}>{p.heroKnop.tekst}</CheckoutButton>
            </div>
            <div className={s.giftGrid}>
              {p.heroAfbeeldingen.map((b, i) => (
                <Image key={b.src} src={b.src} alt={b.alt} width={1000} height={1250} sizes="(max-width: 700px) 50vw, 300px" className={s.frame} priority={i === 0} />
              ))}
            </div>
          </div>
        </section>

        <section className={s.section} style={{ background: "var(--lichtblauw)" }}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 32 }}>
            <div className={s.stack} style={{ gap: 12, maxWidth: 640 }}>
              <p className={s.tag}>{p.deadlineLabel}</p>
              <h2 className={`${s.display} ${s.h2}`}>{p.deadlineKop}</h2>
              <p className={s.body}>{p.deadlineTekst}</p>
            </div>
            <div className={x.deadlines}>
              {site.deadlines.map((d) => (
                <div key={d.feest} className={x.deadline}>
                  <Icon name="cadeau" size={40} />
                  <p className={s.wide}>Voor {d.feest}</p>
                  <p className={`${s.display} ${x.deadlineDate}`}>{d.datum}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <h2 className={`${s.display} ${s.h2}`}>{p.ideeenKop}</h2>
            <div className={x.cards}>
              {p.ideeen.map((i, n) => (
                <div key={i._key ?? i.titel} className={x.card} {...blokStijl(i.achtergrond, kleuren[n % kleuren.length])}>
                  <Icon name={i.icoon} size={44} />
                  <h3 className={x.cardTitle}>{i.titel}</h3>
                  <p className={s.body}>{i.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.gift}`}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <p className={s.tag} style={{ color: "var(--geel)" }}>{p.tipLabel}</p>
            <h2 className={`${s.display} ${s.h2}`} style={{ color: "var(--geel)" }}>{p.tipKop}</h2>
            <p className={s.lead}>{p.tipTekst}</p>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20, alignItems: "flex-start" }}>
            <h2 className={`${s.display} ${s.h2}`}>€{site.price.intro} per boek</h2>
            <p className={s.body}>{p.prijsTekst}</p>
            <CheckoutButton {...knopStijl(p.prijsKnop)}>{p.prijsKnop.tekst}</CheckoutButton>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
