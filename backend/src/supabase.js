import { createClient } from "@supabase/supabase-js";

export function createSupabaseClients({ url, anonKey, serviceRoleKey }) {
  const publicClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return { publicClient, adminClient };
}