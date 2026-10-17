"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { strFromU8, unzipSync } from "fflate";
import b from "./beheer.module.css";

// Testboek importeren uit een zip met boek.json + plaat-01.jpg, plaat-02.jpg, …
// boek.json: { titel, inleiding, items: [{ titel, verhaal, plaat }] }
export function TestboekImport() {
  const router = useRouter();
  const [stand, setStand] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  async function importeer(bestand: File) {
    setFout(null);
    try {
      setStand("Zip lezen…");
      const zip = unzipSync(new Uint8Array(await bestand.arrayBuffer()));
      const boekBestand = zip["boek.json"];
      if (!boekBestand) throw new Error("boek.json ontbreekt in de zip.");
      const boek = JSON.parse(strFromU8(boekBestand)) as { titel: string; inleiding: string; items: { titel: string; verhaal: string; plaat?: string }[] };

      setStand("Boek aanmaken…");
      const res = await fetch("/api/beheer/testboek", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(boek) });
      const data = (await res.json().catch(() => ({}))) as { id?: string; paginas?: string[]; fout?: string };
      if (!res.ok || !data.id || !data.paginas) throw new Error(data.fout ?? "Boek aanmaken mislukt.");

      for (const [i, item] of boek.items.entries()) {
        const plaat = item.plaat ? zip[item.plaat] : undefined;
        if (!plaat) continue;
        setStand(`Plaat ${i + 1} van ${boek.items.length} uploaden…`);
        const form = new FormData();
        form.append("pageId", data.paginas[i]);
        const type = item.plaat!.endsWith(".png") ? "image/png" : "image/jpeg";
        form.append("bestand", new Blob([plaat as BlobPart], { type }), item.plaat);
        const up = await fetch(`/api/beheer/orders/${data.id}/tekenplaat`, { method: "POST", body: form });
        if (!up.ok) throw new Error(((await up.json().catch(() => ({}))) as { fout?: string }).fout ?? `Plaat ${i + 1} uploaden mislukt.`);
      }
      setStand(null);
      router.push(`/beheer/${data.id}`);
    } catch (e) {
      setStand(null);
      setFout(e instanceof Error ? e.message : "Importeren mislukt.");
    }
  }

  return (
    <div className={b.knoppen}>
      <label className={b.knopLeeg} aria-disabled={!!stand}>
        {stand ?? "Testboek importeren (zip)"}
        <input
          type="file"
          accept=".zip,application/zip"
          hidden
          disabled={!!stand}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) importeer(f);
          }}
        />
      </label>
      {fout && (
        <span className={b.fout} role="alert">
          {fout}
        </span>
      )}
    </div>
  );
}
