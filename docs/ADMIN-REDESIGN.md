# Admin redesign + Analytics — guia de continuação

Objetivo (pedido do dono): **deixar as páginas do `/admin` mais profissionais** e
**criar dashboards e análises das propostas por clusters que façam sentido**.
Mexer **somente** no admin (não tocar no site público).

Este doc permite outro agente continuar de onde paramos. Status no fim.

---

## Stack / onde fica o quê

- Front admin: `apps/web/src/app/admin/**` (Next 15 App Router, "use client", framer-motion, Tailwind).
- Helpers admin: `apps/web/src/lib/admin-api.ts` (fetch autenticado via Supabase), `apps/web/src/lib/ui.ts` (`cls` = classes Tailwind compartilhadas).
- API: NestJS em `apps/api/src`. Proposals em `apps/api/src/proposals/`.
  - `PrismaService` é global (injeta direto no construtor do controller, sem listar em `providers`).
  - Auth admin: `@UseGuards(SupabaseAuthGuard)` (de `../auth/auth.guard`).
- Deploy: Vercel (web) e Render (api) auto-deploy no push de `main`. Vercel builda `@vendy/shared` antes do web (`apps/web/vercel.json`).

## Dados disponíveis (tabela `proposals`, modelo Prisma em `apps/api/prisma/schema.prisma`)

Campos por proposta: `token`, `status` (NEW|CONTACTED|CLOSED|LOST), `isScrap`,
`calculatedValue` (centavos), `conditionStateId`, `answers` (JSON {knockout,detailed}),
`breakdown` (JSON), `sellerName`, `sellerWhatsapp`, `cep`, `city`, `neighborhood`,
`street`, `number`, `pickupPoint` (string legível, ex. "Estação Pinheiros — São Paulo/SP" ou "Envio pelos Correios"), `createdAt`.
Relação: `variant` → `model` → `category`.

Pontos de coleta em `packages/shared/src/schemas/proposal.ts` (`PICKUP_POINTS`).

---

## Clusters / análises que fazem sentido (escopo)

1. **KPIs topo**: total de leads, valor total em pipeline (soma `calculatedValue`),
   ticket médio, taxa de conversão (`CLOSED`/total), taxa de sucata (`isScrap`),
   leads nos últimos 7/30 dias + variação vs período anterior.
2. **Série temporal**: leads por dia (30 dias) — gráfico de barras/linha.
3. **Funil por status**: NEW → CONTACTED → CLOSED / LOST.
4. **Por categoria**: contagem + valor por categoria (iPhones, iPads, …).
5. **Top modelos**: modelos mais avaliados (ranking).
6. **Por ponto de coleta / região**: SP (Pinheiros/Morumbi) vs Ponta Grossa (Centro/Uvaranas) vs Correios → demanda geográfica.
7. **Faixas de valor (clusters de ticket)**: <R$300, R$300–700, R$700–1500, >R$1500 — contagem + conversão por faixa.
8. **Conversão por categoria e por faixa** (cruzamentos).

Tudo calculado **server-side** (groupBy/agregação no Postgres) e devolvido num único
endpoint para o dashboard. Filtro por período (?days=30 padrão; 7/30/90/365/all).

---

## Contrato do endpoint de analytics

`GET /api/admin/analytics?days=30` (auth). Resposta:

```ts
type Analytics = {
  range: { days: number | null; from: string | null };
  kpis: {
    totalLeads: number;
    pipelineValue: number;       // centavos, soma de todos
    wonValue: number;            // centavos, soma dos CLOSED
    avgTicket: number;           // centavos
    conversionRate: number;      // 0..1 (CLOSED / total)
    scrapRate: number;           // 0..1
    leadsCurrent: number;        // leads no range
    leadsPrev: number;           // range anterior (mesma janela)
    deltaPct: number | null;     // variação % vs anterior
  };
  timeseries: { date: string; count: number; value: number }[]; // por dia
  byStatus: { status: string; count: number; value: number }[];
  byCategory: { category: string; count: number; value: number }[];
  topModels: { model: string; category: string; count: number; value: number }[]; // top 8
  byPickup: { label: string; count: number }[];
  byValueBracket: { label: string; min: number; max: number | null; count: number; closed: number }[];
};
```

Implementação: `apps/api/src/proposals/admin-analytics.controller.ts`, registrar em
`proposal.module.ts` (controllers). Usar `prisma.proposal.groupBy` / `findMany` com
`where: { createdAt: { gte } }`. Para timeseries, buscar `createdAt,calculatedValue`
e agregar por dia em JS (volume baixo). Faixas de valor e pickup também em JS.

> Implementação atual: o endpoint carrega apenas os campos necessários da janela
> atual + anterior e agrega em memória. Isso é adequado para o volume atual. Se o
> volume crescer bastante, migrar as agregações principais para `groupBy`/SQL.

## Contrato da lista e exportação de propostas

`GET /api/admin/proposals` aceita:

- `status`, `token`, `category`, `model`, `pickup`;
- `days=7|30|90|365|all`;
- `minValue` e `maxValue` em centavos (`maxValue` é exclusivo);
- `sort=createdAt|calculatedValue`, `order=asc|desc`, `skip`, `take`.

