import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/config";
import { getPagina, getMetadata } from "@/sanity/content";
import { MetOpties } from "@/sanity/MetOpties";
import type { FetchOpties } from "@/sanity/live";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import s from "../page.module.css";
import x from "@/components/site.module.css";
import { Icon } from "@/components/Icon";
import { blokStijl } from "@/components/merkkleur";
import { MetMailLink } from "@/components/MetMailLink";

export async function generateMetadata(): Promise<Metadata> {
  return getMetadata("overOnsPagina");
}

const kleuren = ["roze", "lichtblauw", "geel"] as const;

export default function OverOnsPage() {
  return <MetOpties>{(opties) => <OverOnsInhoud opties={opties} />}</MetOpties>;
}

async function OverOnsInhoud({ opties }: { opties: FetchOpties }) {
  const [homepagina, p] = await Promise.all([getPagina("homepagina", opties), getPagina("overOnsPagina", opties)]);
  const { company } = site;
  const makersBlok = blokStijl(p.makersAchtergrond, "lichtblauw");

  return (
    <>
      <SiteHeader current="/over-ons" />
      <main>
        <section className={x.pageHero}>
          <div className={`${s.wrap} ${s.row}`}>
            <div className={`${s.col} ${s.stack}`} style={{ gap: 20 }}>
              <p className={s.tag}>{p.label}</p>
              <h1 className={`${s.display} ${s.h1}`}>{homepagina.verhaalAntwoord}</h1>
              <p className={s.lead}>{homepagina.verhaalTekst}</p>
            </div>
            <div className={s.heroMedia}>
              <Image src={p.afbeelding.src} alt={p.afbeelding.alt} width={1000} height={1250} sizes="(max-width: 900px) 100vw, 520px" className={s.heroPhoto} loading="eager" fetchPriority="low" />
            </div>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <h2 className={`${s.display} ${s.h2}`}>{p.waardenKop}</h2>
            <div className={x.cards}>
              {p.waarden.map((w, i) => (
                <div key={w._key ?? w.titel} className={x.card} {...blokStijl(w.achtergrond, kleuren[i % kleuren.length])}>
                  <Icon name={w.icoon} size={44} />
                  <h3 className={x.cardTitle}>{w.titel}</h3>
                  <p className={s.body}>{w.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="makers" className={s.section} style={makersBlok.style}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 72 }}>
            <div className={s.row}>
              {p.makersFoto.src && (
                <figure className={x.makersFoto}>
                  <Image src={p.makersFoto.src} alt={p.makersFoto.alt} width={1000} height={1250} sizes="(max-width: 900px) 100vw, 440px" />
                  {p.makersOnderschrift && <figcaption>{p.makersOnderschrift}</figcaption>}
                </figure>
              )}
              <div className={`${s.col} ${s.stack}`} style={{ gap: 20 }}>
                <p className={s.tag} style={{ color: makersBlok.accent }}>{p.makersLabel}</p>
                <h2 className={`${s.display} ${s.h2}`}>{p.makersKop}</h2>
                <p className={s.lead}>{p.makersTekst}</p>
                {p.makersHandTekst && <p className={`${s.lead} ${x.makersHand}`}>{p.makersHandTekst}</p>}
              </div>
            </div>
            <div className={s.stack} style={{ gap: 32 }}>
              <h3 className={x.cardTitle}>{p.makersStappenKop}</h3>
              <ol className={x.timeline} style={{ "--accent": makersBlok.accent } as React.CSSProperties}>
                {p.makersStappen.map((m) => (
                  <li key={m._key ?? m.titel}>
                    <Icon name={m.icoon} size={48} />
                    <strong>{m.titel}</strong>
                    <span className={s.body}>{m.tekst}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="contact" className={`${s.section} ${s.story}`}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 24 }}>
            <p className={s.tag} style={{ color: "var(--roze)" }}>{p.contactLabel}</p>
            <Icon name="chat" size={56} />
            <h2 className={`${s.display} ${s.h2}`}>{p.contactKop}</h2>
            <p className={s.lead}>
              <MetMailLink tekst={p.contactTekst} />
            </p>
            <p className={s.body}>
              Kijk ook even bij de <Link href="/vragen">veelgestelde vragen</Link>; misschien staat je antwoord er al.
            </p>
            <dl className={x.specs}>
              <dt>Handelsnaam</dt>
              <dd>Tante Kleur</dd>
              <dt>Bedrijf</dt>
              <dd>LaunchLab VOF</dd>
              <dt>Adres</dt>
              <dd>{company.address}</dd>
              <dt>KvK</dt>
              <dd>{company.kvk}</dd>
              <dt>Btw</dt>
              <dd>{company.vat}</dd>
            </dl>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
