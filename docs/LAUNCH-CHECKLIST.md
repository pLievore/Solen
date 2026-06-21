# Checklist de lançamento e operação

## Automatizado

- [x] CI com typecheck, lint, testes unitários, builds e Playwright.
- [x] Fluxo público validado até a escolha de entrega sem criar lead fictício.
- [x] Monitor de produção a cada 6 horas pelo GitHub Actions.
- [x] Verificação de API, banco, site, domínio, headers, robots e sitemap.
- [x] RLS, grants e autorização dos administradores verificáveis por script.

Comandos locais:

```bash
pnpm exec playwright install chromium # somente na primeira execução
pnpm e2e
pnpm monitor:production
pnpm --filter @vendy/api security:check
pnpm --filter @vendy/api auth:check
```

Falhas do monitor aparecem em **GitHub → Actions → Monitor de produção**. Para
receber e-mail, cada administrador deve manter habilitadas as notificações de
Actions do GitHub.

## Ações únicas do proprietário

### Supabase

- [ ] Authentication → Providers → Email → desativar
  **Allow new users to sign up**.
- [ ] Confirmar que existem somente os dois usuários conhecidos.
- [ ] Authentication → Audit Logs → revisar logins inesperados.

### Google

- [ ] Criar uma propriedade de domínio para `vendybrasil.com` no Search Console.
- [ ] Validar pelo registro TXT fornecido pelo Google na zona DNS da HostGator.
- [ ] Enviar `https://www.vendybrasil.com/sitemap.xml`.
- [ ] Criar uma propriedade GA4.
- [ ] Adicionar `NEXT_PUBLIC_GA_ID=G-...` na Vercel, ambiente Production.
- [ ] Fazer redeploy e aceitar analytics no banner para validar o Realtime.

### E-mail

- [ ] Verificar `vendybrasil.com` no Resend.
- [ ] Criar o remetente `propostas@vendybrasil.com`.
- [ ] Preencher `RESEND_API_KEY` e `RESEND_FROM_EMAIL` no Render.
- [ ] Preencher `notify_email` em `/admin/settings`.
- [ ] Criar uma proposta real controlada e confirmar o recebimento.

### Observabilidade e operação

- [ ] Criar projeto no Sentry e fornecer os DSNs de web e API para integração.
- [ ] Revisar juridicamente a política de privacidade.
- [ ] Exportar backup mensal das propostas enquanto o volume for pequeno.
- [ ] Revisar mensalmente falhas do CI, logs do Render e alertas do Supabase.

## Checklist após cada deploy relevante

- [ ] Abrir a home em uma janela anônima.
- [ ] Fazer uma avaliação completa sem enviar, conferindo valor e texto.
- [ ] Entrar no painel com os dois administradores.
- [ ] Conferir criação, mudança de status, exportação e exclusão de uma proposta
  de teste controlada.
- [ ] Executar `pnpm monitor:production`.
- [ ] Conferir se o workflow CI terminou verde.
