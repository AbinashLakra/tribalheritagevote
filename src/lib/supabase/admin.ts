import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client using the service role key.
 *
 * ⚠️  CRITICAL SECURITY: This client bypasses Row Level Security.
 * It must ONLY be used in server-side code (API routes, server actions).
 * NEVER import this module in a client component or expose it to the browser.
 *
 * The service role key grants full database access and must never
 * appear in any NEXT_PUBLIC_* environment variable.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. " +
        "The admin client can only be used server-side with the service role key configured."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

