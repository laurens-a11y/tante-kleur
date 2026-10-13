import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/config";
import { getPagina } from "@/sanity/content";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OfferteForm } from "./OfferteForm";
import s from "../page.module.css";
import x from "@/components/site.module.css";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Zakelijk: een eindejaarscadeau dat over jullie gaat – Tante Kleur",
  description: "Persoonlijke kleurboeken als kerst- of eindejaarsgeschenk, voor jubilea, onboarding of als relatiegeschenk. Vraag een offerte aan.",
};

export default async function ZakelijkPage() {
  const p = await getPagina("zakelijkPagina");
  // "Voor kerst? Vraag je offerte..." → eerste zin vet.
  const [kerstVraag, ...kerstRest] = p.kerstTekst.split(/(?<=\?)\s+/);
  return (
    <>
      <SiteHeader current="/zakelijk" />
      <main>
        <section className={s.hero} style={{ background: "var(--geel)" }}>
          <div className={`${s.wrap} ${s.row}`}>
            <div className={`${s.col} ${s.stack}`} style={{ gap: 24 }}>
              <p className={s.tag} style={{ color: "var(--blauw)" }}>Zakelijk</p>
              <h1 className={`${s.display} ${s.h1}`}>{p.kop}</h1>
              <p className={s.lead}>{p.intro}</p>
              <a href="#offerte" className={s.btn} style={{ alignSelf: "flex-start" }}>Vraag een offerte aan</a>
            </div>
            <div className={s.heroMedia}>
              <Image src="/brand/hero.jpg" alt="Drie Tante Kleur-kleurboeken op een zonnige tafel" width={1000} height={1250} sizes="(max-width: 900px) 100vw, 560px" className={s.heroPhoto} priority />
            </div>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <h2 className={`${s.display} ${s.h2}`}>{p.gelegenhedenKop}</h2>
            <div className={x.cards}>
              {p.gelegenheden.map((g, i) => (
                <div key={g._key ?? g.titel} className={x.card} style={{ background: ["var(--roze)", "var(--lichtblauw)"][i % 2] }}>
                  <Icon name={g.icoon} size={44} />
                  <h3 className={x.cardTitle}>{g.titel}</h3>
                  <p className={s.body}>{g.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.story}`}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <h2 className={`${s.display} ${s.h2}`}>{p.mogelijkhedenKop}</h2>
            <div className={x.cards}>
              {p.mogelijkheden.map((m) => (
                <div key={m._key ?? m.titel} className={x.card} style={{ background: "var(--wit)", color: "var(--blauw)" }}>
                  <Icon name={m.icoon} size={44} />
                  <h3 className={x.cardTitle}>{m.titel}</h3>
                  <p className={s.body}>{m.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <h2 className={`${s.display} ${s.h2}`}>{p.stappenKop}</h2>
            <ol className={x.timeline}>
              {p.stappen.map((st) => (
                <li key={st}><span className={s.body}>{st}</span></li>
              ))}
            </ol>
            {p.kerstTekst && (
              <p className={s.lead}>
                {kerstRest.length ? <><strong>{kerstVraag}</strong> {kerstRest.join(" ")}</> : kerstVraag}
              </p>
            )}
          </div>
        </section>

        <section id="offerte" className={s.section} style={{ background: "var(--lichtblauw)" }}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 32 }}>
            <div className={s.stack} style={{ gap: 12 }}>
              <p className={s.tag}>Offerte</p>
              <h2 className={`${s.display} ${s.h2}`}>{p.offerteKop}</h2>
              <p className={s.body}>{p.offerteTekst}</p>
            </div>
            <OfferteForm email={site.email} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
