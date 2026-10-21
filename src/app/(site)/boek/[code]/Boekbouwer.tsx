"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { boek, geldigAantalFotos, kleurKeuzeAan, nawoordAan, teLangWoord, toegestaneAantallen } from "@/config";
import s from "../../page.module.css";
import b from "./boek.module.css";
import { bereidFotoVoor } from "./foto";
import { BinnenKleurKiezer } from "./BinnenKleur";

type Draaiing = 0 | 90 | 180 | 270;

type PaginaState = {
  id: string;
  titel: string;
  verhaal: string;
  draaiing: Draaiing;
  kleinUrl: string | null;
  // Alleen in de browser, tijdens uploaden:
  bezig?: boolean;
  fout?: string | null;
  waarschuwing?: string | null;
};

type Begin = {
  titel: string;
  kleur: string;
  binnenKleur: string;
  inleiding: string;
  nawoord: string;
  coverId: string | null;
  paginas: PaginaState[];
};

type Antwoord = Record<string, unknown> & { fout?: string };

export type Soort = "verhaal" | "titel" | "inleiding" | "nawoord";

/** "19 of 21" */
export const aantallenTekst = toegestaneAantallen.length > 1 ? `${toegestaneAantallen.slice(0, -1).join(", ")} of ${toegestaneAantallen.at(-1)}` : String(toegestaneAantallen[0]);

// ---------- Bewaren ----------

