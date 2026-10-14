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

export async function generateMetadata(): Promise<Metadata> {
  return getMetadata("overOnsPagina");
}

const kleuren = ["roze", "lichtblauw", "geel"] as const;

export default function OverOnsPage() {
  return <MetOpties>{(opties) => <OverOnsInhoud opties={opties} />}</MetOpties>;
}

async function OverOnsInhoud({ opties }: { opties: FetchOpties }) {
  const [homepagina, p] = await Promise.all([getPagina("homepagina", opties), getPagina("overOnsPagina", opties)]);
  const { company, email } = site;

  return (
    <>
      <SiteHeader current="/over-ons" />
      <main>
        <section className={x.pageHero}>
          <div className={`${s.wrap} ${s.row}`}>
            <div className={`${s.col} ${s.stack}`} style={{ gap: 20 }}>
              <p className={s.tag}>Over Tante Kleur</p>
              <h1 className={`${s.display} ${s.h1}`}>{homepagina.verhaalAntwoord}</h1>
              <p className={s.lead}>{homepagina.verhaalTekst}</p>
            </div>
            <div className={s.heroMedia}>
              <Image src="/brand/spread.jpg" alt="Opengeslagen Tante Kleur-kleurboek met een kleurplaat van twee vriendinnen" width={1000} height={1250} sizes="(max-width: 900px) 100vw, 520px" className={s.heroPhoto} priority />
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

        <section id="contact" className={`${s.section} ${s.story}`}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 24 }}>
            <p className={s.tag} style={{ color: "var(--roze)" }}>Contact</p>
            <Icon name="chat" size={56} />
            <h2 className={`${s.display} ${s.h2}`}>{p.contactKop}</h2>
            <p className={s.lead}>
              Mail naar <a href={`mailto:${email}`}>{email}</a>. Heb je al besteld? Zet dan je ordernummer of de naam op je
              bestelling in de mail.
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
