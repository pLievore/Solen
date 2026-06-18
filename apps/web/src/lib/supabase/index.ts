import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase do navegador (login do painel).
 * Usa a publishable key (publica). NUNCA usar a secret key aqui.
 * As vars NEXT_PUBLIC_* sao inlined pelo Next no build.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY sao obrigatorias.",
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});
