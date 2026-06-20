import { PrismaClient } from "@prisma/client";

type RlsRow = {
  table_name: string;
  rls_enabled: boolean;
};

type GrantRow = {
  grantee: string;
  table_name: string;
  privilege_type: string;
};

async function main() {
  const prisma = new PrismaClient();
  try {
    const tables = await prisma.$queryRaw<RlsRow[]>`
      SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname
    `;
    const withoutRls = tables.filter((table) => !table.rls_enabled);
    if (withoutRls.length) {
      throw new Error(
        `RLS desabilitado: ${withoutRls.map((table) => table.table_name).join(", ")}`,
      );
    }

    const grants = await prisma.$queryRaw<GrantRow[]>`
      SELECT grantee, table_name, privilege_type
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND grantee IN ('anon', 'authenticated', 'PUBLIC')
      ORDER BY grantee, table_name, privilege_type
    `;
    if (grants.length) {
      throw new Error(
        `Grants públicos encontrados: ${grants
          .map((grant) => `${grant.grantee}:${grant.table_name}:${grant.privilege_type}`)
          .join(", ")}`,
      );
    }

    await prisma.proposal.count();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !publishableKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY são obrigatórias.",
      );
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/proposals?select=id&limit=1`,
      {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
      },
    );
    if (response.ok) {
      throw new Error(
        `A Data API pública ainda respondeu ${response.status} para proposals.`,
      );
    }

    console.log(
      `Segurança OK: ${tables.length} tabelas com RLS, sem grants públicos e Data API bloqueada (${response.status}).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
