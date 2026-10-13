import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/config";
import { getHomeContent } from "@/sanity/content";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import s from "../page.module.css";
import x from "@/components/site.module.css";

export const metadata: Metadata = {
  title: "Over Tante Kleur & contact",
  description: "Wie Tante Kleur is, waar ze voor staat en hoe je contact opneemt.",
};

const waarden = [
  { titel: "Een boek om te bewaren", tekst: "Stevige hardcover, eigen titel, rustige lijnen. Geen printje, maar iets voor in de kast.", kleur: "var(--roze)" },
  { titel: "Eerlijk over AI", tekst: "Tante tekent met hulp van AI en kijkt elke plaat na. Jij ziet altijd eerst een proef.", kleur: "var(--lichtblauw)" },
  { titel: "Zorgvuldig met je foto's", tekst: "Alleen voor jouw boek, en direct verwijderd zodra het naar de drukker gaat.", kleur: "var(--geel)" },
];

export default async function OverOnsPage() {
  const { homepagina } = await getHomeContent();
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
            <h2 className={`${s.display} ${s.h2}`}>Waar Tante voor staat</h2>
            <div className={x.cards}>
              {waarden.map((w) => (
                <div key={w.titel} className={x.card} style={{ background: w.kleur }}>
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
            <h2 className={`${s.display} ${s.h2}`}>Vraagje voor Tante?</h2>
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
