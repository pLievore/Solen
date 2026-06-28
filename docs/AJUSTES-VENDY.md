# Ajustes Site Vendy — plano e acompanhamento

Origem: PDF "Ajustes Site Vendy" (Rafael Casteli / Diretoria). Decisões do dono
registradas abaixo. Mexer só onde indicado; site público e painel.

## Decisões do dono
1. **Coleta a domicílio**: NÃO reexibir endereço no site — endereço é combinado pelo WhatsApp. (opção (b))
2. **Valor da proposta**: guardar histórico — preserva `calculatedValue` original e usa `overriddenValue` quando ajustado.
3. **Permissões**: papéis **admin** e **técnico**.
4. **Mídias da assistência**: bucket **privado**; vídeos com limite de **10s**; **retenção de 3 meses** (depois podem ser apagados por rotina).
5. Plano registrado neste doc.

## Convenções
- Centavos no banco; reais na UI (`Math.round(reais*100)`); exibir com `toLocaleString("pt-BR",{style:"currency",currency:"BRL"})`.
- Commits em PT, terminar com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Antes do commit: `git status --short | grep -E '\.env'` vazio.
- Typecheck: `pnpm --filter @vendy/api exec tsc --noEmit` e (em apps/web) `npx tsc --noEmit` (ignorar erros de `.next/types/.../proposta` — cache da página removida).
- Migrations: criar arquivo em `apps/api/prisma/migrations/<n>_<nome>/migration.sql` E aplicar na produção via script ts-node pontual (DIRECT_URL no `.env` raiz).
- Deploy automático no push (`main`): Vercel (web) e Render (api).

---

## FASE A — ganhos rápidos  ✅ FEITA (itens 1, 2, 3)

### 1. Alterar valor da proposta no DB  ✅
- Prisma: `Proposal.overriddenValue Int?` (+ migration `4_proposal_overridden_value`, aplicada na prod).
- API: `PATCH /admin/proposals/:id/value` body `{ value: number|null }` (centavos; null restaura).
- Front detalhe: card "Valor da proposta" (input em R$, Salvar, Restaurar original); cabeçalho mostra valor efetivo + original riscado.
- Lista: mostra `overriddenValue ?? calculatedValue` + selo "ajustado".
- Valor efetivo = `overriddenValue ?? calculatedValue`.
- Analytics: já usa o valor efetivo (pipeline, ticket, série, categorias, modelos, faixas) — helper `effective(r)` em `admin-analytics.controller`.

### 2. Coleta a domicílio grátis  ✅
- `PICKUP_POINTS` ganhou `domicilio` (+ `SPECIAL_PICKUP_IDS`). `pickupPointLabel` trata domicilio/correios.
- Tela de resultado (`/avaliacao`): card destacado "Coleta a domicílio · grátis" no topo das opções; agrupamento por cidade exclui domicilio e correios. Sem endereço (decisão 1b).

### 3. Mensagem cópia-e-cola (no detalhe da proposta)  ✅
- Card "Mensagem para o cliente" com **Copiar saudação** e **Copiar status** (clipboard + preview).
- Saudação: "Bom dia/Boa tarde/Boa noite" (pelo horário) + primeiro nome + texto fixo.
- Status: `📱 modelo` / estado (base.label) / valor base / cada desconto (label+valor) / Total / `💰 valor efetivo` / "Você pode falar sobre sua negociação agora?".
- Usa `breakdown` (base = estado, deltas = perguntas) e o valor efetivo.

---

## FASE B — conteúdo  ✅ FEITA

### 4. Página "passo a passo para coleta"  ✅
- Página estática `apps/web/src/app/coleta-passo-a-passo/page.tsx` (rota `/coleta-passo-a-passo`), diagramada (hero, callout, passos numerados, telas finais, CTA).
- Adicionada ao `sitemap.ts` (indexável).
- Linkada na tela de resultado (`/avaliacao`): "📋 Como preparar seu aparelho para a coleta".

