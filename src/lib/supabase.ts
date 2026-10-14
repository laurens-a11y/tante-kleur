import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase met de secret key: alleen op de server. De browser praat nooit
// rechtstreeks met Supabase; alle toegang loopt via onze eigen code, die
// eerst de persoonlijke code van de order controleert.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL of SUPABASE_SECRET_KEY ontbreekt");
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
} as const;
