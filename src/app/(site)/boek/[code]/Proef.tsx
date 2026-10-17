"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { binnenKleur as zoekBinnenKleur, boek, kleurKeuzeAan } from "@/config";
import s from "../../page.module.css";
import b from "./boek.module.css";
import { TekstVeld } from "./Boekbouwer";
import { BinnenKleurKiezer } from "./BinnenKleur";

type Pagina = {
  id: string;
  verhaal: string;
  opmerking: string;
  tekenplaat: string | null;
};

export function Proef({
  code,
  titel,
  kleur,
  binnenKleur,
  inleiding,
  nawoord,
  paginas: begin,
}: {
  code: string;
  titel: string;
  kleur: { achtergrond: string; tekst: string };
  binnenKleur: string;
  inleiding: string;
  nawoord: string;
  paginas: Pagina[];
}) {
  const router = useRouter();
  const [paginas, setPaginas] = useState(begin);
  const [inl, setInl] = useState(inleiding);
  const [naw, setNaw] = useState(nawoord);
  const [binnen, setBinnen] = useState(binnenKleur);
  const binnenStijl = (() => {
    const k = zoekBinnenKleur(binnen);
    return {
      background: `var(--${k.value})`,
      color: `var(--${k.tekst})`,
    } as React.CSSProperties;
  })();

  async function kiesBinnenKleur(k: string) {
    const vorige = binnen;
    setBinnen(k);
    try {
      await stuur({ actie: "proefBinnenKleur", binnenKleur: k });
      setFout(null);
    } catch (e) {
      setBinnen(vorige);
      setFout(e instanceof Error ? e.message : "Kleur niet bewaard.");
    }
  }
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

  // Bewaart 900 ms na de laatste wijziging, of direct bij het verlaten van het veld.
  function bewaar(
    sleutel: string,
    body: Record<string, unknown>,
    direct = false,
  ) {
    clearTimeout(timers.current[sleutel]);
    const doe = () => {
      delete timers.current[sleutel];
      return stuur(body)
        .then(() => setFout(null))
        .catch((e) =>
          setFout(e instanceof Error ? e.message : "Niet bewaard."),
        );
    };
    if (direct) return doe();
    timers.current[sleutel] = setTimeout(doe, 900);
  }

  const bewaarOpmerking = (id: string, tekst: string, direct = false) =>
    bewaar(`opm-${id}`, { actie: "opmerking", pageId: id, tekst }, direct);
  // Teksten: TekstVeld bewaart zelf (na typen en bij verlaten van het veld).
  const bewaarTekst =
    (soort: "inleiding" | "nawoord") => (tekst: string, eigen?: string) =>
      stuur({
        actie: "proefTekst",
        soort,
        tekst,
        ...(eigen !== undefined ? { eigen } : {}),
      }).catch((e) => {
        setFout(e instanceof Error ? e.message : "Niet bewaard.");
        throw e;
      });
  const bewaarVerhaal = (id: string) => (tekst: string, eigen?: string) =>
    stuur({
      actie: "proefVerhaal",
      pageId: id,
      tekst,
      ...(eigen !== undefined ? { eigen } : {}),
    }).catch((e) => {
      setFout(e instanceof Error ? e.message : "Niet bewaard.");
      throw e;
    });

  const verrijk = useCallback(
    async (soort: "verhaal" | "inleiding" | "nawoord", tekst: string) => {
      const res = await fetch(`/api/boek/${code}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actie: "verrijk", soort, tekst }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        voorstel?: string;
        fout?: string;
      };
      if (!res.ok || typeof data.voorstel !== "string")
        throw new Error(data.fout ?? "Tante kon nu even geen voorstel maken.");
      return data.voorstel;
    },
    [code],
  );

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
      // Openstaande wijzigingen eerst bewaren.
      // (Teksten zijn al bewaard bij het verlaten van het veld.)
      await Promise.all(
        paginas.map((p) =>
          timers.current[`opm-${p.id}`]
            ? bewaarOpmerking(p.id, p.opmerking, true)
            : null,
        ),
      );
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
        <h1 className={`${s.display} ${s.h2}`}>
          Kijk eens wat Tante heeft getekend!
        </h1>
        <p className={s.lead}>
          Zo komt je boek eruit te zien. Je teksten kun je hier zelf nog
          aanpassen. Wil je iets anders aan een kleurplaat, zet dan een
          opmerking bij die pagina en stuur je opmerkingen naar Tante. Klopt
          alles? Geef dan akkoord.
        </p>
      </header>

      <section className={b.blok}>
        <div className={b.coverRij}>
          <div className={b.coverVelden}>
            <h2 className={`${s.display} ${s.h3}`}>
              {kleurKeuzeAan ? "Cover, kleuren en inleiding" : "Cover en inleiding"}
            </h2>
            {kleurKeuzeAan && <BinnenKleurKiezer waarde={binnen} onKies={kiesBinnenKleur} naam="proef-binnenkleur" />}
            <div className={b.linksGekleurd} style={binnenStijl}>
              <TekstVeld
                id="proef-inleiding"
                label="Inleiding"
                placeholder="Geen inleiding (mag leeg blijven)."
                waarde={inl}
                max={boek.maxInleiding}
                rijen={5}
                soort="inleiding"
                onWijzig={setInl}
                bewaar={bewaarTekst("inleiding")}
                verrijk={verrijk}
              />
            </div>
          </div>
          <div
            className={b.coverVoorbeeld}
            style={{
              background: `var(--${kleur.achtergrond})`,
              color: `var(--${kleur.tekst})`,
            }}
          >
            <span className={s.display}>{titel}</span>
          </div>
        </div>
      </section>

      <ol className={b.paginas}>
        {paginas.map((p, i) => (
          <li key={p.id} className={`${b.spread} ${b.blok}`}>
            <span className={b.paginaNr}>Pagina {i + 1}</span>
            <div className={b.spreadInhoud}>
              <div
                className={`${b.links} ${b.linksGekleurd}`}
                style={binnenStijl}
              >
                <TekstVeld
                  id={`verhaal-${p.id}`}
                  label="Verhaaltje (links)"
                  placeholder="Geen verhaaltje (mag leeg blijven)."
                  waarde={p.verhaal}
                  max={boek.maxVerhaal}
                  rijen={5}
                  soort="verhaal"
                  onWijzig={(t) =>
                    setPaginas((ps) =>
                      ps.map((x) => (x.id === p.id ? { ...x, verhaal: t } : x)),
                    )
                  }
                  bewaar={bewaarVerhaal(p.id)}
                  verrijk={verrijk}
                />
              </div>
              <div className={b.rechts}>
                <div className={b.plaatVak}>
                  {p.tekenplaat ? (
                    // eslint-disable-next-line @next/next/no-img-element -- tijdelijke, privé-link
                    <img
                      src={p.tekenplaat}
                      alt={`Kleurplaat pagina ${i + 1}`}
                      className={b.foto}
                    />
                  ) : (
                    <span className={b.hulp}>Kleurplaat ontbreekt</span>
                  )}
                </div>
              </div>
            </div>
            <div className={b.veld}>
              <label htmlFor={`opm-${p.id}`} className={b.label}>
                Opmerking over de kleurplaat (optioneel)
              </label>
              <textarea
                id={`opm-${p.id}`}
                className={b.invoer}
                rows={2}
                maxLength={1000}
                placeholder="Bijvoorbeeld: opa's bril mag erbij, of de hond lijkt niet goed."
                value={p.opmerking}
                onChange={(e) => {
                  const t = e.target.value;
                  setPaginas((ps) =>
                    ps.map((x) => (x.id === p.id ? { ...x, opmerking: t } : x)),
                  );
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
        <div className={b.linksGekleurd} style={binnenStijl}>
          <TekstVeld
            id="proef-nawoord"
            label="Nawoord"
            placeholder="Geen nawoord (mag leeg blijven)."
            waarde={naw}
            max={boek.maxNawoord}
            rijen={4}
            soort="nawoord"
            onWijzig={setNaw}
            bewaar={bewaarTekst("nawoord")}
            verrijk={verrijk}
          />
        </div>
      </section>

      <section className={b.blok}>
        <h2 className={`${s.display} ${s.h3}`}>Wat vind je ervan?</h2>
        {fout && (
          <p className={b.fout} role="alert">
            {fout}
          </p>
        )}
        <div className={b.knoppenRij}>
          <button
            type="button"
            className={b.indienKnop}
            onClick={() => rond("akkoord")}
            disabled={bezig || aantalOpmerkingen > 0}
          >
            Akkoord, laat maar drukken!
          </button>
          <button
            type="button"
            className={b.knopLeeg}
            onClick={() => rond("opmerkingenSturen")}
            disabled={bezig || aantalOpmerkingen === 0}
          >
            Stuur mijn opmerkingen ({aantalOpmerkingen})
          </button>
        </div>
        {aantalOpmerkingen > 0 && (
          <p className={b.hulp}>
            Je hebt opmerkingen over de kleurplaten gezet. Stuur ze naar Tante,
            of haal ze weg als je toch akkoord wilt geven. Je tekstwijzigingen
            zijn al bewaard.
          </p>
        )}
      </section>
    </div>
  );
}
