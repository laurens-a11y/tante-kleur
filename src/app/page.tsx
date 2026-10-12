import Image from "next/image";
import { site } from "@/config";
import { getHomeContent } from "@/sanity/content";
import { CheckoutButton } from "./CheckoutButton";
import s from "./page.module.css";

const covers = [
  { src: "/brand/henk-blue.jpg", alt: "Blauw kleurboek met de titel Henk & Ingrid" },
  { src: "/brand/spanje-desk.jpg", alt: "Lichtblauw kleurboek Spanje 2025 op een houten tafel" },
  { src: "/brand/berlijn-hold.jpg", alt: "Roze kleurboek Weekend Berlijn met een lijntekening op de cover" },
  { src: "/brand/henk-orange.jpg", alt: "Oranje kleurboek Henk & Ingrid tussen kleurpotloden" },
  { src: "/brand/spanje-yellow.jpg", alt: "Geel kleurboek Spanje 2025 onder de arm" },
];

const perks = [
  "20 tot 25 kleurplaten van jouw eigen foto's",
  "Stevige hardcover op A4-formaat",
  "Je eigen titel en kleur op de cover",
  "Eerst een digitale proef, pas daarna drukken",
];

const fallbackFaqs = [
  {
    q: "Welke foto's werken het best?",
    a: "Scherpe foto's met goed licht, waarop gezichten goed te zien zijn. Selfies, portretten, huisdieren en vakantiekiekjes werken prima. Grote groepsfoto's en donkere of wazige foto's minder.",
  },
  {
    q: "Wat gebeurt er met mijn foto's?",
    a: "We gebruiken je foto's alleen om jouw boek te maken. Zodra je boek naar de drukker gaat, verwijderen we ze direct. Zonder jouw toestemming laten we ze nooit aan iemand anders zien.",
  },
  {
    q: "Kan ik iets laten aanpassen?",
    a: "Ja. Je krijgt eerst een digitale proef. Is een plaat niet goed gelukt, dan maken we hem opnieuw of kies je een andere foto.",
  },
  {
    q: "Hoe lang duurt het?",
    a: `Na je akkoord op de proef ligt je boek binnen ${site.leadTimeDays} werkdagen bij je thuis. Wil je het voor een verjaardag of feestdag? Bestel dan op tijd.`,
  },
];

function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function Check() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F73D11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

