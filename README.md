# Vendy — Site de compra de usados

Site de captação de leads para **compra de eletrônicos usados** (iPhones, Apple Watch, iPads, AirPods, acessórios, consoles e colecionáveis — usados, quebrados ou seminovos).

O site funciona como uma **máquina de aquisição de leads**: o vendedor seleciona o aparelho, responde a um fluxo de avaliação, recebe uma **proposta de valor calculada automaticamente** e é encaminhado ao **WhatsApp** com um **token** de identificação. Todas as propostas ficam registradas num **dashboard**. Todo o catálogo, preços e conteúdo de blog (SEO) são **gerenciáveis por um painel administrativo**, sem mexer no código.

> Direção visual provisória: **branco / preto / verde**, montada sobre _design tokens_ para retematização fácil quando a identidade visual final existir.

---

## 📚 Documentação

| Documento | Conteúdo |
|-----------|----------|
| [docs/SPEC.md](docs/SPEC.md) | Especificação funcional completa (o quê e por quê) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, decisões técnicas, deploy e segurança |
| [docs/DATA-MODEL.md](docs/DATA-MODEL.md) | Entidades, relacionamentos e schema |
| [docs/PRICING.md](docs/PRICING.md) | Motor de precificação, regras de sucata e cálculo da proposta |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Quebra em **fases** com entregáveis e critérios de aceite |

**Comece por aqui:** [docs/SPEC.md](docs/SPEC.md) → [docs/ROADMAP.md](docs/ROADMAP.md).

---

## 🏗️ Estrutura do repositório

```
vendy/
├── apps/
│   ├── web/          # Frontend — Next.js (App Router). SEO/SSR + painel admin. Só consome a API.
│   └── api/          # Backend — NestJS. Toda a regra de negócio (catálogo, preços, propostas).
├── packages/
│   └── shared/       # Tipos e schemas (Zod) compartilhados entre web e api.
├── docs/             # Especificação e planejamento.
└── Briefing e Ux site.pdf
```

Monorepo com **pnpm workspaces** — frontend e API permanecem desacoplados (deploys independentes), mas compartilham contratos de tipos.

## 🧰 Stack

- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind → deploy na **Vercel** (gratuito)
- **Backend:** NestJS + TypeScript + Prisma → deploy em serviço gratuito (Render/Fly.io)
- **Banco / Auth / Storage:** **Supabase** (PostgreSQL + Auth + Storage)
- **Integrações:** WhatsApp (link `wa.me`), ViaCEP (auto-preenchimento de endereço)

> Por que Next.js no frontend mesmo com API separada? O objetivo nº 1 do projeto é **captação via Google/SEO**. Next.js entrega SSR/SSG (essencial para indexação e para o blog), enquanto **toda a lógica continua na API**. Detalhes em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 🚀 Setup (após Fase 0)

```bash
pnpm install
cp .env.example .env   # preencha as variáveis (Supabase, WhatsApp, etc.)
pnpm dev:api           # sobe a API   (http://localhost:3333)
pnpm dev:web           # sobe o site  (http://localhost:3000)
```

## 📌 Status

🟡 **Planejamento** — estrutura e especificação criadas. Implementação começa pela **Fase 0** ([docs/ROADMAP.md](docs/ROADMAP.md)).
