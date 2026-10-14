"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import s from "../../page.module.css";
import b from "./boek.module.css";

type Pagina = { id: string; verhaal: string; opmerking: string; tekenplaat: string | null };

export function Proef({
  code,
  titel,
  kleur,
  inleiding,
  nawoord,
  paginas: begin,
}: {
  code: string;
  titel: string;
  kleur: { achtergrond: string; tekst: string };
  inleiding: string;
  nawoord: string;
  paginas: Pagina[];
}) {
  const router = useRouter();
  const [paginas, setPaginas] = useState(begin);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  async function stuur(body: Record<string, unknown>) {
    const res = await fetch(`/api/boek/${code}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { fout?: string };
    if (!res.ok) throw new Error(data.fout ?? "Er ging iets mis.");
    return data;
  }

  function bewaarOpmerking(id: string, tekst: string, direct = false) {
    clearTimeout(timers.current[id]);
    const doe = () =>
      stuur({ actie: "opmerking", pageId: id, tekst })
        .then(() => setFout(null))
        .catch((e) => setFout(e instanceof Error ? e.message : "Opmerking niet bewaard."));
    if (direct) return doe();
    timers.current[id] = setTimeout(doe, 900);
  }

  const aantalOpmerkingen = paginas.filter((p) => p.opmerking.trim()).length;

  async function rond(actie: "akkoord" | "opmerkingenSturen") {
    const vraag =
      actie === "akkoord"
        ? "Akkoord geven? Daarna gaat je boek naar de drukker en kun je niets meer wijzigen."
        : `Je ${aantalOpmerkingen} opmerking(en) naar Tante sturen? Je krijgt daarna een nieuwe proef.`;
    if (!window.confirm(vraag)) return;
    setBezig(true);
    setFout(null);
    try {
      // Openstaande opmerkingen eerst bewaren.
      await Promise.all(paginas.map((p) => (timers.current[p.id] ? bewaarOpmerking(p.id, p.opmerking, true) : null)));
      await stuur({ actie });
      router.refresh();
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Er ging iets mis.");
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className={b.bouwer}>
      <header className={b.intro}>
        <p className={s.tag}>Jouw proef</p>
        <h1 className={`${s.display} ${s.h2}`}>Kijk eens wat Tante heeft getekend!</h1>
        <p className={s.lead}>
          Zo komt je boek eruit te zien. Klopt alles? Geef dan akkoord. Wil je iets anders, zet dan een opmerking bij de
          pagina en stuur je opmerkingen naar Tante.
        </p>
      </header>

      <section className={b.blok}>
        <div className={b.coverRij}>
          <div className={b.coverVelden}>
            <h2 className={`${s.display} ${s.h3}`}>Cover en inleiding</h2>
            <p className={`${s.body} ${b.voorstelTekst}`}>{inleiding || "Geen inleiding."}</p>
          </div>
          <div className={b.coverVoorbeeld} style={{ background: `var(--${kleur.achtergrond})`, color: `var(--${kleur.tekst})` }}>
            <span className={s.display}>{titel}</span>
          </div>
        </div>
      </section>

      <ol className={b.paginas}>
        {paginas.map((p, i) => (
          <li key={p.id} className={`${b.spread} ${b.blok}`}>
            <span className={b.paginaNr}>Pagina {i + 1}</span>
            <div className={b.spreadInhoud}>
              <div className={b.links}>
                <p className={`${s.body} ${b.voorstelTekst}`}>{p.verhaal || <em>Geen verhaaltje</em>}</p>
              </div>
              <div className={b.rechts}>
                <div className={b.plaatVak}>
                  {p.tekenplaat ? (
                    // eslint-disable-next-line @next/next/no-img-element -- tijdelijke, privé-link
                    <img src={p.tekenplaat} alt={`Kleurplaat pagina ${i + 1}`} className={b.foto} />
                  ) : (
                    <span className={b.hulp}>Kleurplaat ontbreekt</span>
                  )}
                </div>
              </div>
            </div>
            <div className={b.veld}>
              <label htmlFor={`opm-${p.id}`} className={b.label}>
                Opmerking bij deze pagina (optioneel)
              </label>
              <textarea
                id={`opm-${p.id}`}
                className={b.invoer}
                rows={2}
                maxLength={1000}
                placeholder="Bijvoorbeeld: opa's bril mag erbij, of de tekst moet ‘Zeeland’ zijn."
                value={p.opmerking}
                onChange={(e) => {
                  const t = e.target.value;
                  setPaginas((ps) => ps.map((x) => (x.id === p.id ? { ...x, opmerking: t } : x)));
                  bewaarOpmerking(p.id, t);
                }}
                onBlur={(e) => bewaarOpmerking(p.id, e.target.value, true)}
              />
            </div>
          </li>
        ))}
      </ol>

      <section className={b.blok}>
        <h2 className={`${s.display} ${s.h3}`}>Nawoord</h2>
        <p className={`${s.body} ${b.voorstelTekst}`}>{nawoord || "Geen nawoord."}</p>
      </section>

      <section className={b.blok}>
        <h2 className={`${s.display} ${s.h3}`}>Wat vind je ervan?</h2>
        {fout && (
          <p className={b.fout} role="alert">
            {fout}
          </p>
        )}
        <div className={b.knoppenRij}>
          <button type="button" className={b.indienKnop} onClick={() => rond("akkoord")} disabled={bezig || aantalOpmerkingen > 0}>
            Akkoord, laat maar drukken!
          </button>
          <button type="button" className={b.knopLeeg} onClick={() => rond("opmerkingenSturen")} disabled={bezig || aantalOpmerkingen === 0}>
            Stuur mijn opmerkingen ({aantalOpmerkingen})
          </button>
        </div>
        {aantalOpmerkingen > 0 && (
          <p className={b.hulp}>Je hebt opmerkingen gezet. Stuur ze naar Tante, of haal ze weg als je toch akkoord wilt geven.</p>
        )}
      </section>
    </div>
  );
}
