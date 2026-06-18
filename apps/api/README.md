# @solen/api — Backend (NestJS)

API REST do Solen. Concentra **toda a regra de negócio**: catálogo, precificação, propostas/leads e blog.

- Stack: NestJS, TypeScript, Prisma.
- Banco/Auth/Storage: Supabase (Postgres).
- Módulos: `catalog`, `pricing`, `evaluation`, `proposals`, `blog`, `auth`, `settings`.

> A ser inicializado na **Fase 0**. Schema em [/docs/DATA-MODEL.md](../../docs/DATA-MODEL.md); cálculo em [/docs/PRICING.md](../../docs/PRICING.md).

## Dev (após Fase 0)
```bash
pnpm --filter @solen/api dev   # http://localhost:3333
```
