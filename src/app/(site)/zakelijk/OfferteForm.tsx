"use client";

import { useState } from "react";
import s from "../page.module.css";
import x from "@/components/site.module.css";

// Offerteformulier zonder backend: stelt een e-mail op met de ingevulde gegevens.
export function OfferteForm({ email, knop }: { email: string; knop: { tekst: string; className: string; style: React.CSSProperties } }) {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) || "").trim();
    const body = [
      `Bedrijf: ${get("bedrijf")}`,
      `Naam: ${get("naam")}`,
      `E-mail: ${get("email")}`,
      `Telefoon: ${get("telefoon")}`,
      `Aantal boeken: ${get("aantal")}`,
      `Gewenste leverdatum: ${get("datum")}`,
      `Gelegenheid: ${get("gelegenheid")}`,
      "",
      get("toelichting"),
    ].join("\n");
    const subject = `Offerteaanvraag kleurboeken – ${get("bedrijf") || get("naam")}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form className={x.form} onSubmit={onSubmit}>
      <label className={x.field}>
        Bedrijf
        <input name="bedrijf" required autoComplete="organization" />
      </label>
      <label className={x.field}>
        Naam
        <input name="naam" required autoComplete="name" />
      </label>
      <label className={x.field}>
        E-mail
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label className={x.field}>
        Telefoon (optioneel)
        <input name="telefoon" type="tel" autoComplete="tel" />
      </label>
      <label className={x.field}>
        Aantal boeken
        <input name="aantal" type="number" min={1} required />
      </label>
      <label className={x.field}>
        Gewenste leverdatum
        <input name="datum" type="date" />
      </label>
      <label className={`${x.field} ${x.fieldWide}`}>
        Gelegenheid
        <select name="gelegenheid" defaultValue="Eindejaarsgeschenk">
          <option>Eindejaarsgeschenk</option>
          <option>Jubileum</option>
          <option>Afscheid</option>
          <option>Relatiegeschenk</option>
          <option>Iets anders</option>
        </select>
      </label>
      <label className={`${x.field} ${x.fieldWide}`}>
        Vertel kort wat je in gedachten hebt
        <textarea name="toelichting" />
      </label>
      <div className={x.fieldWide}>
        <button type="submit" className={knop.className} style={knop.style}>{knop.tekst}</button>
        {sent && (
          <p className={s.body} role="status" style={{ marginTop: 12 }}>
            Je mailprogramma opent met je aanvraag. Opent er niets? Mail dan naar <a href={`mailto:${email}`}>{email}</a>.
          </p>
        )}
      </div>
    </form>
  );
}
