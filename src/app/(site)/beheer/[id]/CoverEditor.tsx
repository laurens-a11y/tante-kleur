"use client";

import { useEffect, useRef, useState } from "react";
import { coverBeeldVak, coverOpmaak, drukwerk, maxCoverZoom, plaatsUitsnede, standaardUitsnede, type CoverUitsnede } from "@/config";
import b from "../beheer.module.css";

type Kandidaat = { id: string; positie: number; tekenplaat: string | null; klein: string | null };

const vak = coverBeeldVak();
const klem = (v: number) => Math.min(1, Math.max(0, v));
const { lijn } = coverOpmaak.kleuren;
// Kleurmatrix: zwart → oranjerood lijnwerk (alfa = donkerte), wit → transparant (roze ondergrond).
const lijnRgb = [1, 3, 5].map((i) => parseInt(lijn.slice(i, i + 2), 16) / 255);
const matrix = `0 0 0 0 ${lijnRgb[0]}  0 0 0 0 ${lijnRgb[1]}  0 0 0 0 ${lijnRgb[2]}  -0.299 -0.587 -0.114 0 1`;

/**
 * Coverfoto kiezen en de uitsnede bijstellen. De preview gebruikt dezelfde
 * rekensom (plaatsUitsnede) en maten (coverBeeldVak) als de PDF, dus wat je
 * hier ziet komt zo op de cover.
 */
