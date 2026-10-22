import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase met de secret key: alleen op de server. De browser praat nooit
// rechtstreeks met Supabase; alle toegang loopt via onze eigen code, die
// eerst de persoonlijke code van de order controleert.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const ruweUrl = process.env.SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SECRET_KEY?.trim();
    if (!ruweUrl || !key) {
      throw new Error("SUPABASE_URL of SUPABASE_SECRET_KEY ontbreekt");
    }
    // Alleen het domein gebruiken: als er per ongeluk een pad meegeplakt is
    // (zoals /rest/v1/ of een slash), weigert Supabase het verzoek.
    let url: string;
    try {
      url = new URL(ruweUrl).origin;
    } catch {
      throw new Error("SUPABASE_URL is geen geldig adres");
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const buckets = {
  fotos: "fotos",
  tekenplaten: "tekenplaten",
  testen: "testen",
} as const;
