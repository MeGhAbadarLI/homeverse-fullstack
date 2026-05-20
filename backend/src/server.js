import "dotenv/config";
import { getEnv } from "./env.js";
import { createSupabaseClients } from "./supabase.js";
import { createApp } from "./app.js";

const env = getEnv();
const { publicClient, adminClient } = createSupabaseClients({
  url: env.SUPABASE_URL,
  anonKey: env.SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY
});

const app = createApp({
  publicClient,
  adminClient,
  corsOrigin: env.CORS_ORIGIN
});

app.listen(env.PORT, () => {
  console.log(`Backend API running on port ${env.PORT}`);
});