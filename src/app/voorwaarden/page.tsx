import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import html from "@/content/juridisch/voorwaarden.html";

export const metadata: Metadata = {
  title: "Algemene voorwaarden – Tante Kleur",
  description: "De algemene voorwaarden van Tante Kleur, een handelsnaam van LaunchLab VOF.",
};

export default function VoorwaardenPage() {
  return <LegalPage title="Algemene voorwaarden" html={html} />;
}
