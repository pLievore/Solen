import { createClient } from "@supabase/supabase-js";

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const apiBaseUrl = (
    process.env.AUTH_CHECK_API ??
    process.env.API_BASE_URL ??
    "http://localhost:3333"
  ).replace(/\/+$/, "");
  const expectedAdminCount = Number(process.env.EXPECTED_ADMIN_COUNT ?? "2");

  if (!supabaseUrl || !secretKey || !email || !password) {
    throw new Error(
      "SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórias.",
    );
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  const anonymousResponse = await fetch(`${apiBaseUrl}/api/admin/me`);
  const adminResponse = await fetch(`${apiBaseUrl}/api/admin/me`, {
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
    },
  });
  const adminBody = (await adminResponse.json()) as {
    user?: { role?: string };
  };

  if (anonymousResponse.status !== 401) {
    throw new Error(
      `Rota admin anônima respondeu ${anonymousResponse.status}; esperado 401.`,
    );
  }
  if (adminResponse.status !== 200 || adminBody.user?.role !== "admin") {
    throw new Error(
      `Rota admin autenticada respondeu ${adminResponse.status} sem papel admin.`,
    );
  }

  const { data: users, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;

  const adminCount = users.users.filter(
    (user) => user.app_metadata?.role === "admin",
  ).length;
  if (
    users.users.length !== expectedAdminCount ||
    adminCount !== expectedAdminCount
  ) {
    throw new Error(
      `Usuários/admins encontrados: ${users.users.length}/${adminCount}; esperado ${expectedAdminCount}/${expectedAdminCount}.`,
    );
  }

  console.log(
    `Auth OK: anônimo=401, admin=200 e ${adminCount}/${expectedAdminCount} usuários com papel admin.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
