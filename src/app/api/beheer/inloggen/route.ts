import { NextResponse } from "next/server";
import { BEHEER_COOKIE, COOKIE_DUUR, beheerToken, klopWachtwoord } from "@/lib/beheer";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const form = await request.formData().catch(() => null);
  const poging = form?.get("wachtwoord");

  if (typeof poging !== "string" || !klopWachtwoord(poging)) {
    // Vertraging tegen het raden van wachtwoorden.
    await new Promise((r) => setTimeout(r, 1500));
    return NextResponse.redirect(`${origin}/beheer/inloggen?fout=1`, 303);
  }

  const res = NextResponse.redirect(`${origin}/beheer`, 303);
  res.cookies.set(BEHEER_COOKIE, beheerToken()!, {
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_DUUR,
  });
  return res;
}
