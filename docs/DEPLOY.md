# DEPLOY — Vendy

> Frontend na **Vercel**, API no **Render**, banco no **Supabase**. Tudo em free tier.
> Pré-requisito: repositório no GitHub (ver README/§GitHub).

---

## 1. Supabase (já provisionado)
Projeto: `mkqukrnuutcmuenhewdh` (região us-east-2). Já tem schema migrado e seed.
Pegue no painel (Settings):
- `SUPABASE_URL`, publishable key e **secret key** (Data API / API Keys).
- `DATABASE_URL` (pooler, porta 6543) e `DIRECT_URL` (pooler, porta 5432) — Database > Connection string.

> Recomendado **rotacionar** as chaves usadas em dev antes de ir a produção.

---

## 2. API → Render (free)

**Opção A — Blueprint (recomendada):**
1. Render Dashboard → **New → Blueprint** → conecte o repo. O [`render.yaml`](../render.yaml) é detectado.
2. Preencha as variáveis marcadas como `sync:false`:
   - `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`
   - `WHATSAPP_PHONE`
   - `CORS_ORIGIN` = `https://www.vendybrasil.com,https://vendybrasil.com`
   - `RESEND_API_KEY` e `RESEND_FROM_EMAIL` (opcionais, para notificação)
3. Deploy. O start roda `prisma migrate deploy` (aplica migrations) e sobe a API.
4. Health atual: `https://solen-api.onrender.com/api/health` deve retornar
   `{"db":"up"}`.

**Notas do free tier:** o serviço **hiberna** após ~15 min sem tráfego (cold start de ~30–50s na 1ª requisição). Aceitável para MVP; subir de plano quando houver volume.

---

## 3. Frontend → Vercel (free)

1. Vercel → **Add New → Project** → importe o repo.
2. **Root Directory:** `apps/web`.
3. O [`apps/web/vercel.json`](../apps/web/vercel.json) já define install/build (compila o `@vendy/shared` antes do Next).
4. **Environment Variables:**
   - `NEXT_PUBLIC_API_BASE_URL` = URL da API no Render (ex.: `https://vendy-api.onrender.com`)
   - `NEXT_PUBLIC_SITE_URL` = `https://www.vendybrasil.com`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://mkqukrnuutcmuenhewdh.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = publishable key
5. Deploy.

> Depois de saber a URL da Vercel, atualize `CORS_ORIGIN` no Render para ela.

### Domínio

- `www.vendybrasil.com` é o domínio canônico.
- `vendybrasil.com` deve redirecionar com status 308 para `www`.
- No Vercel, adicionar ambos em **Settings → Domains**.
- Na HostGator, usar exatamente os registros A/CNAME indicados pelo Vercel.
- Remover registros antigos de estacionamento, redirecionamento ou hospedagem
  que disputem o domínio. O `www` deve apontar diretamente para o CNAME
  informado pelo Vercel, não para o domínio raiz.
- Com TTL `14400`, uma alteração pode levar até 4 horas para se propagar.
- Após trocar `NEXT_PUBLIC_SITE_URL`, fazer novo deploy para atualizar
  canonical, Open Graph, `robots.txt` e `sitemap.xml`.

---

## 4. Usuário admin
Crie o primeiro admin (uma vez), localmente ou via Supabase Dashboard (Authentication → Add user):

```bash
pnpm --filter @vendy/api create-admin -- seu-email@dominio.com SuaSenhaForte
```

Login do painel: `https://<site>/admin/login`.

O usuário precisa de `app_metadata.role = "admin"`. Consulte
[`SECURITY.md`](SECURITY.md).

---

## 5. Ordem recomendada
1. GitHub (push do repo).
2. Render (API) → obter URL da API.
3. Vercel (web) com `NEXT_PUBLIC_API_BASE_URL` apontando para o Render.
4. Atualizar `CORS_ORIGIN` no Render com a URL da Vercel.
5. Criar admin e validar `/admin/login`.
6. Executar `pnpm --filter @vendy/api security:check`.

---

## 6. CI
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) roda install + prisma generate + typecheck + lint + build (API e Web) em cada push/PR na `main`. Não toca no banco.
