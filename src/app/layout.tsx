import type { Metadata } from "next";
import { Archivo, Fraunces } from "next/font/google";
import "./globals.css";

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
  title: "Tante Kleur – Gepersonaliseerde kleurboeken van je eigen foto's",
  description:
    "Tante Kleur tovert je mooiste foto's om tot kleurplaten, in een stevig hardcover kleurboek met je eigen titel. Voor jezelf of als cadeau.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