export function CoverEditor({
  orderId,
  titel,
  paginas,
  coverPageId,
  uitsnede: beginUitsnede,
}: {
  orderId: string;
  titel: string;
  paginas: Kandidaat[];
  coverPageId: string | null;
  uitsnede: CoverUitsnede | null;
}) {
  const standaard = paginas.find((p) => p.id === coverPageId) ?? paginas[0] ?? null;
  const [gekozen, setGekozen] = useState<string | null>(standaard?.id ?? null);
  const [u, setU] = useState<CoverUitsnede>(beginUitsnede ?? standaardUitsnede);
  const [bron, setBron] = useState<{ breedte: number; hoogte: number } | null>(null);
  const [kader, setKader] = useState<{ breedte: number; hoogte: number } | null>(null);
  const [status, setStatus] = useState<{ soort: "ok" | "fout"; tekst: string } | null>(null);
  const [bewaren, setBewaren] = useState(false);
  const [gewijzigd, setGewijzigd] = useState(false);
  const kaderRef = useRef<HTMLDivElement>(null);
  const beeldRef = useRef<HTMLImageElement>(null);
  const sleep = useRef<{ x: number; y: number; u: CoverUitsnede } | null>(null);

  const pagina = paginas.find((p) => p.id === gekozen) ?? null;
  const plaat = pagina?.tekenplaat ?? null;

  // Afmetingen van de plaat: ook als die al geladen was vóór React (dan vuurt onLoad niet).
  useEffect(() => {
    const img = beeldRef.current;
    if (img?.complete && img.naturalWidth) setBron({ breedte: img.naturalWidth, hoogte: img.naturalHeight });
  }, [plaat]);

  // Kaderformaat in px bijhouden (voor de rekensom en het slepen).
  useEffect(() => {
    const el = kaderRef.current;
    if (!el) return;
    const meet = () => setKader({ breedte: el.clientWidth, hoogte: el.clientHeight });
    meet();
    const ro = new ResizeObserver(meet);
    ro.observe(el);
    return () => ro.disconnect();
  }, [plaat]);

  const plek = bron && kader ? plaatsUitsnede(bron, kader, u) : null;
  // Effectieve resolutie op de cover (doel 300 ppi): bron-pixels per inch van het geplaatste beeld.
  const ppi = bron ? Math.round((300 / (Math.max(((vak.breedte / 25.4) * 300) / bron.breedte, ((vak.hoogte / 25.4) * 300) / bron.hoogte) * u.zoom))) : null;

  function wijzig(nieuw: CoverUitsnede) {
    setU(nieuw);
    setGewijzigd(true);
    setStatus(null);
  }

  function begin(e: React.PointerEvent) {
    if (!plaat) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    sleep.current = { x: e.clientX, y: e.clientY, u };
  }

  function beweeg(e: React.PointerEvent) {
    const s = sleep.current;
    if (!s || !bron || !kader) return;
    const p = plaatsUitsnede(bron, kader, s.u);
    const overX = p.breedte - kader.breedte;
    const overY = p.hoogte - kader.hoogte;
    wijzig({
      ...s.u,
      x: overX > 0 ? klem(s.u.x - (e.clientX - s.x) / overX) : 0.5,
      y: overY > 0 ? klem(s.u.y - (e.clientY - s.y) / overY) : 0.5,
    });
  }

  async function opslaan() {
    if (!gekozen) return;
    setBewaren(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/beheer/orders/${orderId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actie: "cover", pageId: gekozen, uitsnede: u }),
      });
      const data = (await res.json().catch(() => ({}))) as { fout?: string };
      if (!res.ok) throw new Error(data.fout ?? "Opslaan mislukt.");
      setGewijzigd(false);
      setStatus({ soort: "ok", tekst: "Cover opgeslagen. Maak de drukbestanden opnieuw om het resultaat te zien." });
    } catch (e) {
      setStatus({ soort: "fout", tekst: e instanceof Error ? e.message : "Opslaan mislukt." });
    } finally {
      setBewaren(false);
    }
  }

  // Percentages van de zones binnen het beeldvlak.
  const pct = (mm: number, totaal: number) => `${(mm / totaal) * 100}%`;
  const woorden = (titel.trim() || "Titel").toLocaleUpperCase("nl-NL").split(/\s+/);
  const laatste = woorden.pop();
  // Indicatie van de titel (start 84 pt ≈ 29,6 mm), geschaald naar het kader.
  const titelStijl = {
    left: pct(vak.rug + coverOpmaak.titel.linksVanafVoorplat, vak.breedte),
    fontSize: kader ? ((84 * 25.4) / 72 / vak.breedte) * kader.breedte : 16,
  };

  return (
    <section className={b.kaart}>
      <p className={b.label}>Cover: foto en uitsnede</p>
      {paginas.length === 0 ? (
        <p className={b.klein}>Nog geen pagina&apos;s.</p>
      ) : (
        <div className={b.coverEditor}>
          <div>
            <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
              <filter id="tk-lijnwerk" colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values={matrix} />
              </filter>
            </svg>
            <div
              ref={kaderRef}
              className={b.coverKader}
              style={{ aspectRatio: `${vak.breedte} / ${vak.hoogte}`, background: coverOpmaak.kleuren.roze, cursor: plaat ? "grab" : "default" }}
              onPointerDown={begin}
              onPointerMove={beweeg}
              onPointerUp={() => (sleep.current = null)}
              onPointerCancel={() => (sleep.current = null)}
              onWheel={(e) => {
                if (!plaat) return;
                wijzig({ ...u, zoom: Math.min(maxCoverZoom, Math.max(1, u.zoom * (e.deltaY < 0 ? 1.05 : 1 / 1.05))) });
              }}
            >
              {plaat ? (
                // eslint-disable-next-line @next/next/no-img-element -- tijdelijke, privé-link uit Supabase
                <img
                  key={plaat}
                  ref={beeldRef}
                  src={plaat}
                  alt={`Tekenplaat pagina ${pagina?.positie}`}
                  draggable={false}
                  onLoad={(e) => setBron({ breedte: e.currentTarget.naturalWidth, hoogte: e.currentTarget.naturalHeight })}
                  style={{
                    position: "absolute",
                    left: plek?.links ?? 0,
                    top: plek?.boven ?? 0,
                    width: plek?.breedte ?? "100%",
                    height: plek?.hoogte ?? "auto",
                    filter: "url(#tk-lijnwerk)",
                    pointerEvents: "none",
                    userSelect: "none",
                    maxWidth: "none",
                  }}
                />
              ) : (
                <p className={`${b.klein} ${b.coverLeeg}`}>Deze pagina heeft nog geen tekenplaat. Genereer of upload die eerst; dan kun je de uitsnede instellen.</p>
              )}
              {/* Zones die wegvallen: halve rug links, afloop boven en rechts. Sticker rechtsboven. */}
              <div className={b.coverZone} style={{ left: 0, top: 0, bottom: 0, width: pct(vak.rug, vak.breedte) }} title="Rug" />
              <div className={b.coverZone} style={{ left: pct(vak.rug, vak.breedte), right: 0, top: 0, height: pct(vak.afloopBoven, vak.hoogte) }} title="Afloop (wordt afgesneden / omgeslagen)" />
              <div className={b.coverZone} style={{ right: 0, top: pct(vak.afloopBoven, vak.hoogte), bottom: 0, width: pct(vak.afloopRechts, vak.breedte) }} title="Afloop (wordt afgesneden / omgeslagen)" />
              <div
                className={b.coverSticker}
                style={{ left: pct(vak.sticker.x, vak.breedte), top: pct(vak.sticker.y, vak.hoogte), width: pct(vak.sticker.maat, vak.breedte), height: pct(vak.sticker.maat, vak.hoogte) }}
                title="Sticker"
              />
              {woorden.length > 0 && <span className={b.coverTitelBlauw} style={titelStijl}>{woorden.join(" ")}</span>}
            </div>
            <div className={b.coverBlauw} style={{ aspectRatio: `${vak.breedte} / ${drukwerk.cover.hoogte - vak.hoogte}` }}>
              <span className={b.coverTitelRoze} style={titelStijl}>{laatste}</span>
            </div>
          </div>

          <div className={b.coverBediening}>
            <label className={b.label} htmlFor="coverpagina">
              Coverfoto
            </label>
            <select
              id="coverpagina"
              className={b.select}
              value={gekozen ?? ""}
              onChange={(e) => {
                setGekozen(e.target.value);
                setBron(null);
                wijzig(standaardUitsnede);
              }}
            >
              {paginas.map((p) => (
                <option key={p.id} value={p.id}>
                  Pagina {p.positie}
                  {p.id === coverPageId ? " (gekozen door klant)" : ""}
                  {p.tekenplaat ? "" : " – nog geen plaat"}
                </option>
              ))}
            </select>

            <label className={b.label} htmlFor="coverzoom">
              Zoom ({Math.round(u.zoom * 100)}%)
            </label>
            <input
              id="coverzoom"
              type="range"
              min={1}
              max={maxCoverZoom}
              step={0.01}
              value={u.zoom}
              disabled={!plaat}
              onChange={(e) => wijzig({ ...u, zoom: Number(e.target.value) })}
            />
            <p className={b.klein}>Sleep in het beeld om te verschuiven; scrollen zoomt. Grijze zones vallen weg (rug en afloop), het gestippelde vak is de sticker.</p>
            {ppi !== null && (
              <p className={ppi < 300 ? b.melding : b.klein}>
                Resolutie op de cover: ~{ppi} ppi{ppi < 300 ? " (doel 300; inzoomen verlaagt dit verder)" : ""}
              </p>
            )}
            <div className={b.knoppen}>
              <button type="button" className={b.knopLeeg} onClick={() => wijzig(standaardUitsnede)} disabled={!plaat}>
                Midden, geen zoom
              </button>
              <button type="button" className={b.knopVol} onClick={opslaan} disabled={!gekozen || bewaren || (!gewijzigd && gekozen === coverPageId && !!beginUitsnede)}>
                {bewaren ? "Opslaan…" : "Cover opslaan"}
              </button>
            </div>
            {status && (
              <p className={status.soort === "fout" ? b.fout : b.melding} role={status.soort === "fout" ? "alert" : "status"}>
                {status.tekst}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