function useApi(code: string) {
  const [bezig, setBezig] = useState(0);
  const [fout, setFout] = useState<string | null>(null);

  const stuur = useCallback(
    async (body: Record<string, unknown>): Promise<Antwoord> => {
      setBezig((n) => n + 1);
      try {
        const res = await fetch(`/api/boek/${code}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as Antwoord;
        if (!res.ok) throw new Error(data.fout ?? "Er ging iets mis bij het bewaren.");
        setFout(null);
        return data;
      } catch (e) {
        const melding = e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Geen verbinding. Je wijziging is nog niet bewaard.";
        setFout(melding);
        throw new Error(melding);
      } finally {
        setBezig((n) => n - 1);
      }
    },
    [code],
  );

  return { stuur, bezig: bezig > 0, fout, setFout };
}

/** Bewaart een tekstveld 900 ms na de laatste toetsaanslag, en direct bij het verlaten van het veld. */
function useAutoBewaar(bewaar: (waarde: string) => Promise<unknown>, startwaarde: string) {
  const laatstBewaard = useRef(startwaarde);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nu = useCallback(
    (waarde: string) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      if (waarde === laatstBewaard.current) return;
      laatstBewaard.current = waarde;
      bewaar(waarde).catch(() => {
        // Bij een fout opnieuw proberen bij de volgende wijziging.
        laatstBewaard.current = "\u0000";
      });
    },
    [bewaar],
  );

  const straks = useCallback(
    (waarde: string) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => nu(waarde), 900);
    },
    [nu],
  );

  // Gemarkeerd als bewaard (bijv. na het overnemen van een AI-voorstel, dat apart wordt opgeslagen).
  const markeer = useCallback((waarde: string) => {
    if (timer.current) clearTimeout(timer.current);
    laatstBewaard.current = waarde;
  }, []);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  return { nu, straks, markeer };
}

// ---------- Tekstveld met AI-voorstel ----------

export function TekstVeld({
  id,
  label,
  hulp,
  placeholder,
  waarde,
  max,
  rijen,
  soort,
  onWijzig,
  bewaar,
  verrijk,
}: {
  id: string;
  label: string;
  hulp?: string;
  placeholder?: string;
  waarde: string;
  max: number;
  rijen: number;
  soort: Soort;
  onWijzig: (tekst: string) => void;
  bewaar: (tekst: string, eigen?: string) => Promise<unknown>;
  verrijk: (soort: Soort, tekst: string) => Promise<string>;
}) {
  const auto = useAutoBewaar(useCallback((t: string) => bewaar(t), [bewaar]), waarde);
  const [voorstel, setVoorstel] = useState<string | null>(null);
  const [denkt, setDenkt] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);

  async function vraagVoorstel() {
    setMelding(null);
    if (waarde.trim().length < 3) {
      setMelding("Schrijf eerst een paar woorden, bijvoorbeeld wie, waar en wat er gebeurde. Dan maakt Tante er iets moois van.");
      return;
    }
    setDenkt(true);
    try {
      setVoorstel(await verrijk(soort, waarde));
    } catch (e) {
      setMelding(e instanceof Error ? e.message : "Tante kon nu even geen voorstel maken.");
    } finally {
      setDenkt(false);
    }
  }

  async function neemOver() {
    if (!voorstel) return;
    const nieuw = voorstel.slice(0, max);
    const eigen = waarde;
    onWijzig(nieuw);
    auto.markeer(nieuw);
    setVoorstel(null);
    await bewaar(nieuw, eigen).catch(() => auto.markeer("\u0000"));
  }

  return (
    <div className={b.veld}>
      <label htmlFor={id} className={b.label}>
        {label}
      </label>
      {hulp && <p className={b.hulp}>{hulp}</p>}
      <textarea
        id={id}
        className={b.invoer}
        rows={rijen}
        maxLength={max}
        placeholder={placeholder}
        value={waarde}
        onChange={(e) => {
          onWijzig(e.target.value);
          auto.straks(e.target.value);
        }}
        onBlur={(e) => auto.nu(e.target.value)}
      />
      <div className={b.veldVoet}>
        <button type="button" className={b.aiKnop} onClick={vraagVoorstel} disabled={denkt}>
          {denkt ? "Tante schrijft…" : voorstel ? "Nog een voorstel" : "Verrijk met AI"}
        </button>
        <span className={b.teller} aria-live="polite">
          {waarde.length}/{max}
        </span>
      </div>
      {melding && (
        <p className={b.melding} role="status">
          {melding}
        </p>
      )}
      {voorstel && (
        <div className={b.voorstel} role="region" aria-label="Voorstel van Tante">
          <p className={b.voorstelKop}>Voorstel van Tante</p>
          <p className={b.voorstelTekst}>{voorstel}</p>
          <p className={b.hulp}>Check even of alle namen en details kloppen.</p>
          <div className={b.knoppenRij}>
            <button type="button" className={b.knopVol} onClick={neemOver}>
              Gebruik deze tekst
            </button>
            <button type="button" className={b.knopLeeg} onClick={() => setVoorstel(null)}>
              Houd mijn eigen tekst
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Titel per foto, met AI-suggestie ----------

/** Melding als een woord te lang is om groot genoeg in het boek te drukken. */
export function langWoordMelding(titel: string) {
  const lang = teLangWoord(titel);
  return lang ? `“${lang}” is te lang om groot in het boek te zetten. Gebruik woorden van maximaal ${boek.maxWoordInTitel} letters.` : null;
}

export function TitelVeld({
  id,
  waarde,
  verhaal,
  onWijzig,
  bewaar,
  verrijk,
}: {
  id: string;
  waarde: string;
  verhaal: string;
  onWijzig: (tekst: string) => void;
  bewaar: (tekst: string) => Promise<unknown>;
  verrijk: (soort: Soort, tekst: string) => Promise<string>;
}) {
  // Een titel met een te lang woord wordt niet bewaard (de server weigert die toch).
  const auto = useAutoBewaar(
    useCallback((t: string) => (teLangWoord(t) ? Promise.resolve() : bewaar(t)), [bewaar]),
    waarde,
  );
  const [voorstel, setVoorstel] = useState<string | null>(null);
  const [denkt, setDenkt] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);
  const teLang = langWoordMelding(waarde);

  async function vraagVoorstel() {
    setMelding(null);
    const bron = verhaal.trim() || waarde.trim();
    if (bron.length < 3) {
      setMelding("Schrijf eerst het verhaaltje, dan bedenkt Tante er een titel bij.");
      return;
    }
    setDenkt(true);
    try {
      setVoorstel(await verrijk("titel", bron));
    } catch (e) {
      setMelding(e instanceof Error ? e.message : "Tante kon nu even geen titel bedenken.");
    } finally {
      setDenkt(false);
    }
  }

  async function neemOver() {
    if (!voorstel) return;
    const nieuw = voorstel.slice(0, boek.maxPaginaTitel);
    onWijzig(nieuw);
    auto.markeer(nieuw);
    setVoorstel(null);
    await bewaar(nieuw).catch(() => auto.markeer("\u0000"));
  }

  return (
    <div className={b.veld}>
      <label htmlFor={id} className={b.label}>
        Titel (groot boven het verhaaltje)
      </label>
      <input
        id={id}
        className={b.invoer}
        maxLength={boek.maxPaginaTitel}
        placeholder="Bijv. ‘Opa op de sup’"
        value={waarde}
        onChange={(e) => {
          onWijzig(e.target.value);
          auto.straks(e.target.value);
        }}
        onBlur={(e) => auto.nu(e.target.value)}
        aria-invalid={!!teLang}
      />
      <div className={b.veldVoet}>
        <button type="button" className={b.aiKnop} onClick={vraagVoorstel} disabled={denkt}>
          {denkt ? "Tante denkt na…" : voorstel ? "Nog een titel" : "Bedenk een titel"}
        </button>
        <span className={b.teller} aria-live="polite">
          {waarde.length}/{boek.maxPaginaTitel}
        </span>
      </div>
      {teLang && (
        <p className={b.fout} role="alert">
          {teLang}
        </p>
      )}
      {melding && (
        <p className={b.melding} role="status">
          {melding}
        </p>
      )}
      {voorstel && (
        <div className={b.voorstel} role="region" aria-label="Titel van Tante">
          <p className={b.voorstelKop}>Titel van Tante</p>
          <p className={b.voorstelTekst}>{voorstel}</p>
          <div className={b.knoppenRij}>
            <button type="button" className={b.knopVol} onClick={neemOver}>
              Gebruik deze titel
            </button>
            <button type="button" className={b.knopLeeg} onClick={() => setVoorstel(null)}>
              Houd mijn eigen titel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Het formulier ----------

export function Boekbouwer({ code, voornaam, begin }: { code: string; voornaam: string | null; begin: Begin }) {
  const router = useRouter();
  const api = useApi(code);
  const [titel, setTitel] = useState(begin.titel);
  const [kleur, setKleur] = useState(begin.kleur);
  const [binnen, setBinnen] = useState(begin.binnenKleur);
  const [inleiding, setInleiding] = useState(begin.inleiding);
  const [nawoord, setNawoord] = useState(begin.nawoord);
  const [paginas, setPaginas] = useState<PaginaState[]>(begin.paginas);
  const [coverId, setCoverId] = useState<string | null>(begin.coverId);
  const [uploadFout, setUploadFout] = useState<string | null>(null);
  const [problemen, setProblemen] = useState<string[]>([]);
  const [indienen, setIndienen] = useState(false);
  const wachtrij = useRef(Promise.resolve());

  const stuur = api.stuur;
  const titelAuto = useAutoBewaar(
    useCallback((t: string) => (teLangWoord(t) ? Promise.resolve() : stuur({ actie: "cover", titel: t })), [stuur]),
    begin.titel,
  );
  const coverTitelTeLang = langWoordMelding(titel);

  const bewaarTekst = useCallback(
    (soort: "inleiding" | "nawoord") => (tekst: string, eigen?: string) =>
      stuur({ actie: "tekst", soort, tekst, ...(eigen !== undefined ? { eigen } : {}) }),
    [stuur],
  );
  const bewaarInleiding = useCallback((t: string, e?: string) => bewaarTekst("inleiding")(t, e), [bewaarTekst]);
  const bewaarNawoord = useCallback((t: string, e?: string) => bewaarTekst("nawoord")(t, e), [bewaarTekst]);

  const verrijk = useCallback(
    async (soort: Soort, tekst: string) => {
      const res = await fetch(`/api/boek/${code}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actie: "verrijk", soort, tekst }),
      });
      const data = (await res.json().catch(() => ({}))) as Antwoord;
      if (!res.ok || typeof data.voorstel !== "string") throw new Error(data.fout ?? "Tante kon nu even geen voorstel maken.");
      return data.voorstel;
    },
    [code],
  );

  const metFoto = paginas.filter((p) => p.kleinUrl && !p.bezig).length;
  const uploadsBezig = paginas.some((p) => p.bezig);
  const plekVrij = boek.maxFotos - paginas.length;

  // Waarschuwen bij weggaan terwijl er nog geüpload of bewaard wordt.
  useEffect(() => {
    if (!uploadsBezig && !api.bezig) return;
    const waarschuw = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", waarschuw);
    return () => window.removeEventListener("beforeunload", waarschuw);
  }, [uploadsBezig, api.bezig]);

  function werkBij(id: string, wijziging: Partial<PaginaState>) {
    setPaginas((ps) => ps.map((p) => (p.id === id ? { ...p, ...wijziging } : p)));
  }

  // Foto's één voor één uploaden: rustiger voor mobiele verbindingen en de volgorde blijft kloppen.
  function upload(bestand: File, bestaandId?: string) {
    const tijdelijkId = bestaandId ?? `nieuw-${crypto.randomUUID()}`;
    if (bestaandId) werkBij(bestaandId, { bezig: true, fout: null, waarschuwing: null });
    else setPaginas((ps) => [...ps, { id: tijdelijkId, titel: "", verhaal: "", draaiing: 0, kleinUrl: null, bezig: true }]);

    wachtrij.current = wachtrij.current.then(async () => {
      try {
        const foto = await bereidFotoVoor(bestand);
        const form = new FormData();
        form.append("foto", foto.groot, "foto.jpg");
        form.append("klein", foto.klein, "klein.jpg");
        if (bestaandId) form.append("pageId", bestaandId);
        const res = await fetch(`/api/boek/${code}/foto`, { method: "POST", body: form });
        const data = (await res.json().catch(() => ({}))) as { pagina?: { id: string }; kleinUrl?: string; fout?: string };
        if (!res.ok || !data.pagina) throw new Error(data.fout ?? "Het uploaden ging mis.");
        const echtId = data.pagina.id;
        setPaginas((ps) =>
          ps.map((p) =>
            p.id === tijdelijkId
              ? {
                  ...p,
                  id: echtId,
                  draaiing: 0,
                  kleinUrl: data.kleinUrl ?? null,
                  bezig: false,
                  fout: null,
                  waarschuwing: foto.teKlein ? "Deze foto is vrij klein; een grotere versie geeft een mooiere kleurplaat." : null,
                }
              : p,
          ),
        );
      } catch (e) {
        const melding = e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Geen verbinding. Probeer het nog eens.";
        if (bestaandId) werkBij(bestaandId, { bezig: false, fout: melding });
        else setPaginas((ps) => ps.map((p) => (p.id === tijdelijkId ? { ...p, bezig: false, fout: melding } : p)));
      }
    });
  }

  function kiesFotos(lijst: FileList | null) {
    if (!lijst) return;
    setUploadFout(null);
    const bestanden = Array.from(lijst);
    if (bestanden.length > plekVrij) {
      setUploadFout(
        plekVrij <= 0
          ? `Je boek is vol: er passen maximaal ${boek.maxFotos} foto's in.`
          : `Er passen nog ${plekVrij} foto's in je boek. De eerste ${plekVrij} worden toegevoegd.`,
      );
    }
    bestanden.slice(0, Math.max(0, plekVrij)).forEach((f) => upload(f));
  }

  async function draai(p: PaginaState) {
    const graden = ((p.draaiing + 90) % 360) as Draaiing;
    werkBij(p.id, { draaiing: graden });
    await stuur({ actie: "draai", pageId: p.id, graden }).catch(() => werkBij(p.id, { draaiing: p.draaiing }));
  }

  async function verplaats(p: PaginaState, richting: "omhoog" | "omlaag") {
    const i = paginas.findIndex((x) => x.id === p.id);
    const j = richting === "omhoog" ? i - 1 : i + 1;
    if (j < 0 || j >= paginas.length || paginas[j].bezig || paginas[j].id.startsWith("nieuw-")) return;
    const vorige = paginas;
    const nieuw = [...paginas];
    [nieuw[i], nieuw[j]] = [nieuw[j], nieuw[i]];
    setPaginas(nieuw);
    await stuur({ actie: "verplaats", pageId: p.id, richting }).catch(() => setPaginas(vorige));
  }

  async function verwijder(p: PaginaState, nr: number) {
    if (p.id.startsWith("nieuw-")) {
      setPaginas((ps) => ps.filter((x) => x.id !== p.id));
      return;
    }
    if (!window.confirm(`Pagina ${nr} met foto en verhaal verwijderen?`)) return;
    const vorige = paginas;
    setPaginas((ps) => ps.filter((x) => x.id !== p.id));
    await stuur({ actie: "verwijder", pageId: p.id }).catch(() => setPaginas(vorige));
  }

  async function dienIn() {
    setProblemen([]);
    if (uploadsBezig) {
      setProblemen(["Wacht even tot alle foto's zijn geüpload."]);
      return;
    }
    if (!window.confirm("Klaar? Na het indienen kun je je boek niet meer aanpassen. Tante gaat dan aan de slag.")) return;
    setIndienen(true);
    try {
      if (coverTitelTeLang || paginas.some((p) => teLangWoord(p.titel))) {
        setProblemen(["Een van je titels heeft een woord dat te lang is. Pas het aan (zie de rode melding)."]);
        return;
      }
      // Titel zeker bewaren (andere velden zijn bewaard bij het verlaten van het veld).
      titelAuto.markeer(titel);
      await stuur({ actie: "cover", titel });
      const data = await stuur({ actie: "indienen" });
      if (Array.isArray(data.problemen) && data.problemen.length) {
        setProblemen(data.problemen as string[]);
        return;
      }
      router.refresh();
    } catch {
      // melding staat al in de balk
    } finally {
      setIndienen(false);
    }
  }

  // Coverfoto: de keuze van de klant, anders de eerste foto.
  const metUrl = paginas.filter((p) => p.kleinUrl && !p.id.startsWith("nieuw-"));
  const coverPagina = metUrl.find((p) => p.id === coverId) ?? metUrl[0] ?? null;
  const coverNr = coverPagina ? paginas.findIndex((p) => p.id === coverPagina.id) + 1 : null;

  async function kiesCover(p: PaginaState) {
    const vorige = coverId;
    setCoverId(p.id);
    await stuur({ actie: "coverFoto", pageId: p.id }).catch(() => setCoverId(vorige));
  }

  return (
    <div className={b.bouwer}>
      <header className={b.intro}>
        <p className={s.tag}>Jouw kleurboek</p>
        <h1 className={`${s.display} ${s.h2}`}>{voornaam ? `Zo, ${voornaam}, aan de slag!` : "Zo, aan de slag!"}</h1>
        <p className={s.lead}>
          Vul je boek in {nawoordAan ? "vier" : "drie"} stappen. Alles wordt meteen bewaard, dus je kunt rustig stoppen en later verder via de link
          in je mail.
        </p>
      </header>

      {/* 1. Cover */}
      <section className={b.blok} aria-labelledby="kop-cover">
        <p className={b.stap}>Stap 1</p>
        <h2 id="kop-cover" className={`${s.display} ${s.h3}`}>
          {kleurKeuzeAan ? "De cover en de kleuren" : "De cover"}
        </h2>
        <div className={b.coverRij}>
          <div className={b.coverVelden}>
            <div className={b.veld}>
              <label htmlFor="titel" className={b.label}>
                Titel op de cover
              </label>
              <p className={b.hulp}>Een naam, een plek of een jaartal. Bijvoorbeeld &ldquo;Spanje 2025&rdquo; of &ldquo;Henk &amp; Ingrid&rdquo;.</p>
              <input
                id="titel"
                className={b.invoer}
                maxLength={boek.maxTitel}
                value={titel}
                onChange={(e) => {
                  setTitel(e.target.value);
                  titelAuto.straks(e.target.value);
                }}
                onBlur={(e) => titelAuto.nu(e.target.value)}
                aria-invalid={!!coverTitelTeLang}
              />
              {coverTitelTeLang && (
                <p className={b.fout} role="alert">
                  {coverTitelTeLang}
                </p>
              )}
            </div>
            <div className={b.veld}>
              <p className={b.label}>Foto op de cover</p>
              <p className={b.hulp}>
                {coverNr
                  ? `Nu: de foto van pagina ${coverNr}. Liever een andere? Kies hieronder bij je foto's “Maak coverfoto”.`
                  : "Kies bij stap 3 je foto's; de eerste wordt de coverfoto, tenzij je een andere kiest."}{" "}
                Tante maakt er een kleurplaat van in de kleuren van de cover.
              </p>
            </div>
            {kleurKeuzeAan && (
            <fieldset className={b.veld}>
              <legend className={b.label}>Kleur van de cover</legend>
              <div className={b.kleuren}>
                {boek.coverKleuren.map((k) => (
                  <label key={k.value} className={b.kleurKeuze}>
                    <input
                      type="radio"
                      name="kleur"
                      value={k.value}
                      checked={kleur === k.value}
                      onChange={() => {
                        setKleur(k.value);
                        stuur({ actie: "cover", kleur: k.value }).catch(() => undefined);
                      }}
                    />
                    <span className={b.kleurBol} style={{ background: `var(--${k.kleur})` }} aria-hidden />
                    <span>{k.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            )}
            {kleurKeuzeAan && (
              <BinnenKleurKiezer
                waarde={binnen}
                onKies={(k) => {
                  setBinnen(k);
                  stuur({ actie: "cover", binnenKleur: k }).catch(() => undefined);
                }}
              />
            )}
          </div>
          <div className={b.coverVoorbeeld} aria-label="Voorbeeld van de cover">
            <div className={b.coverBeeld}>
              {coverPagina?.kleinUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- tijdelijke, privé-link uit Supabase
                <img
                  src={coverPagina.kleinUrl}
                  alt=""
                  className={b.coverFoto}
                  style={{ transform: `rotate(${coverPagina.draaiing}deg)${coverPagina.draaiing % 180 ? " scale(1.42)" : ""}` }}
                />
              )}
            </div>
            {(() => {
              // Zoals op de gedrukte cover: laatste woord roze onder de overgang, de rest blauw erboven.
              const woorden = (titel.trim() || "Jouw titel").split(/\s+/);
              const laatste = woorden.pop();
              return (
                <>
                  {woorden.length > 0 && <span className={`${s.display} ${b.coverTitel} ${b.coverTitelBlauw}`}>{woorden.join(" ")}</span>}
                  <span className={`${s.display} ${b.coverTitel} ${b.coverTitelRoze}`}>{laatste}</span>
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* 2. Inleiding */}
      <section className={b.blok} aria-labelledby="kop-inleiding">
        <p className={b.stap}>Stap 2</p>
        <h2 id="kop-inleiding" className={`${s.display} ${s.h3}`}>
          De inleiding
        </h2>
        <TekstVeld
          id="inleiding"
          label="Inleiding (voorin het boek)"
          hulp="Voor wie is het boek, en waarom? Schrijf het gewoon zoals je het zou zeggen; Tante kan het mooier maken."
          placeholder="Lieve oma, dit boek is vol met onze mooiste momenten van dit jaar…"
          waarde={inleiding}
          max={boek.maxInleiding}
          rijen={5}
          soort="inleiding"
          onWijzig={setInleiding}
          bewaar={bewaarInleiding}
          verrijk={verrijk}
        />
      </section>

      {/* 3. Foto's */}
      <section className={b.blok} aria-labelledby="kop-fotos">
        <p className={b.stap}>Stap 3</p>
        <h2 id="kop-fotos" className={`${s.display} ${s.h3}`}>
          Je foto&apos;s en verhaaltjes
        </h2>
        <p className={s.body}>
          Kies {aantallenTekst} foto&apos;s. De drukker werkt met vellen van 4 pagina&apos;s, daarom kan het net niet met elk
          aantal. In het boek staat elke kleurplaat rechts, met links een titel en het verhaaltje. Het mooist werken scherpe, lichte foto&apos;s met één tot vier personen of dieren.
        </p>

        <ol className={b.paginas}>
          {paginas.map((p, i) => (
            <li key={p.id} className={b.spread}>
              <div className={b.spreadKop}>
                <span className={b.paginaNr}>Pagina {i + 1}</span>
                <div className={b.acties}>
                  <button type="button" className={b.icoonKnop} onClick={() => verplaats(p, "omhoog")} disabled={i === 0 || !!p.bezig} aria-label={`Pagina ${i + 1} naar voren`}>
                    ↑
                  </button>
                  <button type="button" className={b.icoonKnop} onClick={() => verplaats(p, "omlaag")} disabled={i === paginas.length - 1 || !!p.bezig} aria-label={`Pagina ${i + 1} naar achteren`}>
                    ↓
                  </button>
                  <button type="button" className={b.icoonKnop} onClick={() => verwijder(p, i + 1)} disabled={!!p.bezig} aria-label={`Pagina ${i + 1} verwijderen`}>
                    ✕
                  </button>
                </div>
              </div>
              <div className={b.spreadInhoud}>
                <div className={b.links}>
                  {p.id.startsWith("nieuw-") ? (
                    <p className={b.hulp}>De titel en het verhaaltje kun je invullen zodra de foto binnen is.</p>
                  ) : (
                    <>
                    <TitelVeld
                      id={`titel-${p.id}`}
                      waarde={p.titel}
                      verhaal={p.verhaal}
                      onWijzig={(t) => werkBij(p.id, { titel: t })}
                      bewaar={(t) => stuur({ actie: "titel", pageId: p.id, tekst: t })}
                      verrijk={verrijk}
                    />
                    <TekstVeld
                      id={`verhaal-${p.id}`}
                      label="Verhaaltje (links)"
                      placeholder="Wie, waar, wat gebeurde er? Bijv. ‘Opa op de sup in Zeeland, zomer 2025. Hij viel er drie keer af.’"
                      waarde={p.verhaal}
                      max={boek.maxVerhaal}
                      rijen={4}
                      soort="verhaal"
                      onWijzig={(t) => werkBij(p.id, { verhaal: t })}
                      bewaar={(t, eigen) => stuur({ actie: "verhaal", pageId: p.id, tekst: t, ...(eigen !== undefined ? { eigen } : {}) })}
                      verrijk={verrijk}
                    />
                    </>
                  )}
                </div>
                <div className={b.rechts}>
                  <div className={b.fotoVak}>
                    {p.kleinUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- tijdelijke, privé-link uit Supabase
                      <img src={p.kleinUrl} alt={`Foto voor pagina ${i + 1}`} className={b.foto} style={{ transform: `rotate(${p.draaiing}deg)` }} />
                    ) : (
                      <span className={b.hulp}>{p.bezig ? "Foto wordt geüpload…" : "Geen foto"}</span>
                    )}
                    {p.bezig && <span className={b.laden} aria-hidden />}
                  </div>
                  {p.fout && (
                    <p className={b.fout} role="alert">
                      {p.fout}
                    </p>
                  )}
                  {p.waarschuwing && <p className={b.melding}>{p.waarschuwing}</p>}
                  {!p.id.startsWith("nieuw-") && (
                    <div className={b.knoppenRij}>
                      <button type="button" className={b.knopLeeg} onClick={() => draai(p)} disabled={!p.kleinUrl || !!p.bezig}>
                        Draai ↻
                      </button>
                      {coverPagina?.id === p.id ? (
                        <span className={b.coverLabel}>★ Coverfoto</span>
                      ) : (
                        <button type="button" className={b.knopLeeg} onClick={() => kiesCover(p)} disabled={!p.kleinUrl || !!p.bezig}>
                          Maak coverfoto
                        </button>
                      )}
                      <label className={b.knopLeeg} aria-disabled={!!p.bezig}>
                        Andere foto
                        <input
                          type="file"
                          accept="image/*,.heic,.heif"
                          className={b.verborgen}
                          disabled={!!p.bezig}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) upload(f, p.id);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {plekVrij > 0 ? (
          <label className={b.uploadVak}>
            <span className={`${s.display} ${b.uploadKop}`}>{paginas.length === 0 ? "Kies je foto's" : "Foto's toevoegen"}</span>
            <span className={b.hulp}>
              Je kunt er meerdere tegelijk kiezen. Nog {plekVrij} {plekVrij === 1 ? "plek" : "plekken"} vrij.
            </span>
            <input type="file" accept="image/*,.heic,.heif" multiple className={b.verborgen} onChange={(e) => {
              kiesFotos(e.target.files);
              e.target.value = "";
            }} />
          </label>
        ) : (
          <p className={b.melding}>Je boek is vol: {boek.maxFotos} foto&apos;s. Wil je er een wisselen? Gebruik &ldquo;Andere foto&rdquo;.</p>
        )}
        {uploadFout && <p className={b.melding}>{uploadFout}</p>}
        {metFoto > 0 && !uploadsBezig && !geldigAantalFotos(metFoto) && (
          <p className={b.melding}>
            {metFoto < boek.minFotos
              ? `Je hebt nu ${metFoto} foto's. Je boek heeft er ${aantallenTekst} nodig.`
              : `Je hebt nu ${metFoto} foto's. Voeg er nog één toe of haal er één weg: je boek heeft er ${aantallenTekst} nodig.`}
          </p>
        )}
      </section>

      {/* 4. Nawoord (nu uit: staat niet in het ontwerp van het boek) */}
      {nawoordAan && (
      <section className={b.blok} aria-labelledby="kop-nawoord">
        <p className={b.stap}>Stap 4</p>
        <h2 id="kop-nawoord" className={`${s.display} ${s.h3}`}>
          Het nawoord
        </h2>
        <TekstVeld
          id="nawoord"
          label="Nawoord (achterin het boek)"
          hulp="Een afsluitende boodschap, een wens of een grapje om mee te eindigen. Mag ook leeg blijven."
          placeholder="Op naar nog veel meer avonturen samen…"
          waarde={nawoord}
          max={boek.maxNawoord}
          rijen={4}
          soort="nawoord"
          onWijzig={setNawoord}
          bewaar={bewaarNawoord}
          verrijk={verrijk}
        />
      </section>
      )}

      {/* Indienen */}
      <section className={b.blok} aria-labelledby="kop-klaar">
        <h2 id="kop-klaar" className={`${s.display} ${s.h3}`}>
          Klaar?
        </h2>
        <p className={s.body}>
          Na het indienen gaat Tante je kleurplaten maken. Je krijgt eerst een digitale proef; pas na jouw akkoord gaat het
          boek naar de drukker.
        </p>
        {problemen.length > 0 && (
          <ul className={b.problemen} role="alert">
            {problemen.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        <button type="button" className={b.indienKnop} onClick={dienIn} disabled={indienen}>
          {indienen ? "Bezig met indienen…" : "Boek indienen"}
        </button>
      </section>

      <div className={b.balk} role="status" aria-live="polite">
        <span>
          <strong>{metFoto}</strong> foto&apos;s (nodig: {aantallenTekst})
        </span>
        <span className={api.fout ? b.balkFout : undefined}>
          {api.fout ?? (api.bezig || uploadsBezig ? "Bewaren…" : "Alles bewaard ✓")}
        </span>
      </div>
    </div>
  );
}
