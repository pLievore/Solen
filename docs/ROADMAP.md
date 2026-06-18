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

**Entregáveis**
- [ ] Monorepo pnpm (`apps/web`, `apps/api`, `packages/shared`).
- [ ] `apps/api`: NestJS + Prisma + conexão Supabase Postgres (migration inicial vazia ok).
- [ ] `apps/web`: Next.js (App Router) + Tailwind + **design tokens** (branco/preto/verde) em `tokens.css`.
- [ ] `packages/shared`: setup do Zod e exports de tipos.
- [ ] Projeto Supabase criado (DB + Auth + bucket `catalog`).
- [ ] Auth: scaffold de login do admin (Supabase Auth) + Guard na API.
- [ ] CI básico: lint + typecheck.
- [ ] Deploy: web na **Vercel**, API em **Render/Fly** (health check respondendo).
- [ ] `.env.example` preenchido e documentado.

**Critério de aceite:** `pnpm dev:web` e `pnpm dev:api` sobem; home placeholder na Vercel consome `GET /health` da API; login admin autentica.

---

## Fase 1 — Catálogo & Precificação (Painel)
**Objetivo:** operador cadastra todo o catálogo e os preços **sem tocar no código**. (Pré-requisito do site público.)

**Entregáveis**
- [ ] Modelagem Prisma completa ([DATA-MODEL.md](DATA-MODEL.md)) + migrations + **seed** (8 categorias, 4 estados, perguntas do briefing, iPhone 11 de exemplo).
- [ ] API CRUD: `categories`, `models`, `variants` (com ordenação e ativo/inativo).
- [ ] Upload de ícones/imagens → Supabase Storage.
- [ ] API: `VariantPrice` (preços base por Versão × Estado) + `scrapPrice` por versão e `Setting scrap.defaultValue`.
- [ ] API: `DetailedState` (CRUD) + atribuição a versões (`VariantDetailedState`, com override).
- [ ] API: `KnockoutQuestion` (CRUD).
- [ ] Painel `/admin`: telas de Categorias, Modelos, Versões, Preços, Estados Detalhados, Perguntas eliminatórias.

**Critério de aceite:** dá para criar uma categoria → modelo → versão, definir os 4 preços, criar uma pergunta de desconto e atribuí-la à versão — tudo pela UI, refletindo no banco.

---

## Fase 2 — Site público & Fluxo de avaliação
**Objetivo:** o visitante navega da home até receber um **valor calculado**.

**Entregáveis**
- [ ] **Home:** headline "Venda seus usados" + grade de categorias com ícones (do catálogo).
- [ ] **Seleção em cascata:** Categoria → Modelo → Versão (dados da API).
- [ ] **Fluxo de avaliação:** Bloco 1 (knockout/chaves), Bloco 2 (estado/seleção), Bloco 3 (detalhados/chaves) + textos de ajuda ("como verificar").
- [ ] **Roteamento de sucata:** pergunta eliminatória → tela de sucata.
- [ ] **Motor de precificação na API** (`POST /quote`) + testes ([PRICING.md](PRICING.md)).
- [ ] Componentes de UI (chave seletora, check, seleção) sobre os design tokens; responsivo mobile-first.

**Critério de aceite:** percorrer o fluxo de ponta a ponta e ver o **valor correto** (igual ao exemplo do PRICING §3); cenário de sucata roteia certo.

---

## Fase 3 — Proposta, Lead & WhatsApp
**Objetivo:** transformar a cotação em **lead registrado** e levar ao WhatsApp.

**Entregáveis**
- [ ] **Tela de proposta:** valor grande em destaque + (opcional) breakdown + botão "Continuar".
- [ ] **Formulário do vendedor:** Nome, WhatsApp, CEP (**auto-preenchimento ViaCEP**), Cidade, Bairro, Rua, Número — com validação (Zod).
- [ ] API `POST /proposals`: gera **Token**, persiste a proposta (snapshot de respostas/breakdown/valor).
- [ ] **Redirecionamento WhatsApp:** link `wa.me` com mensagem personalizada + Token (template em Configurações).
- [ ] **Notificação por e-mail ao operador** a cada nova proposta (RF-16) — serviço gratuito (Resend/SMTP).
- [ ] Rate-limiting anti-spam nos endpoints públicos.

**Critério de aceite:** concluir uma avaliação gera um Token, grava o lead no banco, dispara e-mail ao operador e abre o WhatsApp com a mensagem certa.

---

## Fase 4 — Dashboard de propostas (Painel)
**Objetivo:** o operador vê e gerencia os leads.

**Entregáveis**
- [ ] `GET /admin/proposals` (lista + filtros) e `GET /admin/proposals/:id` (detalhe).
- [ ] Tela visual: Token, aparelho/versão, estado, valor, dados do vendedor, data.
- [ ] Tela de detalhe com **todas as respostas** da avaliação + breakdown.
- [ ] Status do lead (Novo / Em contato / Fechado / Perdido) via `PATCH`.
- [ ] (Opcional) busca por Token e ordenação por data/valor.

**Critério de aceite:** toda proposta criada na Fase 3 aparece no dashboard com todos os dados e Token; status editável.

---

## Fase 5 — Blog & SEO
**Objetivo:** ligar o motor de captação orgânica (objetivo nº 1 do briefing).

**Entregáveis**
- [ ] API CRUD de `Post` (rascunho/publicado) + upload de capa.
- [ ] Painel: editor rico (TipTap) com título, slug, resumo, conteúdo, **SEO title**, **meta description**, capa.
- [ ] Site público: índice do blog + página de post (**SSG/ISR**), URLs amigáveis.
- [ ] SEO técnico: meta tags por página, **Open Graph**, **`sitemap.xml`**, **`robots.txt`**, dados estruturados (Article/Organization).
- [ ] Otimização de imagens e Core Web Vitals.

**Critério de aceite:** publicar um post pelo painel o torna acessível por URL amigável, renderizado no servidor, presente no sitemap e com meta tags corretas.

---

## Fase 6 — Polimento, tema & lançamento
**Objetivo:** deixar pronto para produção e retematizável.

**Entregáveis**
- [ ] Configurações: WhatsApp, template de mensagem, **tokens de tema** e textos da home editáveis no painel.
- [ ] Revisão de responsividade e acessibilidade (contraste, teclado, labels).
- [ ] **Analytics** (GA4 ou Plausible) + eventos de conversão (proposta gerada, clique WhatsApp).
- [ ] Monitoramento de erros (Sentry free) e logs.
- [ ] Política de privacidade / aviso LGPD.
- [ ] QA fim a fim (Playwright no fluxo de proposta) + checklist de lançamento.
- [ ] Deploy de produção + domínio + verificação no Google Search Console.

**Critério de aceite:** site no ar no domínio final, fluxo completo funcionando, tema ajustável pelo painel, analytics e Search Console ativos.

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
5. ⏳ **Nome/domínio:** "Solen" provisório até a identidade final (não bloqueia).
6. ✅ **Estados base:** 4 fixos, só preço editável.

> Nada pendente bloqueia o início. A definição final de nome/domínio só é necessária na **Fase 6** (lançamento).
