"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zipSync, strToU8 } from "fflate";
import b from "../beheer.module.css";

type Status = "betaald" | "ingediend" | "in_productie" | "proef_klaar" | "akkoord" | "gedrukt" | "verzonden";

type Pagina = {
  id: string;
  positie: number;
  draaiing: number;
  verhaal: string;
  opmerking: string | null;
  klein: string | null;
  groot: string | null;
  tekenplaat: string | null;
};

const statussen: { value: Status; label: string }[] = [
  { value: "betaald", label: "Klant vult in" },
  { value: "ingediend", label: "Ingediend" },
  { value: "in_productie", label: "In productie" },
  { value: "proef_klaar", label: "Proef bij klant" },
  { value: "akkoord", label: "Akkoord" },
  { value: "gedrukt", label: "Naar drukker (foto's worden gewist)" },
  { value: "verzonden", label: "Verzonden" },
];

async function api(orderId: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/beheer/orders/${orderId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { fout?: string };
  if (!res.ok) throw new Error(data.fout ?? "Er ging iets mis.");
}

/** Haalt een foto op en zet hem rechtop volgens de draaiing van de klant. */
async function rechtgezet(url: string, draaiing: number): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Foto downloaden mislukt");
  const blob = await res.blob();
  if (!draaiing) return new Uint8Array(await blob.arrayBuffer());
  const beeld = await createImageBitmap(blob);
  const kwart = draaiing === 90 || draaiing === 270;
  const canvas = document.createElement("canvas");
  canvas.width = kwart ? beeld.height : beeld.width;
  canvas.height = kwart ? beeld.width : beeld.height;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((draaiing * Math.PI) / 180);
  ctx.drawImage(beeld, -beeld.width / 2, -beeld.height / 2);
  beeld.close();
  const uit = await new Promise<Blob>((r, f) => canvas.toBlob((x) => (x ? r(x) : f(new Error("Omzetten mislukt"))), "image/jpeg", 0.95));
  return new Uint8Array(await uit.arrayBuffer());
}

