import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPagina, getVoorbeelden, getMetadata, type Voorbeeld } from "@/sanity/content";
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
};

// Vier tegelkleuren: in een grid van 3 of 2 kolommen grenst een tegel zo nooit
// aan dezelfde kleur, naast of onder zich.
const tegelKleuren = ["var(--roze)", "var(--lichtblauw)", "var(--geel)", "var(--rood)"];


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
            <div className={v.grid}>
              {items.map((item, i) => (
                <VoorbeeldTegel
                  key={item._id}
                  foto={item.foto}
                  kleurplaat={item.kleurplaat}
                  fotoGroot={item.fotoGroot}
                  kleurplaatGroot={item.kleurplaatGroot}
                  achtergrond={tegelKleuren[i % tegelKleuren.length]}
                  index={i}
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
