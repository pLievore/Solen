import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase do navegador (login do painel).
 * Usa a publishable key (publica). NUNCA usar a secret key aqui.
 * As vars NEXT_PUBLIC_* sao inlined pelo Next no build.
 * Placeholders permitem que o build compile mesmo sem as vars configuradas;
 * o login falhara em runtime se as vars reais nao estiverem presentes.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "placeholder_key",
  { auth: { persistSession: true, autoRefreshToken: true } },
);
