import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPagina, getVoorbeelden, getMetadata, type TegelGrootte, type Voorbeeld } from "@/sanity/content";
import { MetOpties } from "@/sanity/MetOpties";
import type { FetchOpties } from "@/sanity/live";
import { CheckoutButton } from "../CheckoutButton";
import { knopStijl } from "@/components/merkkleur";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import s from "../page.module.css";
import x from "@/components/site.module.css";
import v from "./voorbeelden.module.css";
import { VoorbeeldTegel } from "./VoorbeeldTegel";

export async function generateMetadata(): Promise<Metadata> {
  return getMetadata("voorbeeldenPagina");
}

// Zonder voorbeelden in Sanity: het boek zelf als tegenhanger (geen foto's zonder toestemming).
const fallback: Voorbeeld = {
  _id: "berlijn",
  foto: { url: "/brand/berlijn-hold.jpg", alt: "Roze kleurboek Weekend Berlijn met een lijntekening op de cover" },
  kleurplaat: { url: "/brand/kleurplaat-berlijn.jpg", alt: "Kleurplaat van twee vriendinnen op een treinstation in Berlijn" },
  fotoGroot: { url: "/brand/berlijn-hold.jpg", positie: "50% 50%" },
  kleurplaatGroot: { url: "/brand/kleurplaat-berlijn.jpg", positie: "60% 30%" },
  grootte: "breed",
};

// Patroon van 7 tegels dat op desktop (4 kolommen) precies een blok vult, met
// kleuren die nooit naast dezelfde kleur liggen:
//   G G a b
//   G G c c
//   d d e f
// Een formaat uit Sanity gaat voor; de kleur blijft die van de plek in het patroon.
const patroon: { grootte: TegelGrootte; kleur: string }[] = [
  { grootte: "groot", kleur: "var(--roze)" },
  { grootte: "normaal", kleur: "var(--lichtblauw)" },
  { grootte: "normaal", kleur: "var(--geel)" },
  { grootte: "breed", kleur: "var(--rood)" },
  { grootte: "breed", kleur: "var(--geel)" },
  { grootte: "normaal", kleur: "var(--lichtblauw)" },
  { grootte: "normaal", kleur: "var(--roze)" },
];
// Met weinig voorbeelden past het patroon niet: dan allemaal breed, naast elkaar.
const weinigKleuren = ["var(--roze)", "var(--lichtblauw)", "var(--geel)"];


export default function VoorbeeldenPage() {
  return <MetOpties>{(opties) => <VoorbeeldenInhoud opties={opties} />}</MetOpties>;
}

async function VoorbeeldenInhoud({ opties }: { opties: FetchOpties }) {
  const [voorbeelden, p] = await Promise.all([getVoorbeelden(opties), getPagina("voorbeeldenPagina", opties)]);
  const items = voorbeelden.length ? voorbeelden : [fallback];

  return (
    <>
      <SiteHeader current="/voorbeelden" />
      <main>
        <section className={x.pageHero}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <p className={s.tag}>{p.label}</p>
            <h1 className={`${s.display} ${s.h1}`}>{p.kop}</h1>
            <p className={s.lead}>{p.intro}</p>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <div className={s.stack} style={{ gap: 12 }}>
              <h2 className={`${s.display} ${s.h2}`}>{voorbeelden.length ? p.galerijKop : "Zo ziet een kleurplaat eruit"}</h2>
              <p className={s.body}>{p.galerijHint}</p>
            </div>
            <div className={v.bento}>
              {items.map((item, i) => (
                <VoorbeeldTegel
                  key={item._id}
                  foto={item.foto}
                  kleurplaat={item.kleurplaat}
                  fotoGroot={item.fotoGroot}
                  kleurplaatGroot={item.kleurplaatGroot}
                  grootte={item.grootte ?? (items.length < 4 ? "breed" : patroon[i % patroon.length].grootte)}
                  achtergrond={items.length < 4 ? weinigKleuren[i % weinigKleuren.length] : patroon[i % patroon.length].kleur}
                />
              ))}
            </div>
          </div>
        </section>

        <section className={s.section} style={{ background: "var(--lichtblauw)" }}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <div className={s.stack} style={{ gap: 12, maxWidth: 640 }}>
              <p className={s.tag}>{p.coverLabel}</p>
              <h2 className={`${s.display} ${s.h2}`}>{p.coverKop}</h2>
              <p className={s.body}>{p.coverTekst}</p>
            </div>
            <div className={s.covers}>
              {p.covers.map((c) => (
                <Image key={c.src} src={c.src} alt={c.alt} width={1000} height={1250} sizes="(max-width: 700px) 100vw, 240px" className={s.frame} />
              ))}
            </div>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <h2 className={`${s.display} ${s.h2}`}>{p.minderKop}</h2>
            <p className={s.body}>{p.minderTekst}</p>
            <div className={s.buttons}>
              <CheckoutButton {...knopStijl(p.knop)}>{p.knop.tekst}</CheckoutButton>
              <Link href="/hoe-het-werkt#fototips" {...knopStijl(p.fototipsKnop)}>{p.fototipsKnop.tekst}</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