---

## FASE C — Assistência Técnica + permissões  ⏳ PENDENTE (item grande, 3 sub-entregas)

Base já existente: `SupabaseAuthGuard` exige `app_metadata.role === "admin"`. `SupabaseService` tem a chave secreta (admin API). Upload atual: `storage/uploads.controller.ts` (imagem ≤5MB, bucket público `catalog`).

### C1. Perfis/permissões (RBAC)  ✅ FEITA
- `auth/roles.decorator.ts` (`@Roles("admin"|"tecnico")`); `SupabaseAuthGuard` lê o metadado via `Reflector` e, sem `@Roles`, exige `admin` (mantém todas as rotas existentes admin-only).
- `users/admin-users.controller.ts`: `GET /admin/me` (admin+tecnico), `GET /admin/users`, `POST /admin/users` (cria com papel), `PATCH /admin/users/:id/role` — via Supabase Admin API (service role).
- Front: página `/admin/permissoes` (criar usuário + trocar papel) e placeholder `/admin/assistencia`.
- `AdminShell`: busca `/admin/me`, gating por página (`canAccess`) — técnico só acessa `/admin/assistencia`, demais mostram "Seu perfil não tem permissão"; técnico é redirecionado de `/admin` para `/admin/assistencia`. Menu mostra todos os itens (conforme PDF).
- Papéis: `admin` (tudo), `tecnico` (só Assistência).

### C2. Cadastro de aparelhos em assistência  ✅ FEITA
- Prisma: `RepairDevice` (model, imageUrl foto inicial, technicianId/Email, accessNotes, priorDefects, services, status RECEBIDO|EM_REPARO|CONCLUIDO|ENTREGUE). Migration `5_repair_devices` aplicada na prod.
- API: `assistencia/repair-device.controller.ts` — `GET /admin/repair-devices` (admin: todos; técnico: só os seus, `@Roles admin,tecnico`), `GET/:id` (técnico só do próprio), `POST`/`PATCH`/`DELETE` (admin).
- Front: `/admin/assistencia` (lista, role-aware), `/admin/assistencia/novo` (form admin), `/admin/assistencia/[id]` (admin edita + exclui; técnico vê leitura). Form compartilhado `_DeviceForm.tsx` (foto via `uploadIcon`, seleção de técnico via `/admin/users` filtrado).
- Vínculo de técnico: `technicianId` (id Supabase) + `technicianEmail` (snapshot p/ exibição).

### C3. Mídias de comprovação + checklist
- Bucket **privado** novo (ex.: `assistencia`). Endpoint de upload de **vídeo** (≤10s, validar MIME/tamanho) e foto.
- Checklist por aparelho: Carcaça (vídeo 5s: frente ligada/verso/laterais), Biometria (Face/Touch), Câmeras (vídeo 10s: traseira/ultra wide/tele/frontal/flash), Energia (foto saúde da bateria), Botões (vídeo 5s: volume/power/ação 15Pro+/silêncio antigos).
- **Retenção 3 meses**: rotina (cron) que apaga objetos com >90 dias do bucket. Guardar `createdAt`/path para a limpeza.
- Atenção a custo de storage (vídeo). Limite 10s ajuda; considerar compressão no app.

---

## STATUS
- [x] Fase A (1, 2, 3) — implementada e no ar.
- [x] Analytics usando valor efetivo (negociado).
- [x] Fase B (4) — página passo a passo.
- [x] Fase C1 (permissões) — RBAC admin/técnico, página /admin/permissoes, gating.
- [x] Fase C2 (cadastro de aparelhos) — RepairDevice + páginas de assistência.
- [ ] Fase C3 (mídias + retenção)

> Próximo passo: Fase C3 — bucket privado `assistencia`, endpoint de upload de
> foto/vídeo (≤10s), checklist de comprovações por aparelho (carcaça, biometria,
> câmeras, energia, botões) e rotina de retenção (apagar >90 dias).
