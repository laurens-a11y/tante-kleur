import Image from "next/image";
import Link from "next/link";
import { site } from "@/config";
import { CheckoutButton } from "@/app/(site)/CheckoutButton";
import s from "@/app/(site)/page.module.css";
import x from "./site.module.css";
import { Icon } from "@/components/Icon";

export const navItems = [
  { href: "/voorbeelden", label: "Voorbeelden" },
  { href: "/hoe-het-werkt", label: "Zo werkt het" },
  { href: "/prijzen", label: "Prijs" },
  { href: "/zakelijk", label: "Zakelijk" },
  { href: "/vragen", label: "Vragen" },
];

export function SiteHeader({ current }: { current?: string }) {
  const first = site.deadlines[0];
  return (
    <>
      <div className={s.announce}>
        Introductieprijs: jouw kleurboek voor €{site.price.intro}, straks €{site.price.regular}.{" "}
        <Link href="/sinterklaas-en-kerst">
          Voor {first.feest}? Bestel uiterlijk {first.datum}.
        </Link>
      </div>
      <header className={s.header}>
        <nav className={s.nav} aria-label="Hoofdmenu">
          <Link href="/" aria-label="Tante Kleur, naar de homepage">
            <Image src="/brand/mark-color.png" alt="Tante Kleur" width={118} height={52} priority />
          </Link>
          <div className={s.navLinks}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={current === item.href ? x.navActive : undefined}
                aria-current={current === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className={x.desktopCta}>
            <CheckoutButton className={`${s.btn} ${s.btnSmall}`} />
          </div>
          <details className={x.mobileMenu}>
            <summary aria-label="Menu"><Icon name="menu" size={26} /></summary>
            <div className={x.mobilePanel}>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/sinterklaas-en-kerst">Sinterklaas &amp; kerst</Link>
              <Link href="/over-ons">Over ons &amp; contact</Link>
              <div style={{ padding: "12px 20px 4px" }}>
                <CheckoutButton className={`${s.btn} ${s.btnSmall}`} />
              </div>
            </div>
          </details>
        </nav>
      </header>
    </>
  );
}