export default async function Home() {
  const { price, email, company } = site;
  // Teksten, vragen en voorbeeld komen uit Sanity; zonder Sanity-content vallen we terug op de standaardteksten.
  const { homepagina, vragen, voorbeeld } = await getHomeContent();
  const faqs = vragen ? vragen.map((v) => ({ key: v._id, q: v.vraag, a: v.antwoord })) : fallbackFaqs.map((f) => ({ key: f.q, ...f }));

  return (
    <>
      <div className={s.announce}>
        Introductieprijs: jouw kleurboek voor €{price.intro}, straks €{price.regular}.
      </div>

      <header className={s.header}>
        <nav className={s.nav} aria-label="Hoofdmenu">
          <a href="#top" aria-label="Tante Kleur, naar boven">
            <Image src="/brand/mark-color.png" alt="Tante Kleur" width={118} height={52} priority />
          </a>
          <div className={s.navLinks}>
            <a href="#hoe">Zo werkt het</a>
            <a href="#voorbeelden">Voorbeelden</a>
            <a href="#prijs">Prijs</a>
            <a href="#zakelijk">Zakelijk</a>
            <a href="#vragen">Vragen</a>
          </div>
          <CheckoutButton className={`${s.btn} ${s.btnSmall}`} />
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section id="top" className={s.hero}>
          <div className={`${s.wrap} ${s.row}`}>
            <div className={`${s.col} ${s.stack}`} style={{ gap: 28 }}>
              <p className={s.tag}>Gepersonaliseerde kleurboeken</p>
              <h1 className={`${s.display} ${s.h1}`}>{homepagina.heroKop}</h1>
              <p className={s.lead} style={{ maxWidth: 480 }}>{homepagina.heroIntro}</p>
              <div className={s.buttons}>
                <CheckoutButton className={s.btn} />
                <a href="#voorbeelden" className={s.btnGhost}>Bekijk voorbeelden</a>
              </div>
              <p className={s.heroPerks}>
                <span>Hardcover A4</span>
                <span>Jouw foto&apos;s, jouw titel</span>
                <span>Eerst een proef, dan pas drukken</span>
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
              <Image src="/brand/mark-onblue.png" alt="" aria-hidden="true" width={700} height={308} className={s.heroBadge} />
            </div>
          </div>
        </section>

        {/* Merkverhaal */}
        <section className={`${s.section} ${s.story}`}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 28 }}>
            <p className={`${s.display} ${s.storyLine}`} style={{ color: "var(--roze)" }}>
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
              <h2 className={`${s.display} ${s.h2}`}>Laat het maar aan Tante over.</h2>
            </div>
            <div className={s.steps}>
              <div className={s.step} style={{ background: "var(--roze)" }}>
                <svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 9" /><path d="M16 2v6M13 5h6" /></svg>
                <p className={s.wide} style={{ color: "var(--rood)", fontSize: 15 }}>Stap 1</p>
                <h3 className={`${s.display} ${s.h3}`}>Kies je foto&apos;s</h3>
                <p className={s.body}>Upload 20 tot 25 foto&apos;s van de mensen, dieren en plekken die je dierbaar zijn, en bedenk een titel voor de cover.</p>
              </div>
              <div className={s.step} style={{ background: "var(--lichtblauw)" }}>
                <svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                <p className={s.wide} style={{ color: "var(--rood)", fontSize: 15 }}>Stap 2</p>
                <h3 className={`${s.display} ${s.h3}`}>Tante tekent</h3>
                <p className={s.body}>Elke foto wordt een kleurplaat. Je krijgt eerst een digitale proef en mag platen laten aanpassen, verwisselen of weglaten.</p>
              </div>
              <div className={s.step} style={{ background: "var(--geel)" }}>
                <svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2z" /><path d="M22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z" /></svg>
                <p className={s.wide} style={{ fontSize: 15 }}>Stap 3</p>
                <h3 className={`${s.display} ${s.h3}`}>Jij kleurt</h3>
                <p className={s.body}>Na je akkoord drukken we jouw boek. Binnen {site.leadTimeDays} werkdagen ligt het bij je op de mat, klaar om te pronken op de koffietafel.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Van foto naar kleurplaat */}
        <section id="voorbeelden" className={s.section} style={{ background: "var(--roze)" }}>
          <div className={`${s.wrap} ${s.row}`}>
            <div className={`${s.col} ${s.stack}`} style={{ flexBasis: 380 }}>
              <p className={s.tag}>Van camerarol naar kleurplaat</p>
              <h2 className={`${s.display} ${s.h2}`}>Jouw mensen, jouw plekken, jouw verhaal.</h2>
              <p className={s.body} style={{ fontSize: 18 }}>
                Geen standaard plaatjes, maar je eigen herinneringen. Fijne, rustige lijnen die herkenbaar blijven, met
                genoeg detail om er een avond lekker in te verdwalen.
              </p>
            </div>
            <div className={s.compare}>
              <div className={s.stack} style={{ gap: 10 }}>
                <Image
                  src={voorbeeld?.foto.url ?? "/brand/foto-berlijn.jpg"}
                  alt={voorbeeld?.foto.alt ?? "Selfie van twee vriendinnen op een treinperron in Berlijn"}
                  width={800}
                  height={1000}
                  sizes="(max-width: 700px) 50vw, 360px"
                  className={s.frame}
                />
                <p className={s.wide}>De foto</p>
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
                <h2 className={`${s.display} ${s.h2}`}>Henk &amp; Ingrid. Spanje 2025. Weekend Berlijn.</h2>
              </div>
              <p className={s.body} style={{ maxWidth: 360 }}>Kies een kleur, zet er je eigen titel op en Tante doet de rest.</p>
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
                {perks.map((p) => (
                  <li key={p}><Check /><span>{p}</span></li>
                ))}
              </ul>
              <CheckoutButton className={s.btn} />
            </div>
          </div>
        </section>

        {/* Cadeau */}
        <section className={`${s.section} ${s.gift}`}>
          <div className={`${s.wrap} ${s.row}`}>
            <div className={`${s.col} ${s.stack}`} style={{ flexBasis: 400 }}>
              <p className={s.tag} style={{ color: "var(--geel)" }}>Voor jezelf of iemand dierbaars</p>
              <h2 className={`${s.display} ${s.h2}`} style={{ color: "var(--geel)" }}>Het liefste cadeau dat je zelf hebt gemaakt.</h2>
              <p className={s.body} style={{ fontSize: 18 }}>
                Voor je moeder, je beste vriendin of opa en oma met al hun kleinkinderen. Een herinnering die je samen
                kleurt, en die daarna gewoon in de kast blijft staan.
              </p>
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
              <h2 className={`${s.display} ${s.h2}`}>Een relatiegeschenk dat niemand weggeeft.</h2>
              <p className={s.body} style={{ fontSize: 18, maxWidth: 620 }}>
                Voor teamuitjes, jubilea, onboarding of de kerstattentie. Iedere medewerker krijgt een eigen, persoonlijk boek.
              </p>
            </div>
            <a href={`mailto:${email}?subject=Offerte%20zakelijke%20kleurboeken`} className={s.btn}>Vraag een offerte aan</a>
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
              {faqs.map((f) => (
                <div key={f.key} className={s.faqItem}>
                  <h3>{f.q}</h3>
                  <p className={s.body}>{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.stack}`} style={{ gap: 72 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
            <div className={s.stack} style={{ flex: "1 1 420px", minWidth: 0, gap: 24 }}>
              <p className={s.display} style={{ fontSize: "clamp(40px, 5vw, 72px)", lineHeight: 1, color: "var(--roze)" }}>
                Kleur met Tante Kleur.
              </p>
              <CheckoutButton className={s.btnPink} />
            </div>
            <Image src="/brand/logo-onblue.png" alt="Tante Kleur, gepersonaliseerde kleurboeken" width={280} height={190} />
          </div>
          <div className={s.footerBottom}>
            <span>© 2026 Tante Kleur · KvK {company.kvk} · btw {company.vat}</span>
            <div className={s.footerLinks}>
              {/* TODO: privacyverklaring en algemene voorwaarden als eigen pagina's */}
              <a href="#vragen">Privacy</a>
              <a href="#vragen">Voorwaarden</a>
              <a href={`mailto:${email}`}>Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