export function BeheerOrder({ orderId, status, titel, paginas: begin }: { orderId: string; status: Status; titel: string; paginas: Pagina[] }) {
  const router = useRouter();
  const [paginas, setPaginas] = useState(begin);
  const [nieuweStatus, setNieuweStatus] = useState<Status>(status);
  const [bezig, setBezig] = useState<string | null>(null);
  const [melding, setMelding] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [genereren, setGenereren] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [druk, setDruk] = useState<{
    paginas: number;
    fotosGebruikt: number;
    fotosTotaal: number;
    platenOntbreken: number[];
    spreads: string | null;
    coverSnijtekens: string | null;
    binnenwerk: string | null;
    cover: string | null;
  } | null>(null);

  async function maakDruk() {
    setBezig("druk");
    setFout(null);
    setDruk(null);
    try {
      const res = await fetch(`/api/beheer/orders/${orderId}/druk`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { fout?: string } & NonNullable<typeof druk>;
      if (!res.ok) throw new Error(data.fout ?? "Drukbestanden maken mislukt.");
      setDruk(data);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Drukbestanden maken mislukt.");
    } finally {
      setBezig(null);
    }
  }

  const allePlaten = paginas.length > 0 && paginas.every((p) => p.tekenplaat);
  const kanProef = (status === "ingediend" || status === "in_productie") && allePlaten;

  async function doe(label: string, actie: () => Promise<void>, klaar?: string) {
    setBezig(label);
    setFout(null);
    setMelding(null);
    try {
      await actie();
      if (klaar) setMelding(klaar);
      router.refresh();
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Er ging iets mis.");
    } finally {
      setBezig(null);
    }
  }

  async function downloadZip() {
    await doe("zip", async () => {
      const bestanden: Record<string, Uint8Array> = {};
      const metFoto = paginas.filter((p) => p.groot);
      let n = 0;
      for (const p of metFoto) {
        setBezig(`zip ${++n}/${metFoto.length}`);
        bestanden[`${String(p.positie).padStart(2, "0")}.jpg`] = await rechtgezet(p.groot!, p.draaiing);
      }
      bestanden["verhalen.txt"] = strToU8(paginas.map((p) => `${String(p.positie).padStart(2, "0")}\n${p.verhaal || "(geen verhaal)"}\n`).join("\n"));
      const zip = zipSync(bestanden, { level: 0 });
      const url = URL.createObjectURL(new Blob([zip as BlobPart], { type: "application/zip" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${titel.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "boek"} - fotos.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    });
  }

  async function uploadPlaat(p: Pagina, bestand: File) {
    setBezig(p.id);
    setFout(null);
    try {
      const form = new FormData();
      form.append("pageId", p.id);
      form.append("bestand", bestand);
      const res = await fetch(`/api/beheer/orders/${orderId}/tekenplaat`, { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { url?: string; fout?: string };
      if (!res.ok) throw new Error(data.fout ?? "Uploaden mislukt.");
      setPaginas((ps) => ps.map((x) => (x.id === p.id ? { ...x, tekenplaat: data.url ?? null } : x)));
    } catch (e) {
      setFout(`Pagina ${p.positie}: ${e instanceof Error ? e.message : "uploaden mislukt"}`);
    } finally {
      setBezig(null);
    }
  }

  async function verwijderPlaat(p: Pagina) {
    if (!window.confirm(`Tekenplaat van pagina ${p.positie} verwijderen?`)) return;
    await doe(p.id, async () => {
      await api(orderId, { actie: "verwijderTekenplaat", pageId: p.id });
      setPaginas((ps) => ps.map((x) => (x.id === p.id ? { ...x, tekenplaat: null } : x)));
    });
  }

  const metFoto = paginas.filter((p) => p.groot).length;

  function zetGenereren(id: string, aan: boolean) {
    setGenereren((g) => {
      const n = new Set(g);
      if (aan) n.add(id);
      else n.delete(id);
      return n;
    });
  }

  async function genereer(p: Pagina): Promise<boolean> {
    zetGenereren(p.id, true);
    try {
      const res = await fetch(`/api/beheer/orders/${orderId}/genereer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pageId: p.id, extra: extra[p.id] ?? "" }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; fout?: string };
      if (!res.ok) throw new Error(data.fout ?? "Genereren mislukt.");
      setPaginas((ps) => ps.map((x) => (x.id === p.id ? { ...x, tekenplaat: data.url ?? null } : x)));
      return true;
    } catch (e) {
      setFout(`Pagina ${p.positie}: ${e instanceof Error ? e.message : "genereren mislukt"}`);
      return false;
    } finally {
      zetGenereren(p.id, false);
    }
  }

  // Alle pagina's zonder tekenplaat, drie tegelijk.
  async function genereerOntbrekende() {
    const lijst = paginas.filter((p) => p.groot && !p.tekenplaat && !genereren.has(p.id));
    if (lijst.length === 0) return;
    if (!window.confirm(`${lijst.length} tekenplaten genereren? Dit duurt een paar minuten per plaat en kost OpenAI-tegoed. Laat dit tabblad open.`)) return;
    setFout(null);
    const wachtrij = [...lijst];
    await Promise.all(
      Array.from({ length: Math.min(3, wachtrij.length) }, async () => {
        for (let p = wachtrij.shift(); p; p = wachtrij.shift()) await genereer(p);
      }),
    );
    router.refresh();
  }

  const ontbrekend = paginas.filter((p) => p.groot && !p.tekenplaat).length;

  return (
    <>
      <section className={b.kaart}>
        <div className={b.knoppen}>
          <button type="button" className={b.knopLeeg} onClick={downloadZip} disabled={!!bezig || metFoto === 0}>
            {bezig?.startsWith("zip") ? `Downloaden… ${bezig.slice(4)}` : `Download alle foto's (${metFoto}, rechtgezet)`}
          </button>
          <button type="button" className={b.knopLeeg} onClick={genereerOntbrekende} disabled={ontbrekend === 0 || genereren.size > 0}>
            {genereren.size > 0 ? `Genereren… (${genereren.size} bezig)` : `Genereer ontbrekende platen (${ontbrekend})`}
          </button>
          <button
            type="button"
            className={b.knopVol}
            disabled={!kanProef || !!bezig || genereren.size > 0}
            onClick={() => {
              if (window.confirm("Proef naar de klant sturen? De klant krijgt een mail.")) doe("proef", () => api(orderId, { actie: "proef" }), "Proef verstuurd.");
            }}
          >
            Proef naar klant sturen
          </button>
          {!allePlaten && (status === "ingediend" || status === "in_productie") && (
            <span className={b.klein}>
              {paginas.filter((p) => p.tekenplaat).length}/{paginas.length} tekenplaten klaar
            </span>
          )}
        </div>
        <div className={b.knoppen}>
          <label className={b.label} htmlFor="status">
            Status
          </label>
          <select id="status" className={b.select} value={nieuweStatus} onChange={(e) => setNieuweStatus(e.target.value as Status)}>
            {statussen.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={b.knopLeeg}
            disabled={nieuweStatus === status || !!bezig}
            onClick={() => {
              const wissen = nieuweStatus === "gedrukt" || nieuweStatus === "verzonden";
              if (wissen && !window.confirm("Hiermee worden de originele foto's van de klant definitief gewist. Doorgaan?")) return;
              doe("status", () => api(orderId, { actie: "status", status: nieuweStatus }), "Status opgeslagen.");
            }}
          >
            Status opslaan
          </button>
        </div>
        <div className={b.knoppen}>
          <button type="button" className={b.knopLeeg} onClick={maakDruk} disabled={!!bezig || genereren.size > 0}>
            {bezig === "druk" ? "Drukbestanden maken… (± 1 min)" : "Maak drukbestanden (PDF)"}
          </button>
        </div>
        {druk && (
          <div className={b.knoppen}>
            <span className={b.klein}>Spreads met snijtekens:</span>
            {druk.spreads && (
              <a className={b.knopVol} href={druk.spreads} target="_blank" rel="noreferrer">
                Binnenwerk (spreads)
              </a>
            )}
            {druk.coverSnijtekens && (
              <a className={b.knopVol} href={druk.coverSnijtekens} target="_blank" rel="noreferrer">
                Cover
              </a>
            )}
          </div>
        )}
        {druk && (
          <div className={b.knoppen}>
            <span className={b.klein}>Volgens specs PrintAPI (losse pagina&apos;s, zonder snijtekens):</span>
            {druk.binnenwerk && (
              <a className={b.knopLeeg} href={druk.binnenwerk} target="_blank" rel="noreferrer">
                Binnenwerk ({druk.paginas} p.)
              </a>
            )}
            {druk.cover && (
              <a className={b.knopLeeg} href={druk.cover} target="_blank" rel="noreferrer">
                Cover
              </a>
            )}
          </div>
        )}
        {druk && druk.fotosTotaal > druk.fotosGebruikt && (
          <p className={b.melding}>
            Let op: het boek telt nu {druk.paginas} pagina&apos;s; alleen de eerste {druk.fotosGebruikt} van {druk.fotosTotaal} foto&apos;s staan erin.
          </p>
        )}
        {druk && druk.platenOntbreken.length > 0 && (
          <p className={b.melding}>Nog geen tekenplaat bij pagina {druk.platenOntbreken.join(", ")}; daar staat een lege plek.</p>
        )}
        {melding && <p className={b.melding}>{melding}</p>}
        {fout && (
          <p className={b.fout} role="alert">
            {fout}
          </p>
        )}
      </section>

      <section className={b.kaart}>
        <p className={b.label}>Pagina&apos;s ({paginas.length})</p>
        {paginas.map((p) => (
          <div key={p.id} className={b.paginaRij}>
            <span className={b.nr}>{p.positie}</span>
            <div className={b.verhaal}>
              <p className={b.tekstBlok}>{p.verhaal || <em>(geen verhaal)</em>}</p>
              {p.opmerking && <p className={b.opmerking}>Opmerking klant: {p.opmerking}</p>}
            </div>
            <div className={b.beeldVak}>
              <div className={b.beeld}>
                {p.klein ? (
                  // eslint-disable-next-line @next/next/no-img-element -- tijdelijke, privé-link
                  <img src={p.klein} alt={`Foto pagina ${p.positie}`} style={{ transform: `rotate(${p.draaiing}deg)` }} />
                ) : (
                  <span className={b.klein}>Geen foto</span>
                )}
              </div>
              {p.groot && (
                <a href={p.groot} target="_blank" rel="noreferrer">
                  Origineel{p.draaiing ? ` (draai ${p.draaiing}°)` : ""}
                </a>
              )}
            </div>
            <div className={b.beeldVak}>
              <div className={b.beeld}>
                {p.tekenplaat ? (
                  // eslint-disable-next-line @next/next/no-img-element -- tijdelijke, privé-link
                  <img src={p.tekenplaat} alt={`Tekenplaat pagina ${p.positie}`} />
                ) : (
                  <span className={b.klein}>{genereren.has(p.id) ? "Tante tekent… (1–3 min)" : bezig === p.id ? "Uploaden…" : "Nog geen tekenplaat"}</span>
                )}
              </div>
              <input
                className={b.invoer}
                placeholder="Extra instructie (optioneel)"
                value={extra[p.id] ?? ""}
                onChange={(e) => setExtra((x) => ({ ...x, [p.id]: e.target.value }))}
                aria-label={`Extra instructie voor pagina ${p.positie}`}
              />
              <button type="button" className={b.knopVol} onClick={() => genereer(p)} disabled={!p.groot || genereren.has(p.id)}>
                {genereren.has(p.id) ? "Bezig…" : p.tekenplaat ? "Opnieuw genereren" : "Genereer plaat"}
              </button>
              <label className={`${b.knopLeeg} ${b.uploadKnop}`}>
                {p.tekenplaat ? "Vervang plaat" : "Upload plaat"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={!!bezig}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadPlaat(p, f);
                    e.target.value = "";
                  }}
                />
              </label>
              {p.tekenplaat && (
                <button type="button" className={b.knopLeeg} onClick={() => verwijderPlaat(p)} disabled={!!bezig}>
                  Verwijder plaat
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
