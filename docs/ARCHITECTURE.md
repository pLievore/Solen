# ARCHITECTURE — Vendy

> Decisões técnicas, topologia, deploy e segurança. Versão 0.1.

---

## 1. Visão geral

```
                       ┌─────────────────────────────────────────┐
                       │                Navegador                 │
                       └───────────────┬─────────────────────────┘
                                       │ HTTPS
                  ┌────────────────────▼─────────────────────┐
                  │  FRONTEND — Next.js (App Router)          │   Deploy: Vercel (free)
                  │  • Site público SSR/SSG (SEO + blog)      │
                  │  • Painel /admin (CSR autenticado)        │
                  │  • SEM regra de negócio                   │
                  └───────┬───────────────────────┬──────────┘
                          │ REST (JSON)           │ ViaCEP (client-side)
                          ▼                       ▼
        ┌─────────────────────────────┐   https://viacep.com.br
        │  API — NestJS (TypeScript)   │   Deploy: Render/Fly.io (free)
        │  • Catálogo, preços, leads   │
        │  • Motor de precificação     │
        │  • Auth guard (JWT Supabase) │
        │  • Prisma ORM                │
        └───────┬──────────────┬───────┘
                │              │
                ▼              ▼
     ┌──────────────────┐  ┌──────────────────┐
     │ Supabase Postgres│  │ Supabase Storage │   (+ Supabase Auth p/ login admin)
     │  (dados)         │  │  (ícones/imagens)│
     └──────────────────┘  └──────────────────┘
                          │
                          ▼
                  WhatsApp (link wa.me) — aberto pelo frontend
```

---

## 2. Decisões e justificativas

### 2.1 Por que Next.js no frontend (e não Vite/SPA puro)?
O **objetivo nº 1 é captação via Google/SEO** e há um **blog** central na estratégia. Um SPA puro (Vite/CRA) renderiza no cliente e indexa mal. Next.js entrega **SSR/SSG/ISR**, meta tags por página, `sitemap`/`robots` e ótimos Core Web Vitals — tudo que SEO exige.

> A separação frontend/API pedida é **preservada**: o Next.js é só a **camada de apresentação** e **não contém regra de negócio** — ele consome a API. Sem acesso a banco no frontend.

### 2.2 Por que API separada em NestJS?
- Mantém a **separação frontend/API** solicitada.
- NestJS dá **estrutura** (módulos, DTOs, validação, guards) ideal para o painel CRUD e para isolar o **motor de precificação** num único lugar testável.
- Permite que o app cresça (ex.: futuras integrações, app mobile) consumindo a mesma API.

### 2.3 Por que Postgres (Supabase) e não MongoDB?
O domínio é **fortemente relacional**: Categoria → Modelo → Versão → preços por estado, perguntas atribuídas a versões (N:N), propostas referenciando versões. Postgres com Prisma modela isso com integridade referencial e migrations versionadas. O Supabase ainda entrega **Auth** e **Storage** prontos no mesmo free tier.

### 2.4 Monorepo (pnpm workspaces)
`apps/web`, `apps/api` e `packages/shared`. Deploys independentes (Vercel/Render), mas **contratos de tipos compartilhados** (DTOs + schemas Zod) evitam divergência entre front e back.

### 2.5 Autenticação do painel
**Supabase Auth** (e-mail/senha) para o admin. O frontend obtém o JWT; a API valida o JWT (chave do Supabase) num **Guard** do Nest. Rotas `/admin` e endpoints de escrita exigem sessão. MVP: um único papel `admin`.

---

## 3. Stack detalhada

| Camada | Tecnologia | Observações |
|--------|-----------|-------------|
| Frontend | Next.js (App Router), React, TypeScript | SSR/SSG para público; CSR para `/admin` |
| Estilo | Tailwind CSS + CSS variables (design tokens) | Tema branco/preto/verde retematizável |
| Componentes | shadcn/ui (ou similar headless) | Acessível e neutro |
| Formulários | React Hook Form + Zod | Validação compartilhada com a API |
| Backend | NestJS, TypeScript | Módulos por domínio |
| ORM | Prisma | Migrations versionadas |
| Banco | Supabase PostgreSQL | Connection pooling em produção |
| Auth | Supabase Auth | JWT validado na API |
| Storage | Supabase Storage | Bucket `catalog` (ícones/imagens) |
| Editor de blog | Editor rico (TipTap) → HTML/Markdown | Conteúdo salvo no Postgres |
| Validação | Zod (`packages/shared`) | Fonte única de verdade dos contratos |
| Testes | Vitest/Jest (unit) + Playwright (e2e do fluxo) | Foco no motor de preços e no fluxo de proposta |

