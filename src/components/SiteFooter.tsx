import Image from "next/image";
import Link from "next/link";
import { site } from "@/config";
import { CheckoutButton } from "@/app/CheckoutButton";
import s from "@/app/page.module.css";
import x from "./site.module.css";

const columns = [
  {
    head: "Ontdek",
    links: [
      { href: "/voorbeelden", label: "Voorbeelden" },
      { href: "/hoe-het-werkt", label: "Zo werkt het" },
      { href: "/prijzen", label: "Prijs" },
      { href: "/sinterklaas-en-kerst", label: "Sinterklaas & kerst" },
      { href: "/zakelijk", label: "Zakelijk" },
    ],
  },
  {
    head: "Klantenservice",
    links: [
      { href: "/vragen", label: "Veelgestelde vragen" },
      { href: "/over-ons", label: "Over ons & contact" },
      { href: "/prijzen#verzending", label: "Verzending en levertijd" },
    ],
  },
  {
    head: "Juridisch",
    links: [
      { href: "/voorwaarden", label: "Algemene voorwaarden" },
      { href: "/privacy", label: "Privacy en cookies" },
    ],
  },
];

export function SiteFooter() {
  const { company, email } = site;
  return (
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
        <div className={x.footerCols}>
          {columns.map((col) => (
            <div key={col.head}>
              <p className={x.footerHead}>{col.head}</p>
              <ul>
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className={x.footerHead}>Contact</p>
            <ul>
              <li>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
              <li>Veilig betalen via Stripe</li>
            </ul>
          </div>
        </div>
        <div className={s.footerBottom}>
          <span>© 2026 Tante Kleur, een handelsnaam van {company.legalName} · KvK {company.kvk} · btw {company.vat}</span>
          <div className={s.footerLinks}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/voorwaarden">Voorwaarden</Link>
            <Link href="/over-ons">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
