# DEPLOY — Solen

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
   - `CORS_ORIGIN` = URL pública do site (ex.: `https://solen.vercel.app`)
3. Deploy. O start roda `prisma migrate deploy` (aplica migrations) e sobe a API.
4. Health: `https://solen-api.onrender.com/api/health` deve retornar `{"db":"up"}`.

**Notas do free tier:** o serviço **hiberna** após ~15 min sem tráfego (cold start de ~30–50s na 1ª requisição). Aceitável para MVP; subir de plano quando houver volume.

---

## 3. Frontend → Vercel (free)

1. Vercel → **Add New → Project** → importe o repo.
2. **Root Directory:** `apps/web`.
3. O [`apps/web/vercel.json`](../apps/web/vercel.json) já define install/build (compila o `@solen/shared` antes do Next).
4. **Environment Variables:**
   - `NEXT_PUBLIC_API_BASE_URL` = URL da API no Render (ex.: `https://solen-api.onrender.com`)
   - `NEXT_PUBLIC_SITE_URL` = URL final do site
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://mkqukrnuutcmuenhewdh.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = publishable key
5. Deploy.

> Depois de saber a URL da Vercel, atualize `CORS_ORIGIN` no Render para ela.

---

## 4. Usuário admin
Crie o primeiro admin (uma vez), localmente ou via Supabase Dashboard (Authentication → Add user):

```bash
pnpm --filter @solen/api create-admin -- seu-email@dominio.com SuaSenhaForte
```

Login do painel: `https://<site>/admin/login`.

---

## 5. Ordem recomendada
1. GitHub (push do repo).
2. Render (API) → obter URL da API.
3. Vercel (web) com `NEXT_PUBLIC_API_BASE_URL` apontando para o Render.
4. Atualizar `CORS_ORIGIN` no Render com a URL da Vercel.
5. Criar admin e validar `/admin/login`.

---

## 6. CI
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) roda install + prisma generate + typecheck + lint + build (API e Web) em cada push/PR na `main`. Não toca no banco.
