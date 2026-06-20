import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const email = process.argv[2];
  const action = process.argv[3] ?? "grant";

  if (!url || !key) {
    throw new Error("SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórias.");
  }
  if (!email || !["grant", "revoke"].includes(action)) {
    throw new Error(
      "Uso: set-admin-role -- email@dominio.com [grant|revoke]",
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;

  const user = data.users.find(
    (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!user) throw new Error(`Usuário não encontrado: ${email}`);

  const appMetadata = { ...(user.app_metadata ?? {}) };
  if (action === "grant") appMetadata.role = "admin";
  else delete appMetadata.role;

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { app_metadata: appMetadata },
  );
  if (updateError) throw updateError;

  console.log(
    action === "grant"
      ? `Acesso administrativo concedido a ${email}.`
      : `Acesso administrativo removido de ${email}.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
