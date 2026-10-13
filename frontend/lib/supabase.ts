/**
 * Browser Supabase client for authentication and session tokens.
 */
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (
  typeof window !== "undefined" &&
  (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
) {
  console.warn(
    "Missing Supabase environment variables. Copy .env.example to .env.local and fill in values."
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
