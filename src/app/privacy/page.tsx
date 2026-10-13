import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import html from "@/content/juridisch/privacy.html";

export const metadata: Metadata = {
  title: "Privacyverklaring – Tante Kleur",
  description: "Hoe Tante Kleur omgaat met je persoonsgegevens en je foto's.",
};

export default function PrivacyPage() {
  return <LegalPage title="Privacyverklaring" html={html} />;
}
