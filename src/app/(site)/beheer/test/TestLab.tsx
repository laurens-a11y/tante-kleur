"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bereidFotoVoor } from "@/app/(site)/boek/[code]/foto";
import type { TekenConfig } from "@/lib/tekenconfigs";
import type { TestFoto, TestPlaat } from "@/lib/testomgeving";
import b from "../beheer.module.css";
import t from "./test.module.css";

type Score = "goed" | "fout" | null;

/** Eén vak in de vergelijking: de originele foto, de ChatGPT-plaat of een plaat van een configuratie. */
type Tegel = {
  sleutel: string;
  soort: "origineel" | "chatgpt" | "plaat";
  /** Zichtbare naam; in de blinde stand een letter tot er een score is. */
  titel: string;
  /** De echte naam (ook in de blinde stand bekend, maar pas getoond na beoordelen). */
  echteNaam: string;
  onthuld: boolean;
  scherm: string | null;
  groot: string | null;
  config?: TekenConfig;
  plaat?: TestPlaat;
  pogingen?: TestPlaat[];
  pogingIndex?: number;
  score?: Score;
  notitie?: string | null;
};

const blindSleutel = "tk-test-blind";
const letters = "ABCDEFGH";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json().catch(() => ({}))) as T & { fout?: string };
  if (!res.ok) throw new Error(data.fout ?? `Er ging iets mis (${res.status}).`);
  return data;
}

function json(body: unknown, method = "POST"): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

