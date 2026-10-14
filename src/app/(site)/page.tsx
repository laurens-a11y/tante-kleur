import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/config";
import { getHomeContent, getInstellingen, getMetadata } from "@/sanity/content";
import { MetOpties } from "@/sanity/MetOpties";
import type { FetchOpties } from "@/sanity/live";
import { JsonLd } from "@/components/JsonLd";
import { product, stappenplan } from "@/lib/gestructureerde-data";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { CheckoutButton } from "./CheckoutButton";
import { blokStijl, knopStijl } from "@/components/merkkleur";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import s from "./page.module.css";

const covers = [
  { src: "/brand/henk-blue.jpg", alt: "Blauw kleurboek met de titel Henk & Ingrid" },
  { src: "/brand/spanje-desk.jpg", alt: "Lichtblauw kleurboek Spanje 2025 op een houten tafel" },
  { src: "/brand/berlijn-hold.jpg", alt: "Roze kleurboek Weekend Berlijn met een lijntekening op de cover" },
  { src: "/brand/henk-orange.jpg", alt: "Oranje kleurboek Henk & Ingrid tussen kleurpotloden" },
  { src: "/brand/spanje-yellow.jpg", alt: "Geel kleurboek Spanje 2025 onder de arm" },
];

function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function Check() {
  return <Icon name="akkoord" size={22} style={{ marginTop: 2 }} />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getMetadata("homepagina");
}

export default function Home() {
  return <MetOpties>{(opties) => <HomeInhoud opties={opties} />}</MetOpties>;
}

