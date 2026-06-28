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
- PENDÊNCIA conhecida: o **analytics** (`admin-analytics.controller`) ainda soma `calculatedValue`. Se quiser pipeline pelo valor negociado, trocar lá depois.

### 2. Coleta a domicílio grátis  ✅
- `PICKUP_POINTS` ganhou `domicilio` (+ `SPECIAL_PICKUP_IDS`). `pickupPointLabel` trata domicilio/correios.
- Tela de resultado (`/avaliacao`): card destacado "Coleta a domicílio · grátis" no topo das opções; agrupamento por cidade exclui domicilio e correios. Sem endereço (decisão 1b).

### 3. Mensagem cópia-e-cola (no detalhe da proposta)  ✅
- Card "Mensagem para o cliente" com **Copiar saudação** e **Copiar status** (clipboard + preview).
- Saudação: "Bom dia/Boa tarde/Boa noite" (pelo horário) + primeiro nome + texto fixo.
- Status: `📱 modelo` / estado (base.label) / valor base / cada desconto (label+valor) / Total / `💰 valor efetivo` / "Você pode falar sobre sua negociação agora?".
- Usa `breakdown` (base = estado, deltas = perguntas) e o valor efetivo.

---

## FASE B — conteúdo  ⏳ PENDENTE

### 4. Página "passo a passo para coleta"
- Página estática própria no site (sugestão de rota: `/coleta-passo-a-passo`), bem diagramada (não via blog do DB).
- Conteúdo já está no PDF (remover iCloud/formatar; passos 1..6 de configuração sem iCloud/senha; enviar fotos ao avaliador).
- Linkar dela: na tela de resultado e na mensagem "status" (opcional).

---

## FASE C — Assistência Técnica + permissões  ⏳ PENDENTE (item grande, 3 sub-entregas)

Base já existente: `SupabaseAuthGuard` exige `app_metadata.role === "admin"`. `SupabaseService` tem a chave secreta (admin API). Upload atual: `storage/uploads.controller.ts` (imagem ≤5MB, bucket público `catalog`).

### C1. Perfis/permissões (RBAC)
- Estender auth: decorator `@Roles("admin"|"tecnico")` + guard que lê `app_metadata.role`.
- Página admin "Permissões": admin lista usuários e troca o role (via Supabase Admin API: `auth.admin.updateUserById(id, { app_metadata: { role }})`).
- Gating no menu (`AdminShell`): itens aparecem; ao acessar sem permissão → "seu perfil não tem permissão".
- Técnico só enxerga a página de Assistência.

### C2. Cadastro de aparelhos em assistência
- Prisma: `RepairDevice` (foto inicial, técnico vinculado, defeitos prévios, serviços a realizar, status, createdAt). Técnico = usuário com role `tecnico` (ou tabela própria).
- CRUD no painel (página "Aparelhos em Assistência Técnica").

### C3. Mídias de comprovação + checklist
- Bucket **privado** novo (ex.: `assistencia`). Endpoint de upload de **vídeo** (≤10s, validar MIME/tamanho) e foto.
- Checklist por aparelho: Carcaça (vídeo 5s: frente ligada/verso/laterais), Biometria (Face/Touch), Câmeras (vídeo 10s: traseira/ultra wide/tele/frontal/flash), Energia (foto saúde da bateria), Botões (vídeo 5s: volume/power/ação 15Pro+/silêncio antigos).
- **Retenção 3 meses**: rotina (cron) que apaga objetos com >90 dias do bucket. Guardar `createdAt`/path para a limpeza.
- Atenção a custo de storage (vídeo). Limite 10s ajuda; considerar compressão no app.

---

## STATUS
- [x] Fase A (1, 2, 3) — implementada, typecheck OK. **Falta commit/push.**
- [ ] Fase B (4)
- [ ] Fase C1 (permissões)
- [ ] Fase C2 (cadastro de aparelhos)
- [ ] Fase C3 (mídias + retenção)

> Próximo passo sugerido: commit/push da Fase A; depois Fase B (página passo a passo).
