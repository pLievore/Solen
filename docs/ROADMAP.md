# ROADMAP — Quebra em fases

> Plano de execução do MVP em fases incrementais. Versão 0.1.
> Cada fase entrega algo **funcional e demonstrável**. Estimativas são ordens de grandeza para 1 dev.

---

## Visão geral das fases

| Fase | Nome | Entrega central | Estimativa |
|-----:|------|-----------------|:----------:|
| **0** | Fundação & Setup | Monorepo, Supabase, deploy, tema | ~2–3 dias |
| **1** | Catálogo & Precificação (Admin) | Painel para cadastrar produtos e preços | ~4–6 dias |
| **2** | Site público & Fluxo de avaliação | Home → seleção → avaliação → cotação | ~4–6 dias |
| **3** | Proposta, Lead & WhatsApp | Valor + formulário + token + WhatsApp | ~3–4 dias |
| **4** | Dashboard de propostas (Admin) | Visualização e gestão dos leads | ~2–3 dias |
| **5** | Blog & SEO | CMS + páginas indexáveis + sitemap | ~3–5 dias |
| **6** | Polimento, tema & lançamento | Retematização, QA, analytics, deploy final | ~2–4 dias |

> **Ordem de valor:** Fases 0→3 já entregam a "máquina de leads" funcionando (fim a fim). Fase 4 dá visibilidade ao operador. Fase 5 liga o motor de SEO. Fase 6 prepara o lançamento.

```
MVP mínimo vendável = Fases 0,1,2,3,4   |   MVP completo do briefing = + Fase 5,6
```

---

## Fase 0 — Fundação & Setup
**Objetivo:** esqueleto rodando local e em deploy, com tema configurável.

**Entregáveis** — ✅ **concluída**
- [x] Monorepo pnpm (`apps/web`, `apps/api`, `packages/shared`).
- [x] `apps/api`: NestJS + Prisma + conexão Supabase Postgres. _(Fizemos o schema completo já aqui, não vazio.)_
- [x] `apps/web`: Next.js (App Router) + Tailwind + **design tokens** (branco/preto/verde) em `tokens.css`.
- [x] `packages/shared`: setup do Zod e exports de tipos.
- [x] Projeto Supabase criado (DB + Auth + bucket `catalog`).
- [x] Auth: scaffold de login do admin (Supabase Auth) + Guard na API. _(Testado ponta a ponta.)_
- [~] CI básico: lint + typecheck. _(workflow `.github/workflows/ci.yml` e eslint configurados; falta validar verde no GitHub.)_
- [x] Deploy: web na **Vercel**, API no **Render**.
- [x] `.env.example` preenchido e documentado.

**Critério de aceite:** `pnpm dev:web` e `pnpm dev:api` sobem; home consome `GET /health`; login admin autentica. ✅

---

## Fase 1 — Catálogo & Precificação (Painel)
**Objetivo:** operador cadastra todo o catálogo e os preços **sem tocar no código**. (Pré-requisito do site público.)

**Entregáveis** — ✅ **concluída**
- [x] Modelagem Prisma completa ([DATA-MODEL.md](DATA-MODEL.md)) + migrations + **seed** (7 categorias, 4 estados, perguntas do briefing, iPhone 11 de exemplo).
- [x] API CRUD: `categories`, `models`, `variants` (com ordenação e ativo/inativo) + leitura pública.
- [x] Upload de ícones/imagens → Supabase Storage.
- [x] API: `VariantPrice` (preços base por Versão × Estado) + `scrapPrice` por versão e `Setting scrap.defaultValue`.
- [x] API: `DetailedState` (CRUD) + atribuição a versões (`VariantDetailedState`). _(override existe no schema; UI usa deltas globais.)_
- [x] API: `KnockoutQuestion` (CRUD).
- [x] Painel `/admin`: telas de Categorias, Modelos, Versões, Preços, Estados Detalhados, Perguntas eliminatórias, Configurações.

**Critério de aceite:** dá para criar categoria → modelo → versão, definir os 4 preços, criar pergunta de desconto e atribuí-la à versão — tudo pela UI, refletindo no banco. ✅ _(verificado por smoke tests contra o Supabase)_

---

## Fase 2 — Site público & Fluxo de avaliação
**Objetivo:** o visitante navega da home até receber um **valor calculado**.

**Entregáveis** — ✅ **concluída**
- [x] **Home:** headline "Venda seus usados na hora" + grade de categorias com ícones (do catálogo, **SSR**).
- [x] **Seleção em cascata:** Categoria → Modelo → Versão (dados da API).
- [x] **Fluxo de avaliação:** Bloco 1 (knockout/chaves), Bloco 2 (estado/seleção), Bloco 3 (detalhados/chaves) + textos de ajuda.
- [x] **Roteamento de sucata:** pergunta eliminatória → tela de sucata.
- [x] **Motor de precificação na API** (`POST /quote`) + testes ([PRICING.md](PRICING.md)) — 4 testes passando.
- [x] Componentes de UI (chave seletora, check, seleção) sobre os design tokens; responsivo mobile-first.

**Critério de aceite:** fluxo de ponta a ponta com **valor correto** (exemplo do PRICING §3 = R$ 200,00 ✅); cenário de sucata roteia certo ✅. _(verificado por teste unitário + smoke do `/quote` ao vivo)_

---

## Fase 3 — Proposta, Lead & WhatsApp
**Objetivo:** transformar a cotação em **lead registrado** e levar ao WhatsApp.

