/**
 * Cria (ou atualiza) o usuario admin do painel no Supabase Auth.
 * Uso:
 *   pnpm --filter @vendy/api create-admin -- email@dominio.com SenhaForte123
 * ou via env: ADMIN_EMAIL / ADMIN_PASSWORD
 */
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Defina SUPABASE_URL e SUPABASE_SECRET_KEY no .env");
  }

  const email = process.argv[2] ?? process.env.ADMIN_EMAIL;
  const password = process.argv[3] ?? process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Informe email e senha: create-admin -- email@dominio.com SenhaForte123",
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  // tenta criar; se ja existir, apenas confirma o email
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "admin" },
  });

  if (error) {
    if (/already.*registered|exists/i.test(error.message)) {
      console.log(`Usuario ${email} ja existe. Nada a fazer.`);
      return;
    }
    throw error;
  }

  console.log(`Admin criado: ${data.user?.email} (id ${data.user?.id})`);
}

main().catch((e) => {
  console.error("Erro:", e.message ?? e);
  process.exit(1);
});