async function HomeInhoud({ opties }: { opties: FetchOpties }) {
  const { price } = site;
  // Teksten, vragen en voorbeeld komen uit Sanity; lege velden vallen terug op src/content/paginas.ts.
  const [{ homepagina, vragen, voorbeeld }, instellingen] = await Promise.all([getHomeContent(opties), getInstellingen()]);
  const stapKleuren = ["roze", "lichtblauw", "geel"] as const;

  return (
    <>
      <JsonLd data={product({ omschrijving: instellingen.merkOmschrijving })} />
      <JsonLd data={stappenplan(homepagina.stappen)} />
      <SiteHeader current="/" />

      <main>
        {/* Hero */}
        <section id="top" className={s.hero}>
          <div className={`${s.wrap} ${s.row}`}>
            <div className={`${s.col} ${s.stack}`} style={{ gap: 28 }}>
              <p className={s.tag}>Gepersonaliseerde kleurboeken</p>
              <h1 className={`${s.display} ${s.h1}`}>{homepagina.heroKop}</h1>
              <p className={s.lead} style={{ maxWidth: 480 }}>{homepagina.heroIntro}</p>
              <div className={s.buttons}>
                <CheckoutButton {...knopStijl(homepagina.heroKnop)}>{homepagina.heroKnop.tekst}</CheckoutButton>
                <Link href="/voorbeelden" {...knopStijl(homepagina.heroKnopVoorbeelden)}>{homepagina.heroKnopVoorbeelden.tekst}</Link>
              </div>
              <p className={s.heroPerks}>
                {homepagina.heroKenmerken.map((k) => (
                  <span key={k}>{k}</span>
                ))}
              </p>
            </div>
            <div className={s.heroMedia}>
              <Image
                src="/brand/spread.jpg"
                alt="Opengeslagen Tante Kleur-kleurboek met een tekstpagina 'Weekend Berlijn' en een kleurplaat van twee vriendinnen"
                width={1000}
                height={1250}
                priority
                sizes="(max-width: 900px) 100vw, 600px"
                className={s.heroPhoto}
              />
              <Image src="/brand/sticker-blauw.svg" alt="" aria-hidden="true" width={787} height={787} unoptimized className={s.heroBadge} />
            </div>
          </div>
        </section>

        {/* Merkverhaal */}
        <section className={`${s.section} ${s.story}`}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 28 }}>
            <p className={s.storyVraag} style={{ color: "var(--roze)" }}>
              {homepagina.verhaalVraag}
            </p>
            <p className={`${s.display} ${s.storyLine}`}>{homepagina.verhaalAntwoord}</p>
            <p className={s.lead} style={{ maxWidth: 640, lineHeight: 1.6 }}>{homepagina.verhaalTekst}</p>
          </div>
        </section>

        {/* Zo werkt het */}
        <section id="hoe" className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 56 }}>
            <div className={s.stack} style={{ gap: 12, maxWidth: 640 }}>
              <p className={s.tag}>Zo werkt het</p>
              <h2 className={`${s.display} ${s.h2}`}>{homepagina.stappenKop}</h2>
            </div>
            <div className={s.steps}>
              {homepagina.stappen.map((st, i) => {
                const blok = blokStijl(st.achtergrond, stapKleuren[i % stapKleuren.length]);
                return (
                <div key={st._key ?? st.titel} className={s.step} style={blok.style}>
                  <Icon name={st.icoon} size={52} />
                  <p className={s.wide} style={{ color: blok.accent, fontSize: 15 }}>Stap {i + 1}</p>
                  <h3 className={`${s.display} ${s.h3}`}>{st.titel}</h3>
                  <p className={s.body}>{st.tekst}</p>
                </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Van foto naar kleurplaat */}
        <section id="voorbeelden" className={s.section} style={{ background: "var(--roze)" }}>
          <div className={`${s.wrap} ${s.row}`}>
            <div className={`${s.col} ${s.stack}`} style={{ flexBasis: 380 }}>
              <p className={s.tag}>Van camerarol naar kleurplaat</p>
              <h2 className={`${s.display} ${s.h2}`}>{homepagina.voorbeeldKop}</h2>
              <p className={s.body} style={{ fontSize: 18 }}>{homepagina.voorbeeldTekst}</p>
            </div>
            <div className={s.compare}>
              <div className={s.stack} style={{ gap: 10 }}>
                <Image
                  src={voorbeeld?.foto.url ?? "/brand/berlijn-hold.jpg"}
                  alt={voorbeeld?.foto.alt ?? "Roze kleurboek Weekend Berlijn met een lijntekening op de cover"}
                  width={800}
                  height={1000}
                  sizes="(max-width: 700px) 50vw, 360px"
                  className={s.frame}
                />
                <p className={s.wide}>{voorbeeld ? "De foto" : "Het boek"}</p>
              </div>
              <div className={s.stack} style={{ gap: 10 }}>
                <Image
                  src={voorbeeld?.kleurplaat.url ?? "/brand/kleurplaat-berlijn.jpg"}
                  alt={voorbeeld?.kleurplaat.alt ?? "Kleurplaat van twee vriendinnen op een treinstation in Berlijn"}
                  width={800}
                  height={1000}
                  sizes="(max-width: 700px) 50vw, 360px"
                  className={s.frame}
                  style={voorbeeld ? undefined : { objectPosition: "60% 30%" }}
                />
                <p className={s.wide}>De kleurplaat</p>
              </div>
            </div>
          </div>
        </section>

        {/* Covers */}
        <section className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 48 }}>
            <div className={s.coverHead}>
              <div className={s.stack} style={{ gap: 12, maxWidth: 620 }}>
                <p className={s.tag}>Jouw titel op de cover</p>
                <h2 className={`${s.display} ${s.h2}`}>{homepagina.coverKop}</h2>
              </div>
              <p className={s.body} style={{ maxWidth: 360 }}>{homepagina.coverTekst}</p>
            </div>
            <div className={s.covers}>
              {covers.map((c) => (
                <Image key={c.src} src={c.src} alt={c.alt} width={1000} height={1250} sizes="(max-width: 700px) 100vw, 240px" className={s.frame} />
              ))}
            </div>
          </div>
        </section>

        {/* Prijs */}
        <section id="prijs" className={s.section} style={{ background: "var(--lichtblauw)" }}>
          <div className={`${s.wrap} ${s.priceRow}`}>
            <div className={s.priceMedia}>
              <Image src="/brand/hero.jpg" alt="Drie Tante Kleur-kleurboeken op een zonnige tafel" fill sizes="(max-width: 900px) 100vw, 600px" style={{ objectFit: "cover" }} />
            </div>
            <div className={s.priceCard}>
              <p className={s.tag}>Het boek</p>
              <h2 className={`${s.display} ${s.h2}`}>Jouw kleurboek</h2>
              <div className={s.stack} style={{ gap: 6 }}>
                <p style={{ margin: 0, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 12 }}>
                  <span className={`${s.display} ${s.price}`}>€{price.intro}</span>
                  <span style={{ fontSize: 15 }}>incl. btw</span>
                </p>
                <p style={{ margin: 0, fontSize: 15 }}>
                  Introductieprijs, daarna €{price.regular}. Verzending NL en BE: {formatEuro(site.shippingCents)}
                </p>
              </div>
              <ul className={s.checks}>
                {homepagina.prijsKenmerken.map((p) => (
                  <li key={p}><Check /><span>{p}</span></li>
                ))}
              </ul>
              <CheckoutButton {...knopStijl(homepagina.prijsKnop)}>{homepagina.prijsKnop.tekst}</CheckoutButton>
            </div>
          </div>
        </section>

        {/* Cadeau */}
        <section className={`${s.section} ${s.gift}`}>
          <div className={`${s.wrap} ${s.row}`}>
            <div className={`${s.col} ${s.stack}`} style={{ flexBasis: 400 }}>
              <p className={s.tag} style={{ color: "var(--geel)" }}>Voor jezelf of iemand dierbaars</p>
              <h2 className={`${s.display} ${s.h2}`} style={{ color: "var(--geel)" }}>{homepagina.cadeauKop}</h2>
              <p className={s.body} style={{ fontSize: 18 }}>{homepagina.cadeauTekst}</p>
              <Link href="/sinterklaas-en-kerst" {...knopStijl(homepagina.cadeauKnop, { style: { alignSelf: "flex-start" } })}>{homepagina.cadeauKnop.tekst}</Link>
            </div>
            <div className={s.giftGrid}>
              <Image src="/brand/xmas-duo.jpg" alt="Twee Tante Kleur-boeken in kerstsfeer" width={1000} height={1250} sizes="(max-width: 700px) 50vw, 300px" className={s.frame} />
              <Image src="/brand/wrapped.jpg" alt="Boek ingepakt in Tante Kleur-cadeaupapier" width={1000} height={1250} sizes="(max-width: 700px) 50vw, 300px" className={s.frame} />
            </div>
          </div>
        </section>

        {/* Zakelijk */}
        <section id="zakelijk" className={s.b2b}>
          <div className={s.wrap} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
            <div className={s.stack} style={{ flex: "1 1 520px", minWidth: 0, gap: 16 }}>
              <p className={s.tag} style={{ color: "var(--blauw)" }}>Zakelijk</p>
              <h2 className={`${s.display} ${s.h2}`}>{homepagina.zakelijkKop}</h2>
              <p className={s.body} style={{ fontSize: 18, maxWidth: 620 }}>{homepagina.zakelijkTekst}</p>
            </div>
            <Link href="/zakelijk" {...knopStijl(homepagina.zakelijkKnop)}>{homepagina.zakelijkKnop.tekst}</Link>
          </div>
        </section>

        {/* Vragen */}
        <section id="vragen" className={s.section}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 40 }}>
            <div className={s.stack} style={{ gap: 12 }}>
              <p className={s.tag}>Vragen</p>
              <h2 className={`${s.display} ${s.h2}`}>Tante legt het even uit.</h2>
            </div>
            <div className={s.faq}>
              {vragen.map((v) => (
                <div key={v._id} className={s.faqItem}>
                  <h3>{v.vraag}</h3>
                  <p className={s.body}>{v.antwoord}</p>
                </div>
              ))}
            </div>
            <Link href="/vragen" {...knopStijl(homepagina.vragenKnop, { style: { alignSelf: "flex-start" } })}>{homepagina.vragenKnop.tekst}</Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
