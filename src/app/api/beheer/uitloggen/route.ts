import { NextResponse } from "next/server";
import { BEHEER_COOKIE } from "@/lib/beheer";

export async function POST(request: Request) {
  const res = NextResponse.redirect(`${new URL(request.url).origin}/beheer/inloggen`, 303);
  res.cookies.set(BEHEER_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
