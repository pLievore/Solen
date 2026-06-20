# Segurança operacional — Vendy

## Modelo de acesso

- O site público consome somente a API NestJS.
- A Data API do Supabase não possui acesso às tabelas de negócio.
- Todas as tabelas do schema `public` usam RLS sem políticas públicas.
- Os papéis `anon` e `authenticated` não têm grants nas tabelas.
- A API usa conexão direta PostgreSQL pelo Prisma.
- Rotas `/api/admin/**` exigem usuário Supabase com
  `app_metadata.role = "admin"`.

## Administradores

Conceder acesso:

```bash
pnpm --filter @vendy/api set-admin-role -- email@dominio.com grant
```

Remover acesso:

```bash
pnpm --filter @vendy/api set-admin-role -- email@dominio.com revoke
```

Depois de mudar o papel, o usuário deve sair e entrar novamente no painel.

## Verificação do banco

```bash
pnpm --filter @vendy/api security:check
```

O comando confirma:

- RLS habilitado em todas as tabelas públicas;
- ausência de grants para `anon` e `authenticated`;
- acesso funcional pelo Prisma;
- bloqueio da tabela `proposals` pela publishable key.

Com a API local em execução, validar também o login e o papel dos dois
administradores:

```bash
pnpm --filter @vendy/api auth:check
```

O comando usa `ADMIN_EMAIL` e `ADMIN_PASSWORD` somente no ambiente local,
confirma que acesso anônimo recebe 401 e que todos os usuários esperados têm
`app_metadata.role = "admin"`.

## Configuração obrigatória no Supabase

Em **Authentication → Providers → Email**:

- desativar `Allow new users to sign up`;
- manter somente os usuários administrativos conhecidos;
- revisar periodicamente **Authentication → Audit Logs**.

Em **Database → Security Advisor**, executar novamente a auditoria após cada
migration de banco.

## Segredos

- `SUPABASE_SECRET_KEY`, `DATABASE_URL` e `DIRECT_URL`: somente Render/API.
- `ADMIN_EMAIL` e `ADMIN_PASSWORD`: somente ambiente local quando necessários;
  nunca no frontend/Vercel.
- `NEXT_PUBLIC_*`: são públicos por definição.

Após suspeita de exposição:

1. revogar sessões administrativas;
2. trocar senhas dos administradores;
3. rotacionar a secret key e credenciais PostgreSQL;
4. atualizar o Render;
5. executar `security:check`;
6. revisar Auth Audit Logs e logs da API.

## Rollback emergencial da migration de grants

O rollback abaixo deve ser usado somente para diagnóstico temporário. Ele
reabre a Data API e não deve permanecer em produção:

```sql
grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to anon, authenticated;
alter table public.proposals disable row level security;
```

O caminho normal de recuperação é corrigir a API/conexão Prisma, não reabrir as
tabelas.