/** Vaste, maar per foto andere volgorde voor de blinde stand. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function seconden(ms: number | null | undefined) {
  return ms ? `${Math.round(ms / 1000)} s` : "-";
}

function maakTegels(foto: TestFoto, configs: TekenConfig[], blind: boolean, keuze: Record<string, number | undefined>): Tegel[] {
  const origineel: Tegel = {
    sleutel: "origineel",
    soort: "origineel",
    titel: "Origineel",
    echteNaam: "Origineel",
    onthuld: true,
    scherm: foto.scherm,
    groot: foto.origineel,
  };
  const platen: Tegel[] = configs.map((config) => {
    const pogingen = foto.platen.filter((p) => p.config === config.id);
    const gekozen = keuze[`${foto.id}:${config.id}`];
    const index = gekozen === undefined || gekozen >= pogingen.length ? pogingen.length - 1 : gekozen;
    const plaat = index >= 0 ? pogingen[index] : undefined;
    return {
      sleutel: config.id,
      soort: "plaat",
      titel: config.naam,
      echteNaam: config.naam,
      onthuld: !blind || !!plaat?.score,
      scherm: plaat?.url ?? null,
      groot: plaat?.url ?? null,
      config,
      plaat,
      pogingen,
      pogingIndex: index,
      score: plaat?.score ?? null,
      notitie: plaat?.notitie ?? null,
    };
  });
  const chatgpt: Tegel = {
    sleutel: "chatgpt",
    soort: "chatgpt",
    titel: "ChatGPT (handmatig)",
    echteNaam: "ChatGPT (handmatig)",
    onthuld: !blind || !!foto.chatgpt_score,
    scherm: foto.chatgpt,
    groot: foto.chatgpt,
    score: foto.chatgpt_score,
    notitie: foto.chatgpt_notitie,
  };
  // Blind: ChatGPT en de vier configuraties door elkaar, met letters.
  const vergelijk = [chatgpt, ...platen];
  if (blind) {
    vergelijk.sort((x, y) => hash(foto.id + x.sleutel) - hash(foto.id + y.sleutel));
    vergelijk.forEach((tg, i) => {
      if (!tg.onthuld) tg.titel = `Plaat ${letters[i]}`;
      else tg.titel = `Plaat ${letters[i]} · ${tg.echteNaam}`;
    });
  }
  return [origineel, ...vergelijk];
}

export function TestLab({ beginFotos, configs }: { beginFotos: TestFoto[]; configs: TekenConfig[] }) {
  const [fotos, setFotos] = useState(beginFotos);
  const [blind, setBlindState] = useState(false);
  const [keuze, setKeuze] = useState<Record<string, number | undefined>>({});
  const [bezig, setBezig] = useState<Set<string>>(new Set());
  const [fouten, setFouten] = useState<Record<string, string>>({});
  const [uploaden, setUploaden] = useState<string | null>(null);
  const [groot, setGroot] = useState<{ fotoId: string; links: string; rechts: string | null } | null>(null);

  useEffect(() => {
    try {
      // Na het laden de bewaarde stand overnemen (localStorage bestaat niet op de server).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (window.localStorage.getItem(blindSleutel) === "1") setBlindState(true);
    } catch {
      /* geen opslag beschikbaar */
    }
  }, []);

  function setBlind(aan: boolean) {
    setBlindState(aan);
    try {
      window.localStorage.setItem(blindSleutel, aan ? "1" : "0");
    } catch {
      /* geen opslag beschikbaar */
    }
  }

  const werkFoto = useCallback((id: string, f: (foto: TestFoto) => TestFoto) => setFotos((lijst) => lijst.map((x) => (x.id === id ? f(x) : x))), []);
  const zetBezig = useCallback((sleutel: string, aan: boolean) => setBezig((s) => {
    const n = new Set(s);
    if (aan) n.add(sleutel);
    else n.delete(sleutel);
    return n;
  }), []);
  const zetFout = useCallback((fotoId: string, melding: string | null) => setFouten((f) => {
    const n = { ...f };
    if (melding) n[fotoId] = melding;
    else delete n[fotoId];
    return n;
  }), []);

  async function uploadFotos(bestanden: FileList | null) {
    if (!bestanden?.length) return;
    const lijst = Array.from(bestanden);
    for (const [i, bestand] of lijst.entries()) {
      setUploaden(`Foto ${i + 1} van ${lijst.length} uploaden…`);
      try {
        const { groot: jpeg } = await bereidFotoVoor(bestand);
        const form = new FormData();
        form.set("foto", jpeg, "foto.jpg");
        form.set("naam", bestand.name.replace(/\.[^.]+$/, ""));
        const nieuw = await api<TestFoto>("/api/beheer/test/fotos", { method: "POST", body: form });
        setFotos((f) => [...f, nieuw]);
      } catch (e) {
        window.alert(`${bestand.name}: ${e instanceof Error ? e.message : e}`);
      }
    }
    setUploaden(null);
  }

  async function analyseer(foto: TestFoto) {
    if (foto.briefing && !window.confirm("Opnieuw analyseren vervangt de briefing. Eerdere platen houden hun eigen briefing. Doorgaan?")) return;
    const sleutel = `${foto.id}:analyse`;
    zetBezig(sleutel, true);
    zetFout(foto.id, null);
    try {
      const nieuw = await api<TestFoto>(`/api/beheer/test/fotos/${foto.id}/analyse`, { method: "POST" });
      werkFoto(foto.id, () => nieuw);
    } catch (e) {
      zetFout(foto.id, e instanceof Error ? e.message : String(e));
    } finally {
      zetBezig(sleutel, false);
    }
  }

  async function bewaarVelden(fotoId: string, velden: Record<string, unknown>) {
    await api(`/api/beheer/test/fotos/${fotoId}`, json(velden, "PATCH"));
    werkFoto(fotoId, (f) => ({ ...f, ...velden }));
  }

  async function teken(foto: TestFoto, config: TekenConfig) {
    const sleutel = `${foto.id}:${config.id}`;
    zetBezig(sleutel, true);
    zetFout(foto.id, null);
    try {
      const plaat = await api<TestPlaat>(`/api/beheer/test/fotos/${foto.id}/teken`, json({ config: config.id }));
      werkFoto(foto.id, (f) => ({ ...f, platen: [...f.platen, plaat] }));
      setKeuze((k) => ({ ...k, [sleutel]: undefined }));
    } catch (e) {
      zetFout(foto.id, `${config.naam}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      zetBezig(sleutel, false);
    }
  }

  async function uploadChatgpt(foto: TestFoto, bestand: File | undefined) {
    if (!bestand) return;
    const sleutel = `${foto.id}:chatgpt`;
    zetBezig(sleutel, true);
    try {
      const { groot: jpeg } = await bereidFotoVoor(bestand);
      const form = new FormData();
      form.set("bestand", jpeg, "chatgpt.jpg");
      const nieuw = await api<TestFoto>(`/api/beheer/test/fotos/${foto.id}/chatgpt`, { method: "POST", body: form });
      werkFoto(foto.id, () => nieuw);
    } catch (e) {
      zetFout(foto.id, e instanceof Error ? e.message : String(e));
    } finally {
      zetBezig(sleutel, false);
    }
  }

  async function beoordeel(foto: TestFoto, tegel: Tegel, velden: { score?: Score; notitie?: string }) {
    try {
      if (tegel.soort === "chatgpt") {
        const v: Record<string, unknown> = {};
        if (velden.score !== undefined) v.chatgpt_score = velden.score;
        if (velden.notitie !== undefined) v.chatgpt_notitie = velden.notitie;
        await bewaarVelden(foto.id, v);
      } else if (tegel.plaat) {
        const id = tegel.plaat.id;
        await api(`/api/beheer/test/platen/${id}`, json(velden, "PATCH"));
        werkFoto(foto.id, (f) => ({ ...f, platen: f.platen.map((p) => (p.id === id ? { ...p, ...velden } : p)) }));
      }
    } catch (e) {
      zetFout(foto.id, e instanceof Error ? e.message : String(e));
    }
  }

  async function verwijderPlaat(foto: TestFoto, plaat: TestPlaat) {
    if (!window.confirm("Deze plaat verwijderen?")) return;
    try {
      await api(`/api/beheer/test/platen/${plaat.id}`, { method: "DELETE" });
      werkFoto(foto.id, (f) => ({ ...f, platen: f.platen.filter((p) => p.id !== plaat.id) }));
    } catch (e) {
      zetFout(foto.id, e instanceof Error ? e.message : String(e));
    }
  }

  async function verwijderFoto(foto: TestFoto) {
    if (!window.confirm(`"${foto.naam ?? "Deze foto"}" met alle platen verwijderen?`)) return;
    try {
      await api(`/api/beheer/test/fotos/${foto.id}`, { method: "DELETE" });
      setFotos((f) => f.filter((x) => x.id !== foto.id));
    } catch (e) {
      zetFout(foto.id, e instanceof Error ? e.message : String(e));
    }
  }

  const grootFoto = groot ? fotos.find((f) => f.id === groot.fotoId) : null;

  return (
    <>
      <section className={`${b.kaart} ${t.balk}`}>
        <label className={b.knopVol}>
          Testfoto&apos;s toevoegen
          <input type="file" accept="image/*" multiple hidden disabled={!!uploaden} onChange={(e) => {
            void uploadFotos(e.target.files);
            e.target.value = "";
          }} />
        </label>
        {uploaden && <span className={b.melding}>{uploaden}</span>}
        <label className={t.schakel}>
          <input type="checkbox" checked={blind} onChange={(e) => setBlind(e.target.checked)} />
          Blind beoordelen (namen pas zichtbaar na je oordeel)
        </label>
      </section>

      <Overzicht fotos={fotos} configs={configs} />

      {fotos.length === 0 && <p>Nog geen testfoto&apos;s. Voeg er een paar toe om te beginnen.</p>}

      {fotos.map((foto) => (
        <FotoKaart
          key={foto.id}
          foto={foto}
          configs={configs}
          tegels={maakTegels(foto, configs, blind, keuze)}
          bezig={bezig}
          fout={fouten[foto.id] ?? null}
          onAnalyseer={() => void analyseer(foto)}
          onTeken={(c) => void teken(foto, c)}
          onTekenAlles={() => configs.forEach((c) => void teken(foto, c))}
          onBewaar={(v) => bewaarVelden(foto.id, v)}
          onChatgpt={(f) => void uploadChatgpt(foto, f)}
          onBeoordeel={(tg, v) => void beoordeel(foto, tg, v)}
          onPoging={(configId, index) => setKeuze((k) => ({ ...k, [`${foto.id}:${configId}`]: index }))}
          onVerwijderPlaat={(p) => void verwijderPlaat(foto, p)}
          onVerwijder={() => void verwijderFoto(foto)}
          onGroot={(sleutel) => setGroot({ fotoId: foto.id, links: sleutel, rechts: sleutel === "origineel" ? null : "origineel" })}
        />
      ))}

      {groot && grootFoto && (
        <Vergelijker
          tegels={maakTegels(grootFoto, configs, blind, keuze)}
          links={groot.links}
          rechts={groot.rechts}
          onKies={(links, rechts) => setGroot({ fotoId: grootFoto.id, links, rechts })}
          onBeoordeel={(tg, v) => void beoordeel(grootFoto, tg, v)}
          onSluit={() => setGroot(null)}
        />
      )}
    </>
  );
}

function Overzicht({ fotos, configs }: { fotos: TestFoto[]; configs: TekenConfig[] }) {
  const rijen = [
    ...configs.map((c) => {
      const platen = fotos.flatMap((f) => f.platen.filter((p) => p.config === c.id));
      const tijden = platen.map((p) => p.duur_ms ?? 0).filter(Boolean);
      return {
        naam: c.naam,
        aantal: platen.length,
        goed: platen.filter((p) => p.score === "goed").length,
        fout: platen.filter((p) => p.score === "fout").length,
        tijd: tijden.length ? tijden.reduce((a, x) => a + x, 0) / tijden.length : null,
      };
    }),
    {
      naam: "ChatGPT (handmatig)",
      aantal: fotos.filter((f) => f.chatgpt).length,
      goed: fotos.filter((f) => f.chatgpt_score === "goed").length,
      fout: fotos.filter((f) => f.chatgpt_score === "fout").length,
      tijd: null,
    },
  ];
  return (
    <section className={b.kaart}>
      <p className={b.label}>Overzicht</p>
      <div className={t.tabelRol}>
        <table className={b.tabel}>
          <thead>
            <tr>
              <th>Configuratie</th>
              <th>Platen</th>
              <th>Beoordeeld</th>
              <th>Goed</th>
              <th>% goed</th>
              <th>Gem. tijd</th>
            </tr>
          </thead>
          <tbody>
            {rijen.map((r) => {
              const beoordeeld = r.goed + r.fout;
              return (
                <tr key={r.naam}>
                  <td>{r.naam}</td>
                  <td>{r.aantal}</td>
                  <td>{beoordeeld}</td>
                  <td>{r.goed}</td>
                  <td>{beoordeeld ? `${Math.round((r.goed / beoordeeld) * 100)}%` : "-"}</td>
                  <td>{r.tijd ? seconden(r.tijd) : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type KaartProps = {
  foto: TestFoto;
  configs: TekenConfig[];
  tegels: Tegel[];
  bezig: Set<string>;
  fout: string | null;
  onAnalyseer: () => void;
  onTeken: (c: TekenConfig) => void;
  onTekenAlles: () => void;
  onBewaar: (v: Record<string, unknown>) => Promise<void>;
  onChatgpt: (f: File | undefined) => void;
  onBeoordeel: (t: Tegel, v: { score?: Score; notitie?: string }) => void;
  onPoging: (configId: string, index: number) => void;
  onVerwijderPlaat: (p: TestPlaat) => void;
  onVerwijder: () => void;
  onGroot: (sleutel: string) => void;
};

function FotoKaart(props: KaartProps) {
  const { foto, configs, tegels, bezig, fout } = props;
  const [briefing, setBriefing] = useState(foto.briefing ?? "");
  const [laatstBewaard, setLaatstBewaard] = useState(foto.briefing ?? "");
  const [naam, setNaam] = useState(foto.naam ?? "");
  const chatgptInvoer = useRef<HTMLInputElement>(null);

  // Nieuwe briefing van de analyse overnemen.
  if ((foto.briefing ?? "") !== laatstBewaard) {
    setLaatstBewaard(foto.briefing ?? "");
    setBriefing(foto.briefing ?? "");
  }
  const gewijzigd = briefing.trim() !== laatstBewaard.trim();
  const analyseBezig = bezig.has(`${foto.id}:analyse`);
  const tekenBezig = configs.some((c) => bezig.has(`${foto.id}:${c.id}`));

  async function bewaarBriefing() {
    await props.onBewaar({ briefing: briefing.trim() || null });
    setLaatstBewaard(briefing.trim());
  }

  async function voorTekenen(actie: () => void) {
    if (gewijzigd) await bewaarBriefing();
    actie();
  }

  return (
    <section className={`${b.kaart} ${t.foto}`}>
      <div className={t.fotoKop}>
        <input
          className={`${b.invoer} ${t.naam}`}
          value={naam}
          aria-label="Naam van de testfoto"
          placeholder="Naam van de testfoto"
          onChange={(e) => setNaam(e.target.value)}
          onBlur={() => naam !== (foto.naam ?? "") && void props.onBewaar({ naam })}
        />
        <div className={b.knoppen}>
          <button type="button" className={b.knopLeeg} onClick={props.onAnalyseer} disabled={analyseBezig}>
            {analyseBezig ? "Analyseren…" : foto.briefing ? "Opnieuw analyseren" : "1. Analyseer"}
          </button>
          <button type="button" className={b.knopVol} onClick={() => void voorTekenen(props.onTekenAlles)} disabled={!briefing.trim() || analyseBezig || tekenBezig}>
            2. Teken alle {configs.length}
          </button>
          <button type="button" className={b.knopLeeg} onClick={() => chatgptInvoer.current?.click()} disabled={bezig.has(`${foto.id}:chatgpt`)}>
            {bezig.has(`${foto.id}:chatgpt`) ? "Uploaden…" : foto.chatgpt ? "ChatGPT-plaat vervangen" : "ChatGPT-plaat toevoegen"}
          </button>
          <input ref={chatgptInvoer} type="file" accept="image/*" hidden onChange={(e) => {
            props.onChatgpt(e.target.files?.[0]);
            e.target.value = "";
          }} />
          <button type="button" className={t.knopKlein} onClick={props.onVerwijder}>
            Verwijderen
          </button>
        </div>
      </div>

      {fout && <p className={b.fout}>{fout}</p>}
      {foto.geschikt === false && <p className={b.fout}>Afgekeurd door de analyse: {foto.reden ?? "geen reden opgegeven"}</p>}

      <details className={t.briefing} open={!foto.briefing || gewijzigd}>
        <summary>
          Tekenbriefing {foto.briefing ? "" : "(nog leeg: analyseer de foto of schrijf er zelf een)"}
          {gewijzigd && <span className={t.gewijzigd}> · niet bewaard</span>}
        </summary>
        <textarea
          className={b.invoer}
          rows={7}
          value={briefing}
          onChange={(e) => setBriefing(e.target.value)}
          placeholder="De opdracht die met foto en stijlreferentie naar het beeldmodel gaat."
        />
        <div className={b.knoppen}>
          <button type="button" className={b.knopLeeg} onClick={() => void bewaarBriefing()} disabled={!gewijzigd}>
            Briefing bewaren
          </button>
          <span className={t.hint}>Nieuwe platen gebruiken de bewaarde briefing; eerdere platen houden de hunne.</span>
        </div>
      </details>

      <div className={t.raster}>
        {tegels.map((tegel) => (
          <TegelVak
            key={tegel.sleutel}
            tegel={tegel}
            bezig={tegel.config ? bezig.has(`${foto.id}:${tegel.config.id}`) : tegel.soort === "chatgpt" && bezig.has(`${foto.id}:chatgpt`)}
            kanTekenen={!!briefing.trim() && !analyseBezig}
            onGroot={() => props.onGroot(tegel.sleutel)}
            onTeken={() => tegel.config && void voorTekenen(() => props.onTeken(tegel.config!))}
            onBeoordeel={(v) => props.onBeoordeel(tegel, v)}
            onPoging={(i) => tegel.config && props.onPoging(tegel.config.id, i)}
            onVerwijder={() => tegel.plaat && props.onVerwijderPlaat(tegel.plaat)}
            onChatgpt={() => chatgptInvoer.current?.click()}
          />
        ))}
      </div>
    </section>
  );
}

function Beoordeling({ tegel, onBeoordeel }: { tegel: Tegel; onBeoordeel: (v: { score?: Score; notitie?: string }) => void }) {
  const [notitie, setNotitie] = useState(tegel.notitie ?? "");
  const [vorige, setVorige] = useState(tegel.notitie ?? "");
  if ((tegel.notitie ?? "") !== vorige) {
    setVorige(tegel.notitie ?? "");
    setNotitie(tegel.notitie ?? "");
  }
  return (
    <div className={t.beoordeling}>
      <div className={t.scoreKnoppen}>
        <button type="button" className={`${t.score} ${tegel.score === "goed" ? t.goed : ""}`} onClick={() => onBeoordeel({ score: tegel.score === "goed" ? null : "goed" })}>
          ✓ Goed
        </button>
        <button type="button" className={`${t.score} ${tegel.score === "fout" ? t.foutScore : ""}`} onClick={() => onBeoordeel({ score: tegel.score === "fout" ? null : "fout" })}>
          ✗ Fout
        </button>
      </div>
      <input
        className={`${b.invoer} ${t.notitie}`}
        value={notitie}
        placeholder="Notitie (bijv. handen vervormd, te druk)"
        aria-label="Notitie"
        onChange={(e) => setNotitie(e.target.value)}
        onBlur={() => notitie !== (tegel.notitie ?? "") && onBeoordeel({ notitie })}
      />
    </div>
  );
}

type TegelProps = {
  tegel: Tegel;
  bezig: boolean;
  kanTekenen: boolean;
  onGroot: () => void;
  onTeken: () => void;
  onBeoordeel: (v: { score?: Score; notitie?: string }) => void;
  onPoging: (index: number) => void;
  onVerwijder: () => void;
  onChatgpt: () => void;
};

function TegelVak({ tegel, bezig, kanTekenen, onGroot, onTeken, onBeoordeel, onPoging, onVerwijder, onChatgpt }: TegelProps) {
  const aantal = tegel.pogingen?.length ?? 0;
  const index = tegel.pogingIndex ?? 0;
  return (
    <figure className={`${t.tegel} ${tegel.soort === "origineel" ? t.tegelOrigineel : ""}`}>
      <figcaption className={t.tegelKop}>
        <span className={t.tegelTitel}>{tegel.titel}</span>
        {aantal > 1 && (
          <span className={t.pogingen}>
            <button type="button" aria-label="Vorige poging" disabled={index <= 0} onClick={() => onPoging(index - 1)}>
              ‹
            </button>
            poging {index + 1}/{aantal}
            <button type="button" aria-label="Volgende poging" disabled={index >= aantal - 1} onClick={() => onPoging(index + 1)}>
              ›
            </button>
          </span>
        )}
      </figcaption>

      <div className={t.beeldVak}>
        {tegel.scherm ? (
          <button type="button" className={t.beeldKnop} onClick={onGroot} aria-label={`${tegel.titel} groot bekijken`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- tijdelijke links uit privé-opslag */}
            <img src={tegel.scherm} alt={tegel.titel} loading="lazy" />
          </button>
        ) : (
          <div className={t.leeg}>
            {bezig ? (
              <span>Bezig… (1 à 3 minuten)</span>
            ) : tegel.soort === "chatgpt" ? (
              <button type="button" className={b.knopLeeg} onClick={onChatgpt}>
                ChatGPT-plaat toevoegen
              </button>
            ) : (
              <span>Nog geen plaat</span>
            )}
          </div>
        )}
        {bezig && tegel.scherm && <span className={t.bezigLabel}>Nieuwe poging bezig…</span>}
      </div>

      {tegel.soort !== "origineel" && tegel.scherm && <Beoordeling key={tegel.plaat?.id ?? tegel.sleutel} tegel={tegel} onBeoordeel={onBeoordeel} />}

      {tegel.soort === "plaat" && (
        <div className={t.tegelVoet}>
          <button type="button" className={t.knopKlein} onClick={onTeken} disabled={bezig || !kanTekenen}>
            {aantal ? "Nog een poging" : "Teken"}
          </button>
          {tegel.plaat && (
            <button type="button" className={t.knopKlein} onClick={onVerwijder}>
              Verwijder poging
            </button>
          )}
          {tegel.plaat && tegel.onthuld && <span className={t.hint}>{seconden(tegel.plaat.duur_ms)}</span>}
        </div>
      )}
      {tegel.plaat && tegel.onthuld && (
        <details className={t.prompt}>
          <summary>Briefing bij deze plaat</summary>
          <p>{tegel.plaat.briefing}</p>
          {tegel.plaat.revised_prompt && tegel.plaat.revised_prompt.trim() !== tegel.plaat.briefing.trim() && (
            <>
              <p className={b.label}>Werkelijk doorgegeven aan het beeldmodel</p>
              <p>{tegel.plaat.revised_prompt}</p>
            </>
          )}
        </details>
      )}
    </figure>
  );
}

type VergelijkerProps = {
  tegels: Tegel[];
  links: string;
  rechts: string | null;
  onKies: (links: string, rechts: string | null) => void;
  onBeoordeel: (t: Tegel, v: { score?: Score; notitie?: string }) => void;
  onSluit: () => void;
};

/** Schermvullend vergelijken: links en rechts een vak naar keuze, met pijltjestoetsen bladeren. */
function Vergelijker({ tegels, links, rechts, onKies, onBeoordeel, onSluit }: VergelijkerProps) {
  const metBeeld = useMemo(() => tegels.filter((tg) => tg.groot), [tegels]);
  const [zoom, setZoom] = useState(false);
  const linksTegel = metBeeld.find((tg) => tg.sleutel === links) ?? metBeeld[0];
  const rechtsTegel = rechts ? metBeeld.find((tg) => tg.sleutel === rechts) : undefined;

  useEffect(() => {
    function toets(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") onSluit();
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const i = metBeeld.findIndex((tg) => tg.sleutel === linksTegel?.sleutel);
        const volgende = metBeeld[(i + (e.key === "ArrowRight" ? 1 : metBeeld.length - 1)) % metBeeld.length];
        if (volgende) onKies(volgende.sleutel, rechts === volgende.sleutel ? null : rechts);
      }
    }
    window.addEventListener("keydown", toets);
    const oud = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", toets);
      document.body.style.overflow = oud;
    };
  }, [metBeeld, linksTegel, rechts, onKies, onSluit]);

  if (!linksTegel) return null;

  const paneel = (tegel: Tegel, kant: "links" | "rechts") => (
    <div className={t.paneel}>
      <div className={t.paneelKop}>
        <select
          className={b.select}
          value={tegel.sleutel}
          aria-label={kant === "links" ? "Linker afbeelding" : "Rechter afbeelding"}
          onChange={(e) => (kant === "links" ? onKies(e.target.value, rechts) : onKies(linksTegel.sleutel, e.target.value))}
        >
          {metBeeld.map((tg) => (
            <option key={tg.sleutel} value={tg.sleutel}>
              {tg.titel}
            </option>
          ))}
        </select>
        {kant === "rechts" && (
          <button type="button" className={t.knopKlein} onClick={() => onKies(linksTegel.sleutel, null)}>
            Alleen links tonen
          </button>
        )}
      </div>
      <div className={`${t.paneelBeeld} ${zoom ? t.zoom : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- tijdelijke links uit privé-opslag */}
        <img src={tegel.groot!} alt={tegel.titel} onClick={() => setZoom((z) => !z)} />
      </div>
      {tegel.soort !== "origineel" && <Beoordeling key={tegel.plaat?.id ?? tegel.sleutel} tegel={tegel} onBeoordeel={(v) => onBeoordeel(tegel, v)} />}
    </div>
  );

  return (
    <div className={t.overlay} role="dialog" aria-modal="true" aria-label="Groot vergelijken">
      <div className={t.overlayKop}>
        <span className={t.hint}>← → bladeren · klik op een beeld om in te zoomen · Esc sluiten</span>
        <div className={b.knoppen}>
          {!rechtsTegel && (
            <button type="button" className={t.knopKlein} onClick={() => onKies(linksTegel.sleutel, linksTegel.sleutel === "origineel" ? (metBeeld[1]?.sleutel ?? null) : "origineel")}>
              Naast elkaar
            </button>
          )}
          <button type="button" className={b.knopVol} onClick={onSluit}>
            Sluiten
          </button>
        </div>
      </div>
      <div className={`${t.panelen} ${rechtsTegel ? t.twee : ""}`}>
        {paneel(linksTegel, "links")}
        {rechtsTegel && paneel(rechtsTegel, "rechts")}
      </div>
    </div>
  );
}
