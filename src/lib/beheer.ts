import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Beheer is afgeschermd met één wachtwoord (BEHEER_WACHTWOORD in Vercel).
// Na inloggen krijgt de browser een cookie met een handtekening die van dat
// wachtwoord is afgeleid. Wijzig je het wachtwoord, dan is iedereen uitgelogd.

export const BEHEER_COOKIE = "tk_beheer";
export const COOKIE_DUUR = 60 * 60 * 24 * 30; // 30 dagen

function wachtwoord() {
  const w = process.env.BEHEER_WACHTWOORD?.trim();
  if (!w || w.length < 12) return null; // te kort wachtwoord = beheer staat uit
  return w;
}

export function beheerToken(): string | null {
  const w = wachtwoord();
  if (!w) return null;
  return createHmac("sha256", w).update("tante-kleur-beheer-v1").digest("base64url");
}

function gelijk(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function klopWachtwoord(poging: string): boolean {
  const w = wachtwoord();
  return !!w && gelijk(poging, w);
}

export function isGeldigToken(token: string | undefined | null): boolean {
  const verwacht = beheerToken();
  return !!verwacht && !!token && gelijk(token, verwacht);
}

/** Voor pagina's: stuurt door naar inloggen als je niet bent ingelogd. */
export async function vereisBeheer() {
  const token = (await cookies()).get(BEHEER_COOKIE)?.value;
  if (!isGeldigToken(token)) redirect("/beheer/inloggen");
}

/** Voor API-routes: true als het verzoek van een ingelogde beheerder komt. */
export function isBeheerVerzoek(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${BEHEER_COOKIE}=`))
    ?.slice(BEHEER_COOKIE.length + 1);
  return isGeldigToken(token ? decodeURIComponent(token) : null);
}
