import "server-only";
import { Resend } from "resend";
import { site } from "@/config";

let client: Resend | null = null;

function getResend() {
  if (!client) {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) throw new Error("RESEND_API_KEY ontbreekt");
    client = new Resend(key);
  }
  return client;
}

// Afzender moet op het in Resend geverifieerde domein staan (mail.tantekleur.nl).
// Antwoorden van klanten gaan naar het gewone adres.
const afzender = process.env.RESEND_FROM?.trim() || "Tante Kleur <tante@mail.tantekleur.nl>";
// Wie een melding krijgt als een klant zijn boek indient.
const beheer = process.env.BEHEER_EMAIL || site.email;

function escape(tekst: string) {
  return tekst.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Eenvoudige, overal leesbare mail in de huisstijl.
function opmaak({ titel, alineas, knop }: { titel: string; alineas: string[]; knop?: { tekst: string; url: string } }) {
  const tekstHtml = alineas.map((a) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.55">${escape(a)}</p>`).join("");
  const knopHtml = knop
    ? `<p style="margin:24px 0"><a href="${escape(knop.url)}" style="display:inline-block;background:#002cd4;color:#ffffff;padding:14px 24px;border-radius:4px;text-decoration:none;font-weight:600">${escape(knop.tekst)}</a></p>
       <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#4a5ba8">Werkt de knop niet? Kopieer dan deze link: ${escape(knop.url)}</p>`
    : "";
  const html = `<!doctype html><html lang="nl"><body style="margin:0;background:#f4b3c1;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#002cd4">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px">
    <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:26px">${escape(titel)}</h1>
    ${tekstHtml}${knopHtml}
    <p style="margin:24px 0 0;font-size:16px">Liefs,<br>Tante Kleur</p>
  </div></body></html>`;
  const text = [titel, "", ...alineas, ...(knop ? ["", `${knop.tekst}: ${knop.url}`] : []), "", "Liefs,", "Tante Kleur"].join("\n");
  return { html, text };
}

async function verstuur(aan: string, onderwerp: string, inhoud: { html: string; text: string }) {
  const { error } = await getResend().emails.send({ from: afzender, to: aan, replyTo: site.email, subject: onderwerp, ...inhoud });
  if (error) throw new Error(`Resend: ${error.message}`);
}

export async function stuurBoekLink({ aan, naam, url }: { aan: string | null; naam: string | null; url: string }) {
  if (!aan) return;
  const voornaam = naam?.split(" ")[0];
  await verstuur(
    aan,
    "Je kleurboek wacht op je foto's",
    opmaak({
      titel: voornaam ? `Dankjewel, ${voornaam}!` : "Dankjewel!",
      alineas: [
        "Je betaling is binnen. Nu het leukste deel: jouw boek vullen.",
        "Via de knop hieronder kies je de titel en kleur van de cover, en upload je je foto's met bij elke foto een verhaaltje. Alles wordt meteen bewaard, dus je kunt rustig stoppen en later verder.",
        "Bewaar deze mail goed: met deze link kom je altijd terug bij je boek. Deel hem alleen met mensen die mee mogen helpen.",
      ],
      knop: { tekst: "Vul mijn boek", url },
    }),
  );
}

export async function stuurIngediend({ aan, naam, url, titel }: { aan: string | null; naam: string | null; url: string; titel: string }) {
  if (aan) {
    const voornaam = naam?.split(" ")[0];
    await verstuur(
      aan,
      "Tante gaat aan de slag met je boek",
      opmaak({
        titel: voornaam ? `Top, ${voornaam}!` : "Top!",
        alineas: [
          `We hebben alles voor "${titel}" binnen. Tante gaat nu je foto's omtoveren tot kleurplaten.`,
          "Binnen een paar dagen krijg je een mail met de digitale proef. Pas als jij akkoord geeft, gaat het boek naar de drukker.",
        ],
        knop: { tekst: "Bekijk mijn boek", url },
      }),
    );
  }
  await verstuur(
    beheer,
    `Nieuw boek ingediend: ${titel}`,
    opmaak({ titel: "Nieuw boek ingediend", alineas: [`Titel: ${titel}`, `Klant: ${naam ?? "-"} (${aan ?? "-"})`] }),
  );
}
