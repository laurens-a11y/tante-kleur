import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/config";
import { CheckoutButton } from "../CheckoutButton";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import s from "../page.module.css";
import x from "@/components/site.module.css";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Persoonlijk Sinterklaas- en kerstcadeau: een kleurboek van je eigen foto's – Tante Kleur",
  description: `Het persoonlijkste cadeau in de schoen of onder de boom. Bestel op tijd: ${site.deadlines.map((d) => `${d.feest} uiterlijk ${d.datum}`).join(", ")}.`,
};

const ideeen = [
  { icon: "hartje" as const, titel: "Voor opa en oma", tekst: "Alle kleinkinderen in één boek. Om samen in te kleuren als ze op bezoek komen.", kleur: "var(--roze)" },
  { icon: "cadeau" as const, titel: "Van de kinderen", tekst: "Voor papa of mama: de mooiste momenten van het jaar, door de kinderen zelf gekozen.", kleur: "var(--lichtblauw)" },
  { icon: "boek" as const, titel: "Het jaar van het gezin", tekst: "Vakantie, verjaardagen en die ene zondagmiddag. Een jaaroverzicht om in te kleuren.", kleur: "var(--geel)" },
  { icon: "favoriet" as const, titel: "Voor de vriendinnen", tekst: "Het weekendje weg, de festivals, de eindeloze etentjes. Elk een eigen boek.", kleur: "var(--roze)" },
];

export default function FeestdagenPage() {
  return (
    <>
      <SiteHeader current="/sinterklaas-en-kerst" />
      <main>
        <section className={s.hero}>
          <div className={`${s.wrap} ${s.row}`}>
            <div className={`${s.col} ${s.stack}`} style={{ gap: 24 }}>
              <p className={s.tag}>Sinterklaas &amp; kerst</p>
              <h1 className={`${s.display} ${s.h1}`}>Het persoonlijkste cadeau in de schoen of onder de boom.</h1>
              <p className={s.lead}>
                Geen cadeaubon of sokken, maar een kleurboek vol eigen herinneringen. Met een eigen titel op de cover.
              </p>
              <CheckoutButton className={s.btn} />
            </div>
            <div className={s.giftGrid}>
              <Image src="/brand/xmas-duo.jpg" alt="Twee Tante Kleur-boeken in kerstsfeer" width={1000} height={1250} sizes="(max-width: 700px) 50vw, 300px" className={s.frame} priority />
              <Image src="/brand/wrapped.jpg" alt="Boek ingepakt in Tante Kleur-cadeaupapier" width={1000} height={1250} sizes="(max-width: 700px) 50vw, 300px" className={s.frame} />
            </div>
          </div>
        </section>

        <section className={s.section} style={{ background: "var(--lichtblauw)" }}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 32 }}>
            <div className={s.stack} style={{ gap: 12, maxWidth: 640 }}>
              <p className={s.tag}>Op tijd bestellen</p>
              <h2 className={`${s.display} ${s.h2}`}>Bestel uiterlijk</h2>
              <p className={s.body}>Dan is er tijd voor het uploaden van je foto&apos;s, de proef en het drukken.</p>
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
            <h2 className={`${s.display} ${s.h2}`}>Voor wie?</h2>
            <div className={x.cards}>
              {ideeen.map((i) => (
                <div key={i.titel} className={x.card} style={{ background: i.kleur }}>
                  <Icon name={i.icon} size={44} />
                  <h3 className={x.cardTitle}>{i.titel}</h3>
                  <p className={s.body}>{i.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.gift}`}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <p className={s.tag} style={{ color: "var(--geel)" }}>Tip voor Sinterklaas</p>
            <h2 className={`${s.display} ${s.h2}`} style={{ color: "var(--geel)" }}>Laat de titel alvast iets verklappen.</h2>
            <p className={s.lead}>
              Een titel als &ldquo;Opa &amp; zijn kleine kleurders&rdquo; of &ldquo;Ons jaar 2026&rdquo; maakt het gedicht
              nog leuker. Meerdere boeken bestellen, voor beide opa&apos;s en oma&apos;s? Dat kan gewoon.
            </p>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20, alignItems: "flex-start" }}>
            <h2 className={`${s.display} ${s.h2}`}>€{site.price.intro} per boek</h2>
            <p className={s.body}>Introductieprijs, daarna €{site.price.regular}. Inclusief btw, exclusief verzending.</p>
            <CheckoutButton className={s.btn} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
