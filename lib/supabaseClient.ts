import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Two clients, two trust levels:
 * - getServerSupabase(): service-role key, server-side only (API routes /
 *   server components). Bypasses RLS — never import this into a client
 *   component or expose the key to the browser.
 * - getBrowserSupabase(): anon key, safe for client components. Subject to
 *   the RLS policies in database/migrations/0009_row_level_security.sql.
 */

let serverClient: SupabaseClient | null = null;
let browserClient: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (serverClient) return serverClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (server-side only).");
  }
  serverClient = createClient(url, key, { auth: { persistSession: false } });
  return serverClient;
}

export function getBrowserSupabase(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  }
  browserClient = createClient(url, key);
  return browserClient;
}
