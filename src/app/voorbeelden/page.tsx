import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getVoorbeelden } from "@/sanity/content";
import { CheckoutButton } from "../CheckoutButton";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import s from "../page.module.css";
import x from "@/components/site.module.css";

export const metadata: Metadata = {
  title: "Voorbeelden: van foto naar kleurplaat – Tante Kleur",
  description: "Bekijk hoe gewone telefoonfoto's veranderen in kleurplaten, en hoe het boek eruitziet met je eigen titel op de cover.",
};

const fallback = {
  _id: "berlijn",
  foto: { url: "/brand/foto-berlijn.jpg", alt: "Selfie van twee vriendinnen op een treinperron in Berlijn" },
  kleurplaat: { url: "/brand/kleurplaat-berlijn.jpg", alt: "Kleurplaat van twee vriendinnen op een treinstation in Berlijn" },
};

const covers = [
  { src: "/brand/henk-blue.jpg", alt: "Blauw kleurboek met de titel Henk & Ingrid" },
  { src: "/brand/spanje-desk.jpg", alt: "Lichtblauw kleurboek Spanje 2025 op een houten tafel" },
  { src: "/brand/berlijn-hold.jpg", alt: "Roze kleurboek Weekend Berlijn met een lijntekening op de cover" },
  { src: "/brand/henk-orange.jpg", alt: "Oranje kleurboek Henk & Ingrid tussen kleurpotloden" },
  { src: "/brand/spanje-yellow.jpg", alt: "Geel kleurboek Spanje 2025 onder de arm" },
];

export default async function VoorbeeldenPage() {
  const voorbeelden = await getVoorbeelden();
  const items = voorbeelden.length ? voorbeelden : [fallback];

  return (
    <>
      <SiteHeader current="/voorbeelden" />
      <main>
        <section className={x.pageHero}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <p className={s.tag}>Voorbeelden</p>
            <h1 className={`${s.display} ${s.h1}`}>Van camerarol naar kleurplaat.</h1>
            <p className={s.lead}>Alles hieronder is gemaakt van gewone foto&apos;s, zoals ze op je telefoon staan.</p>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <h2 className={`${s.display} ${s.h2}`}>De foto en de kleurplaat</h2>
            <div className={x.gallery}>
              {items.map((v) => (
                <div key={v._id} className={x.pair}>
                  <div className={s.stack} style={{ gap: 8 }}>
                    <Image src={v.foto.url} alt={v.foto.alt} width={800} height={1000} sizes="(max-width: 700px) 50vw, 300px" className={s.frame} />
                    <p className={s.wide}>De foto</p>
                  </div>
                  <div className={s.stack} style={{ gap: 8 }}>
                    <Image src={v.kleurplaat.url} alt={v.kleurplaat.alt} width={800} height={1000} sizes="(max-width: 700px) 50vw, 300px" className={s.frame} />
                    <p className={s.wide}>De kleurplaat</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={s.section} style={{ background: "var(--lichtblauw)" }}>
          <div className={`${s.wrap} ${s.stack}`} style={{ gap: 40 }}>
            <div className={s.stack} style={{ gap: 12, maxWidth: 640 }}>
              <p className={s.tag}>Het boek</p>
              <h2 className={`${s.display} ${s.h2}`}>Jouw titel, jouw kleur.</h2>
              <p className={s.body}>Henk &amp; Ingrid, Spanje 2025, Weekend Berlijn: elk boek krijgt een eigen titel op een stevige hardcover.</p>
            </div>
            <div className={s.covers}>
              {covers.map((c) => (
                <Image key={c.src} src={c.src} alt={c.alt} width={1000} height={1250} sizes="(max-width: 700px) 100vw, 240px" className={s.frame} />
              ))}
            </div>
          </div>
        </section>

        <section className={s.section}>
          <div className={`${s.narrow} ${s.stack}`} style={{ gap: 20 }}>
            <h2 className={`${s.display} ${s.h2}`}>Wat minder goed werkt</h2>
            <p className={s.body}>
              Grote groepsfoto&apos;s, donkere foto&apos;s en tekst die in beeld staat (op een shirt of bord) maken het
              lastiger. Tante legt uit welke foto&apos;s het mooist uitpakken.
            </p>
            <div className={s.buttons}>
              <CheckoutButton className={s.btn} />
              <Link href="/hoe-het-werkt#fototips" className={s.btnGhost}>Bekijk de fototips</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
