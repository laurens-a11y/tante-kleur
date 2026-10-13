import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/config";
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

const gelegenheden = [
  { icon: "cadeau" as const, titel: "Eindejaarsgeschenk", tekst: "Een jaaroverzicht om in te kleuren, in plaats van een kerstpakket dat na twee weken op is." },
  { icon: "favoriet" as const, titel: "Jubileum", tekst: "Tien, vijfentwintig of veertig jaar in dienst: de mooiste momenten in één boek." },
  { icon: "account" as const, titel: "Onboarding", tekst: "Een warm welkom voor nieuwe collega's, met het team en de werkplek erin." },
  { icon: "hartje" as const, titel: "Afscheid", tekst: "Een herinnering aan de collega's en momenten waar iemand jaren deel van was." },
  { icon: "label" as const, titel: "Relatiegeschenk", tekst: "Voor klanten en partners: jullie gezamenlijke projecten en mijlpalen." },
];

const stappen = [
  "Je vraagt een offerte aan en we bespreken wat je wilt",
  "Jullie leveren de foto's aan",
  "Je krijgt een digitale proef ter goedkeuring",
  "We drukken en leveren op één adres of per medewerker",
];

export default function ZakelijkPage() {
  const deadlineKerst = site.deadlines.find((d) => d.feest === "Kerst");
  return (
    <>
      <SiteHeader current="/zakelijk" />
      <main>
        <section className={s.hero} style={{ background: "var(--geel)" }}>
          <div className={`${s.wrap} ${s.row}`}>
            <div className={`${s.col} ${s.stack}`} style={{ gap: 24 }}>
              <p className={s.tag} style={{ color: "var(--blauw)" }}>Zakelijk</p>
              <h1 className={`${s.display} ${s.h1}`}>Een eindejaarscadeau dat over jullie gaat.</h1>
              <p className={s.lead}>Een relatiegeschenk dat niemand weggeeft: een kleurboek met jullie eigen mensen, plekken en momenten.</p>
              <a href="#offerte" className={s.btn} style={{ alignSelf: "flex-start" }}>Vraag een offerte aan</a>
            </div>
            <div className={s.heroMedia}>
              <Image src="/brand/hero.jpg" alt="Drie Tante Kleur-kleurboeken op een zonnige tafel" width={1000} height={1250} sizes="(max-width: 900px) 100vw, 560px" className={s.heroPhoto} priority />
            </div>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <h2 className={`${s.display} ${s.h2}`}>Waarvoor?</h2>
            <div className={x.cards}>
              {gelegenheden.map((g, i) => (
                <div key={g.titel} className={x.card} style={{ background: ["var(--roze)", "var(--lichtblauw)"][i % 2] }}>
                  <Icon name={g.icon} size={44} />
                  <h3 className={x.cardTitle}>{g.titel}</h3>
                  <p className={s.body}>{g.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.story}`}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <h2 className={`${s.display} ${s.h2}`}>Twee mogelijkheden</h2>
            <div className={x.cards}>
              <div className={x.card} style={{ background: "var(--wit)", color: "var(--blauw)" }}>
                <Icon name="boek" size={44} />
                <h3 className={x.cardTitle}>Eén teamboek</h3>
                <p className={s.body}>Iedereen krijgt hetzelfde boek met de mooiste momenten van het team of het jaar. Ideaal als jaaroverzicht.</p>
              </div>
              <div className={x.card} style={{ background: "var(--wit)", color: "var(--blauw)" }}>
                <Icon name="account" size={44} />
                <h3 className={x.cardTitle}>Een eigen boek per persoon</h3>
                <p className={s.body}>Elke medewerker of relatie krijgt een boek met eigen foto&apos;s. Persoonlijker kan het niet.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <h2 className={`${s.display} ${s.h2}`}>Zo werkt het</h2>
            <ol className={x.timeline}>
              {stappen.map((st) => (
                <li key={st}><span className={s.body}>{st}</span></li>
              ))}
            </ol>
            {deadlineKerst && (
              <p className={s.lead}>
                <strong>Voor kerst?</strong> Vraag je offerte zo vroeg mogelijk aan; we plannen terug vanaf je leverdatum.
              </p>
            )}
          </div>
        </section>

        <section id="offerte" className={s.section} style={{ background: "var(--lichtblauw)" }}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 32 }}>
            <div className={s.stack} style={{ gap: 12 }}>
              <p className={s.tag}>Offerte</p>
              <h2 className={`${s.display} ${s.h2}`}>Vertel ons wat je zoekt.</h2>
              <p className={s.body}>Je krijgt een voorstel met prijs per boek en planning. Prijzen voor zakelijke klanten zijn exclusief btw.</p>
            </div>
            <OfferteForm email={site.email} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
