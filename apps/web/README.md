# @vendy/web — Frontend (Next.js)

Camada de **apresentação** do Vendy. Site público (SSR/SSG para SEO + blog) e painel `/admin`.
**Não contém regra de negócio** — consome a API (`@vendy/api`).

- Stack: Next.js (App Router), React, TypeScript, Tailwind + design tokens.
- Deploy: Vercel.
- Tema (branco/preto/verde) via `src/styles/tokens.css`.

> A ser inicializado na **Fase 0** (ver [/docs/ROADMAP.md](../../docs/ROADMAP.md)).

## Dev (após Fase 0)
```bash
pnpm --filter @vendy/web dev   # http://localhost:3000
```