**Entregáveis** — ✅ **concluída**
- [x] **Tela de proposta:** valor grande em destaque + breakdown na tela de resultado (`/avaliacao/[id]`).
- [x] **Formulário do vendedor:** Nome, WhatsApp, CEP (**auto-preenchimento ViaCEP**), Cidade, Bairro, Rua, Número — página `/proposta` com validação client-side.
- [x] API `POST /proposals`: gera **Token** (8 hex chars), persiste a proposta (snapshot de respostas/breakdown/valor).
- [x] **Redirecionamento WhatsApp:** link `wa.me` com mensagem personalizada + Token (template em `Setting whatsapp_message_template`).
- [x] **Notificação por e-mail ao operador** (RF-16) — via Resend; ativa somente se `RESEND_API_KEY` + `notify_email` configurados.
- [x] Rate-limiting anti-spam: `@nestjs/throttler` global (60 req/min por IP) + 5 req/min restrito em `POST /proposals`.

**Critério de aceite:** concluir uma avaliação gera um Token, grava o lead no banco, dispara e-mail ao operador (se configurado) e abre o WhatsApp com a mensagem certa. ✅

---

## Fase 4 — Dashboard de propostas (Painel)
**Objetivo:** o operador vê e gerencia os leads.

**Entregáveis** — ✅ **concluída**
- [x] `GET /admin/proposals` (lista + filtros) e `GET /admin/proposals/:id` (detalhe).
- [x] Tela visual: Token, aparelho/versão, estado, valor, dados do vendedor, data.
- [x] Tela de detalhe com **todas as respostas** da avaliação + breakdown.
- [x] Status do lead (Novo / Em contato / Fechado / Perdido) via `PATCH`.
- [x] Busca por Token e ordenação por data/valor.

**Critério de aceite:** toda proposta criada na Fase 3 aparece no dashboard com todos os dados e Token; status editável. ✅

---

## Fase 5 — Blog & SEO
**Objetivo:** ligar o motor de captação orgânica (objetivo nº 1 do briefing).

**Entregáveis** — ✅ **concluída**
- [x] API CRUD de `Post` (rascunho/publicado) — `AdminBlogController` + `PublicBlogController`.
- [x] Painel `/admin/blog`: lista, editor TipTap (negrito, itálico, H2/H3, listas, links), SEO title, meta description, capa, status.
- [x] Site público: `/blog` (ISR 60s) + `/blog/[slug]` (ISR 60s), URLs amigáveis.
- [x] SEO técnico: `metadata` por página (title, description, OpenGraph), `sitemap.ts`, `robots.ts`.
- [x] `@tailwindcss/typography` para renderização do HTML do post.

**Critério de aceite:** publicar um post pelo painel o torna acessível por URL amigável, renderizado no servidor, presente no sitemap e com meta tags corretas. ✅

---

## Fase 6 — Polimento, tema & lançamento
**Objetivo:** deixar pronto para produção e retematizável.

**Entregáveis** — ✅ **concluída** (núcleo)
- [x] Configurações no painel: WhatsApp, template de mensagem, `notify_email`, `scrap.defaultValue`, headline da home — todos editáveis sem deploy.
- [x] **Analytics GA4** — carregado somente após consentimento e quando
  `NEXT_PUBLIC_GA_ID` estiver configurado.
- [x] **Aviso LGPD** — banner com opções de aceitar ou recusar persistidas em
  `localStorage`.
- [x] SEO global: `metadataBase`, OG defaults, `robots` no root layout; `sitemap.xml` e `robots.txt` dinâmicos.
- [ ] Sentry / monitoramento de erros. _(pode adicionar após deploy)_
- [x] Política de privacidade `/privacidade` publicada. _(revisão jurídica ainda recomendada)_
- [ ] QA Playwright fim a fim + checklist de lançamento. _(pré-lançamento)_
- [x] Deploy de produção + domínio `www.vendybrasil.com`.
- [ ] Confirmar propagação do redirecionamento de `vendybrasil.com` para `www`.
- [ ] Google Search Console e envio do sitemap.
- [x] RLS/grants fechados no Supabase + autorização por papel administrativo.

**Critério de aceite:** tema ajustável pelo painel ✅, consentimento de analytics
✅, LGPD ✅, SEO técnico ✅, deploy e domínio ✅.

---

## Dependências entre fases

```
0 ──> 1 ──> 2 ──> 3 ──> 4
            │
            └──> 5 (pode correr em paralelo após a Fase 1/2)
0..5 ──> 6
```

- Fase 1 é pré-requisito de 2, 4 e 5 (precisa do modelo de dados).
- Fase 2 depende de 1 (catálogo + preços).
- Fase 5 (blog) pode iniciar em paralelo assim que a base (0/1) existir.

---

## Decisões travadas (ver [SPEC §10](SPEC.md))
1. ✅ **Sucata:** valor fixo por versão (`scrapPrice`) + fallback global.
2. ✅ **Deltas:** globais no MVP (override por versão fica para o futuro).
3. ✅ **"Já aberto para manutenção?":** desconta (Estado Detalhado com delta).
4. ✅ **Notificação:** e-mail ao operador a cada nova proposta (RF-16, Fase 3).
5. ✅ **Nome/domínio:** Vendy em `vendybrasil.com`.
6. ✅ **Estados base:** 4 fixos, só preço editável.

> O produto está publicado; os itens restantes são operação, monitoramento e
> aquisição orgânica.
