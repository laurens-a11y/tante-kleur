"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { tagManagerOpPad } from "@/config";
import { TOESTEMMING_SLEUTEL } from "./TagManager";
import c from "./cookie.module.css";

const OPEN_EVENT = "tk-cookie-instellingen";
const KEUZE_EVENT = "tk-cookie-keuze";

function abonneer(melding: () => void) {
  window.addEventListener(KEUZE_EVENT, melding);
  window.addEventListener("storage", melding);
  return () => {
    window.removeEventListener(KEUZE_EVENT, melding);
    window.removeEventListener("storage", melding);
  };
}

type Keuze = "ja" | "nee";

// Als localStorage niet werkt (sommige privévensters): keuze alleen voor dit bezoek.
let geheugen: Keuze | null = null;

function leesKeuze(): Keuze | null {
  try {
    const k = localStorage.getItem(TOESTEMMING_SLEUTEL);
    return k === "ja" || k === "nee" ? k : geheugen;
  } catch {
    return geheugen;
  }
}

function zetToestemming(keuze: Keuze) {
  geheugen = keuze;
  try {
    localStorage.setItem(TOESTEMMING_SLEUTEL, keuze);
  } catch {
    // privévenster: keuze geldt alleen voor dit bezoek
  }
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  const stand = keuze === "ja" ? "granted" : "denied";
  // Zelfde vorm als gtag(): de argumenten-lijst gaat de dataLayer in.
  (function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  })("consent", "update", { ad_storage: stand, analytics_storage: stand, ad_user_data: stand, ad_personalization: stand });
  w.dataLayer.push({ event: "cookie_keuze", cookie_keuze: keuze });
  window.dispatchEvent(new Event(KEUZE_EVENT));
}

/** Cookiemelding onderaan de pagina, tot de bezoeker een keuze maakt. */
export function CookieMelding() {
  const pad = usePathname();
  // Op de server (en tot het laden) geen melding; daarna alleen zonder eerdere keuze.
  const keuze = useSyncExternalStore(abonneer, () => leesKeuze() ?? "geen", () => "ja");
  const [heropend, setHeropend] = useState(false);

  useEffect(() => {
    const heropen = () => setHeropend(true);
    window.addEventListener(OPEN_EVENT, heropen);
    return () => window.removeEventListener(OPEN_EVENT, heropen);
  }, []);

  if ((keuze !== "geen" && !heropend) || !tagManagerOpPad(pad)) return null;

  const kies = (k: Keuze) => {
    zetToestemming(k);
    setHeropend(false);
  };

  return (
    <div className={c.melding} role="dialog" aria-live="polite" aria-label="Cookies">
      <p className={c.tekst}>
        Tante gebruikt cookies om te zien hoe de site wordt gebruikt en om advertenties te meten. Mag dat? Lees meer in onze{" "}
        <Link href="/privacy">privacyverklaring</Link>.
      </p>
      <div className={c.knoppen}>
        <button type="button" className={c.weiger} onClick={() => kies("nee")}>
          Alleen noodzakelijk
        </button>
        <button type="button" className={c.akkoord} onClick={() => kies("ja")}>
          Accepteren
        </button>
      </div>
    </div>
  );
}

/** Link in de footer om de cookiekeuze te wijzigen. */
export function CookieInstellingenKnop({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      Cookie-instellingen
    </button>
  );
}
