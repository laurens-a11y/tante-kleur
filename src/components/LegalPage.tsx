import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import s from "@/app/page.module.css";
import x from "./site.module.css";

// Juridische tekst, gegenereerd uit Markdown door scripts/juridisch.sh (eigen, vertrouwde inhoud).
export function LegalPage({ title, html }: { title: string; html: string }) {
  return (
    <>
      <SiteHeader />
      <main>
        <section className={x.pageHero}>
          <div className={s.narrow}>
            <h1 className={`${s.display} ${s.h2}`}>{title}</h1>
          </div>
        </section>
        <section className={s.section}>
          <div className={`${s.narrow} ${x.prose}`} dangerouslySetInnerHTML={{ __html: html }} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