---

## 4. Estrutura de pastas (alvo)

```
apps/web/
  src/
    app/
      (public)/                # home, seleção, avaliação, proposta, blog
      admin/                   # painel autenticado
      sitemap.ts, robots.ts
    components/
    lib/                       # cliente da API, helpers
    styles/tokens.css          # design tokens (tema)
apps/api/
  src/
    modules/
      catalog/                 # categories, models, variants
      pricing/                 # condition-states, detailed-states, quote engine
      evaluation/              # perguntas/fluxo
      proposals/               # leads + token + dashboard
      blog/                    # posts
      auth/                    # guard Supabase
      settings/
    prisma/
      schema.prisma
      migrations/
packages/shared/
  src/
    schemas/                   # Zod (catalog, quote, proposal, post)
    types/
```

---

## 5. Contratos de API (principais endpoints)

> Prefixo `/api`. Endpoints de escrita do catálogo/preços/blog exigem auth.

**Público**
- `GET  /catalog/categories` — categorias ativas (com ícones) para a home.
- `GET  /catalog/categories/:slug/models` — modelos da categoria.
- `GET  /catalog/models/:id/variants` — versões do modelo.
- `GET  /evaluation/variants/:id/questions` — perguntas (knockout + detalhadas) aplicáveis à versão + estados base.
- `POST /quote` — calcula a proposta. Body: `{ variantId, conditionStateId, answers[] }` → `{ value, isScrap, breakdown[] }`.
- `POST /proposals` — registra o lead. Body: quote + dados do vendedor → `{ token, whatsappUrl }`.
- `GET  /blog/posts` · `GET /blog/posts/:slug` — conteúdo publicado.

**Admin (autenticado)**
- `CRUD /admin/categories | /admin/models | /admin/variants`
- `PUT  /admin/variants/:id/prices` — preços base por estado.
- `CRUD /admin/detailed-states` + atribuição a versões.
- `CRUD /admin/evaluation-questions` (knockout).
- `GET  /admin/proposals` · `GET /admin/proposals/:id` · `PATCH /admin/proposals/:id` (status).
- `CRUD /admin/blog/posts`
- `GET/PUT /admin/settings`

> Schemas detalhados em `packages/shared`. Cálculo em [PRICING.md](PRICING.md).

---

## 6. Deploy

| Componente | Plataforma | Notas |
|-----------|-----------|-------|
| Frontend | **Vercel** | Conecta ao repo; build de `apps/web`. Gratuito. |
| API | **Render** (free web service) ou **Fly.io** | Atenção: free tier "dorme" após inatividade (cold start). Alternativa de upgrade barato quando houver tráfego. |
| Banco/Auth/Storage | **Supabase** | Projeto único; usar **connection pooling** (porta 6543) na API. |
| Migrations | Prisma | `prisma migrate deploy` no pipeline da API. |

**Ambientes:** `local` → `preview` (Vercel previews + branch) → `production`. Variáveis em `.env` (ver `.env.example`).

---

## 7. Segurança

- `SERVICE_ROLE_KEY` e `DATABASE_URL` **somente na API** — nunca no frontend (`NEXT_PUBLIC_*` é público).
- Validação de entrada com Zod no front **e** na API (defesa em profundidade).
- **Rate-limiting** em `POST /quote` e `POST /proposals` (anti-spam de leads).
- CORS restrito à origem do frontend.
- Guard de auth (JWT Supabase) em todas as rotas `/admin/*` e de escrita.
- Sanitização do HTML do blog (evitar XSS no conteúdo do editor).
- LGPD: finalidade declarada na coleta; dados pessoais mínimos; política de privacidade.

---

## 8. Tema / design tokens

Cores e estilos expostos como **CSS variables** em `styles/tokens.css` e mapeados no Tailwind. Trocar a identidade visual = editar tokens (ou os valores em Configurações), sem refatorar componentes.

```css
:root {
  --color-bg: #ffffff;      /* branco */
  --color-fg: #0a0a0a;      /* preto  */
  --color-brand: #16a34a;   /* verde  */
  --color-brand-fg: #ffffff;
  --radius: 0.75rem;
  /* tipografia, espaçamento, sombras... */
}
```
