import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config";
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

const steps = [
  { icon: "winkelmandje" as const, kleur: "var(--roze)", titel: "Bestel je boek", tekst: "Klik op Maak mijn boek, reken af en bedenk een titel voor de cover." },
  { icon: "uploaden" as const, kleur: "var(--lichtblauw)", titel: "Stuur je foto's", tekst: `Na het afrekenen upload je ${site.plates} foto's van de mensen, dieren en plekken die je dierbaar zijn.` },
  { icon: "zoeken" as const, kleur: "var(--geel)", titel: "Bekijk je proef", tekst: "Binnen een paar dagen krijg je een digitale proef. Je mag platen laten aanpassen, verwisselen of weglaten." },
  { icon: "boek" as const, kleur: "var(--roze)", titel: "Jij kleurt", tekst: `Na je akkoord drukken we jouw boek. Binnen ${site.leadTimeDays} werkdagen ligt het bij je op de mat.` },
];

export default function HoeHetWerktPage() {
  return (
    <>
      <SiteHeader current="/hoe-het-werkt" />
      <main>
        <section className={x.pageHero}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <p className={s.tag}>Zo werkt het</p>
            <h1 className={`${s.display} ${s.h1}`}>Laat het maar aan Tante over.</h1>
            <p className={s.lead}>Je hebt geen ontwerpervaring nodig. Alleen foto&apos;s waar je blij van wordt.</p>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <h2 className={`${s.display} ${s.h2}`}>In vier stappen</h2>
            <div className={s.steps}>
              {steps.map((st, i) => (
                <div key={st.titel} className={s.step} style={{ background: st.kleur }}>
                  <Icon name={st.icon} size={52} />
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
            <h2 className={`${s.display} ${s.h2}`}>Met hulp van AI, met het oog van Tante.</h2>
            <p className={s.lead}>
              Tante maakt de kleurplaten met hulp van AI. Daarna bekijkt ze elke plaat: zijn de gezichten herkenbaar, zijn de
              lijnen rustig genoeg om in te kleuren? Pas dan krijg jij de proef. En pas na jouw akkoord gaat het boek naar
              de drukker.
            </p>
          </div>
        </section>

        <section id="fototips" className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <div className={s.stack} style={{ gap: 12, maxWidth: 640 }}>
              <p className={s.tag}>Fototips</p>
              <h2 className={`${s.display} ${s.h2}`}>Welke foto&apos;s werken het best?</h2>
            </div>
            <div className={x.tips}>
              <div className={x.card} style={{ background: "var(--lichtblauw)" }}>
                <h3 className={x.cardTitle} style={{ display: "flex", gap: 10, alignItems: "center" }}><Icon name="akkoord" size={26} />Werkt goed</h3>
                <ul>
                  <li>Scherpe foto&apos;s met genoeg licht; een gewone telefoonfoto is prima</li>
                  <li>Gezichten goed in beeld, van voren of iets gedraaid</li>
                  <li>Een tot vier personen of dieren op de foto</li>
                  <li>Vakantie, huisdieren, portretten, een dag uit</li>
                </ul>
              </div>
              <div className={x.card} style={{ background: "var(--roze)" }}>
                <h3 className={x.cardTitle} style={{ display: "flex", gap: 10, alignItems: "center" }}><Icon name="verwijderen" size={24} />Werkt minder goed</h3>
                <ul>
                  <li>Donkere foto&apos;s, avondfoto&apos;s of fel tegenlicht</li>
                  <li>Grote groepsfoto&apos;s</li>
                  <li>Wazige of bewogen foto&apos;s</li>
                  <li>Tekst in beeld, zoals op een shirt of bord</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className={s.section} style={{ background: "var(--lichtblauw)" }}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <h2 className={`${s.display} ${s.h2}`}>Wanneer heb je je boek?</h2>
            <ol className={x.timeline}>
              <li><strong>Bestellen</strong><span className={s.body}>Afrekenen en covertitel kiezen</span></li>
              <li><strong>Uploaden</strong><span className={s.body}>Jij stuurt je foto&apos;s</span></li>
              <li><strong>Proef</strong><span className={s.body}>Binnen een paar dagen in je mail</span></li>
              <li><strong>Drukken en bezorgen</strong><span className={s.body}>Binnen {site.leadTimeDays} werkdagen na je akkoord</span></li>
            </ol>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <h2 className={`${s.display} ${s.h2}`}>Je foto&apos;s zijn bij Tante veilig</h2>
            <ul className={s.checks}>
              <li><Icon name="akkoord" size={22} /><span>We gebruiken je foto&apos;s alleen om jouw boek te maken.</span></li>
              <li><Icon name="akkoord" size={22} /><span>Zodra je boek naar de drukker gaat, verwijderen we ze direct.</span></li>
              <li><Icon name="akkoord" size={22} /><span>Je foto&apos;s worden niet gebruikt om AI te trainen.</span></li>
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
