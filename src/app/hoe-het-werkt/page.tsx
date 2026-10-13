import type { Metadata } from "next";
import Link from "next/link";
import { getPagina } from "@/sanity/content";
import { CheckoutButton } from "../CheckoutButton";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import s from "../page.module.css";
import x from "@/components/site.module.css";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Zo werkt het – Tante Kleur",
  description: "Van bestellen tot kleuren: hoe Tante Kleur van jouw foto's een kleurboek maakt, en welke foto's het mooist uitpakken.",
};

const kleuren = ["var(--roze)", "var(--lichtblauw)", "var(--geel)"];

export default async function HoeHetWerktPage() {
  const p = await getPagina("hoeHetWerktPagina");
  return (
    <>
      <SiteHeader current="/hoe-het-werkt" />
      <main>
        <section className={x.pageHero}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <p className={s.tag}>Zo werkt het</p>
            <h1 className={`${s.display} ${s.h1}`}>{p.kop}</h1>
            <p className={s.lead}>{p.intro}</p>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <h2 className={`${s.display} ${s.h2}`}>{p.stappenKop}</h2>
            <div className={s.steps}>
              {p.stappen.map((st, i) => (
                <div key={st._key ?? st.titel} className={s.step} style={{ background: kleuren[i % kleuren.length] }}>
                  <Icon name={st.icoon} size={52} />
                  <p className={s.wide} style={{ color: "var(--rood)", fontSize: 15 }}>Stap {i + 1}</p>
                  <h3 className={`${s.display} ${s.h3}`}>{st.titel}</h3>
                  <p className={s.body}>{st.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.story}`}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <p className={s.tag} style={{ color: "var(--roze)" }}>Hoe Tante tekent</p>
            <h2 className={`${s.display} ${s.h2}`}>{p.tekenenKop}</h2>
            <p className={s.lead}>{p.tekenenTekst}</p>
          </div>
        </section>

        <section id="fototips" className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <div className={s.stack} style={{ gap: 12, maxWidth: 640 }}>
              <p className={s.tag}>Fototips</p>
              <h2 className={`${s.display} ${s.h2}`}>{p.fototipsKop}</h2>
            </div>
            <div className={x.tips}>
              <div className={x.card} style={{ background: "var(--lichtblauw)" }}>
                <h3 className={x.cardTitle} style={{ display: "flex", gap: 10, alignItems: "center" }}><Icon name="akkoord" size={26} />Werkt goed</h3>
                <ul>
                  {p.werktGoed.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>
              <div className={x.card} style={{ background: "var(--roze)" }}>
                <h3 className={x.cardTitle} style={{ display: "flex", gap: 10, alignItems: "center" }}><Icon name="verwijderen" size={24} />Werkt minder goed</h3>
                <ul>
                  {p.werktMinder.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className={s.section} style={{ background: "var(--lichtblauw)" }}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <h2 className={`${s.display} ${s.h2}`}>{p.tijdlijnKop}</h2>
            <ol className={x.timeline}>
              {p.tijdlijn.map((m) => (
                <li key={m._key ?? m.titel}><strong>{m.titel}</strong><span className={s.body}>{m.tekst}</span></li>
              ))}
            </ol>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <h2 className={`${s.display} ${s.h2}`}>{p.privacyKop}</h2>
            <ul className={s.checks}>
              {p.privacyPunten.map((t) => (
                <li key={t}><Icon name="akkoord" size={22} /><span>{t}</span></li>
              ))}
            </ul>
            <p className={s.body}>
              Meer lezen? Bekijk de <Link href="/privacy">privacyverklaring</Link>.
            </p>
            <CheckoutButton className={s.btn} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
