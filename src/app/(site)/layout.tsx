import type { Metadata } from "next";
import { Archivo, Fraunces } from "next/font/google";
import "./globals.css";
import { site } from "@/config";
import { getInstellingen } from "@/sanity/content";
import { JsonLd } from "@/components/JsonLd";
import { organisatie } from "@/lib/gestructureerde-data";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { SanityLive } from "@/sanity/live";
import { DraftModeKnop } from "@/components/DraftModeKnop";
import { Suspense } from "react";
import { TagManager } from "@/components/TagManager";
import { CookieMelding } from "@/components/CookieMelding";

// Tijdelijke vervangers voor de merkfonts (Swear Display + Widescreen).
// Zodra de webfontlicenties er zijn: vervangen door next/font/local.
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz"],
});

const sans = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  // Basis voor canonical- en Open Graph-links; ook op *.vercel.app wijst alles naar het echte domein.
  metadataBase: new URL(site.url),
  applicationName: site.name,
  title: "Tante Kleur – Gepersonaliseerde kleurboeken van je eigen foto's",
  description:
    "Tante Kleur tovert je mooiste foto's om tot kleurplaten, in een stevig hardcover kleurboek met je eigen titel. Voor jezelf of als cadeau.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [instellingen, { isEnabled: isDraftMode }] = await Promise.all([getInstellingen(), draftMode()]);
  return (
    <html lang="nl" className={`${display.variable} ${sans.variable}`}>
      <body>
        {/* Pad pas bekend na het laden: in Suspense, zodat de rest gewoon vooraf gerenderd wordt. */}
        <Suspense fallback={null}>
          <TagManager />
        </Suspense>
        <JsonLd data={organisatie({ omschrijving: instellingen.merkOmschrijving, socialeMedia: instellingen.socialeMedia })} />
        {children}
        <Suspense fallback={null}>
          <CookieMelding />
        </Suspense>
        {/* Live: gepubliceerde wijzigingen direct op de site; in draft mode ook concepten. */}
        <SanityLive includeDrafts={isDraftMode} />
        {isDraftMode && (
          <>
            <VisualEditing />
            <DraftModeKnop />
          </>
        )}
      </body>
    </html>
  );
}
