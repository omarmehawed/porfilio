import "server-only";
import { createClient } from "@supabase/supabase-js";
import { hasServiceRole, supabaseUrl } from "@/lib/supabase/env";

export function createAdminClient() {
  if (!hasServiceRole()) {
    throw new Error("Supabase service role is not configured.");
  }
  return createClient(supabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