Além de `items`, a resposta inclui:

```ts
{
  summary: {
    totalValue: number;
    avgTicket: number;
    closed: number;
    conversionRate: number;
  };
  filters: {
    categories: string[];
    pickupPoints: { value: string; label: string }[];
  };
}
```

`GET /api/admin/proposals/export` aceita os mesmos filtros (sem paginação) e
retorna `{ csv, filename, total }`. O CSV usa `;`, BOM UTF-8 e proteção básica
contra CSV injection.

`PATCH /api/admin/proposals/:id` altera o status e
`DELETE /api/admin/proposals/:id` exclui definitivamente a proposta.

---

## Front: o que construir

### Componentes de gráfico (sem dependência nova — SVG puro)
Criar `apps/web/src/app/admin/_components/charts.tsx` com:
- `<BarChart data>` (barras verticais, série temporal).
- `<Donut segments>` (status/categoria).
- `<StatCard title value sub trend>` (KPI com delta colorido).
- `<HBar rows>` (ranking horizontal: top modelos, pickup, faixas).
Paleta: usar tokens `brand` + neutros; manter consistente com o site.

### Páginas
- `/admin` → **Dashboard analítico** (substitui o grid de contagens atual):
  seletor de período, linha de StatCards, série temporal, funil/donut de status,
  ranking de categorias/modelos, pickup, faixas de valor. Consome `/admin/analytics`.
  Manter atalhos de gestão (cards de catálogo) num bloco secundário "Gestão".
- `/admin/proposals` → manter tabela, mas aplicar o visual novo (cards, chips de status já existem).

### Shell / visual profissional
- `apps/web/src/app/admin/layout.tsx`: sidebar agrupada (Operação: Painel, Propostas;
  Catálogo: Categorias, Modelos, Versões, Importar; Regras: Estados, Descontos, Knockout;
  Conteúdo: Blog; Sistema: Config), header com título da página + e-mail/sair,
  largura/contraste melhores. Marca "Vendy" com selo.
- `apps/web/src/lib/ui.ts` (`cls`): subir o nível visual de forma central (afeta todas as
  telas admin de uma vez): `card` com `rounded-xl shadow-sm bg-surface`, inputs `rounded-lg`,
  `th/td` com mais respiro. **Cuidado**: `cls` é usado em todas as páginas admin — mudança
  central propaga (bom), mas revisar telas densas (variants/models) após.

Adicionar entrada de navegação só se criar página nova (o dashboard fica no `/admin` que já existe).

---

## Convenções / cuidados
- Centavos → reais: `(c/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})`.
- Datas: `toLocaleDateString("pt-BR")`.
- Não adicionar libs de chart (peso/atrito no build). SVG puro.
- Commits em PT, terminar com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Antes de commit: `git status --short | grep -E '\.env'` deve sair vazio.
- Typecheck: `pnpm --filter @vendy/api exec tsc --noEmit` e `pnpm --filter @vendy/web exec tsc --noEmit`.
- Push em `main` → deploy automático. Endpoint novo precisa do redeploy da API (Render) — automático no push.

---

## STATUS (atualizar a cada avanço)

- [x] Doc criado.
- [x] API: `admin-analytics.controller.ts` (`GET /admin/analytics?days=`) + registrado em `proposal.module.ts`.
- [x] Front: `apps/web/src/app/admin/_components/charts.tsx` (StatCard, BarChart, Donut, HBar, Panel, helpers `brl`/`pct`/`PALETTE`).
- [x] Front: dashboard `/admin/page.tsx` refeito (seletor de período, KPIs, série temporal, status, categoria, top modelos, pickup, faixas de valor, bloco Gestão).
- [x] Shell: `layout.tsx` com sidebar agrupada + header com breadcrumb + nav mobile (select).
- [x] Visual central: `cls` em `lib/ui.ts` elevado (rounded-xl, shadow, foco).
- [x] Typecheck OK (api + web). Commit + push feitos.
- [x] Revisão visual das telas densas: grids responsivos, tabelas com overflow/painel,
  editor do blog em cards e ajustes mobile em variants/settings/import.
- [x] Banner LGPD oculto somente no `/admin` para não cobrir controles em telas pequenas.
- [x] `/admin/proposals` redesenhado com `Panel`, mini-KPIs, filtros por status,
  categoria, pickup, período e ordenação.
- [x] Drill-down do dashboard para status, categoria, modelo, pickup e faixa de valor.
- [x] Exportação CSV respeitando todos os filtros ativos.
- [x] Ações rápidas na lista: alterar status e excluir proposta sem abrir o detalhe.
- [x] Cache client-side do analytics por período (TTL de 5 minutos).
- [x] Validação real: builds API/web, typechecks, testes existentes e smoke test autenticado
  dos filtros/lista/export/analytics.

### Próximos passos opcionais

1. Gráfico de **valor por dia** (o endpoint já fornece `timeseries[].value`).
2. Migrar analytics para agregações SQL quando o volume justificar.
