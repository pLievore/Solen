# SPEC — Vendy (Site de compra de usados)

> Especificação funcional do produto. Derivada do `Briefing e Ux site.pdf`.
> Versão: 0.1 · Status: rascunho para validação.

---

## 1. Visão e objetivo

Criar um site próprio para **captação de pessoas interessadas em vender** iPhones, smartphones, consoles, jogos, Apple Watch, iPads e outros eletrônicos **usados, quebrados ou seminovos**.

O site é uma **máquina de aquisição de leads**, com dois focos centrais:

1. **Captação via Google/SEO** — incluindo um **blog gerenciável por painel** para produzir conteúdo (ex.: "Como vender meu iPhone 11 rápido", "Vale a pena vender meu iPhone usado?", "Quanto vale um iPhone 11 com tela quebrada").
2. **Conversão via fluxo de avaliação** — o visitante seleciona o aparelho, responde perguntas sobre o estado, recebe uma **proposta com valor calculado** e é levado ao **WhatsApp** para fechar negócio.

### Princípio condutor (do briefing)
> "Reduzir a carga de criação direto no código para tornar mais fácil a realização do MVP e a manutenção futura."

Tudo que muda com frequência — **catálogo, preços, perguntas de avaliação e conteúdo de blog** — deve ser **configurável pelo painel administrativo**, sem deploy de código.

### Direção visual
- Paleta base: **branco, preto e verde**.
- Identidade visual final virá depois → a UI deve usar **design tokens** (cores, tipografia, espaçamento, raio) para **retematização fácil**.

---

## 2. Personas

| Persona | Descrição | Necessidade |
|--------|-----------|-------------|
| **Vendedor (visitante)** | Pessoa que quer vender um eletrônico usado. Chega via Google ou anúncio. | Descobrir rápido **quanto vale** seu aparelho e falar com a loja sem fricção. |
| **Operador / Admin (dono)** | Quem opera o negócio. | Cadastrar produtos/preços, gerir perguntas de avaliação, publicar conteúdo de blog e **acompanhar as propostas recebidas**. |

---

## 3. Mapa de navegação

```
SITE PÚBLICO                                  PAINEL ADMIN (/admin, autenticado)
────────────                                  ─────────────────────────────────
Home                                          Login
 └─ Seleção de aparelho                        Dashboard de propostas (leads)
     (Categoria → Modelo → Versão)             Catálogo
        └─ Fluxo de avaliação                    ├─ Categorias
            ├─ (atalho) Avaliação de sucata      ├─ Modelos
            └─ Proposta gerada                   └─ Versões
                └─ Dados do vendedor            Precificação
                    └─ WhatsApp (com token)       ├─ Preços base (Versão × Estado)
                                                  └─ Estados Detalhados (perguntas + deltas)
Blog (índice + posts)                          Perguntas de avaliação (fluxo)
Páginas de conteúdo (SEO)                       Blog (posts)
                                                Configurações (WhatsApp, tema, textos)
```

---

## 4. Fluxo público (jornada do vendedor)

### 4.1 Home
- **Headline:** "Venda seus usados".
- **Opções com ícones dos produtos** (vêm do catálogo, configuráveis): iPhones · Apple Watches · iPads · AirPods · Acessórios e periféricos · Consoles · Colecionáveis.
- Clique em um produto → abre a seleção daquela categoria.
- _Requisito:_ o admin pode **adicionar/editar/reordenar** as categorias exibidas, com seus ícones.

### 4.2 Seleção de aparelho (Categoria → Modelo → Versão)
Seleção em cascata, baseada na hierarquia de catálogo:

```
[ Categoria (produtos) ]  →  [ Modelo (aparelhos) ]  →  [ Versão (modelo + especificação) ]
   ex.: iPhones                 ex.: iPhone 11             ex.: iPhone 11 64GB
```

- **Categoria/Produto:** iPhones, iPads, Consoles, Jogos, Apple Watches, AirPods, Acessórios, Colecionáveis…
- **Modelo/Aparelho:** iPhone 11, iPhone 12, iPad 9th, Apple Watch Series 9, PlayStation 5…
- **Versão:** Modelo + **Especificação** (Armazenamento + Tecnologias + Diferenciação entre modelos). Ex.: "iPhone 11 64GB", "iPad 9th Wi-Fi 64GB".
- _Requisito:_ toda a árvore é gerenciável pelo painel (ver §6). Comportamento aditivo/dedutivo ("+/–") = adicionar/remover itens em cada nível.

### 4.3 Fluxo de avaliação
Perguntas apresentadas com **chave seletora (Não/Sim)**, **check** ou **seleção**. Organizado em 3 blocos:

**Bloco 1 — Perguntas eliminatórias (knockout):** chave seletora individual.
- "O aparelho liga?" → se **Não** → vai direto para **Avaliação de sucata**.
- "O aparelho é bloqueado?" → se **Sim** → vai direto para **Avaliação de sucata**.

**Bloco 2 — Estado do aparelho (seleção única, check):** define o **preço base**.
- [ ] Novo/lacrado
- [ ] Seminovo sem marcas de uso
- [ ] Usado com marcas de uso leves
- [ ] Usado com marcas de uso fortes

**Bloco 3 — Estados detalhados (chaves seletoras):** aplicam **descontos** ao preço base.
- "A bateria está acima de 85%?"
- "A tela do aparelho está em perfeito funcionamento?"
- "As câmeras funcionam perfeitamente?"
- "O Face ID funciona?"
- "O aparelho tem alguma restrição?"
- "O aparelho possui alguma mensagem de peça desconhecida?" → com auxílio **"como verificar"** (texto de ajuda).
- "O aparelho já foi aberto para manutenção?"

> O conjunto de perguntas do Bloco 3 (texto, ajuda, deltas de preço) é **configurável** e **atribuível por versão** (ver §6 e [PRICING.md](PRICING.md)).

### 4.4 Avaliação de sucata
Caminho alternativo acionado por uma pergunta eliminatória. Mostra uma avaliação de sucata (valor reduzido) em vez do fluxo completo. Regra de valor: configurável (ver [PRICING.md](PRICING.md), §"Sucata").

### 4.5 Proposta gerada
- Calcula o valor com base nas respostas e exibe ao usuário.
- **Valor grande em destaque** + botão **"Continuar"** (→ enviar proposta para o WhatsApp).
- Antes de abrir a conversa, **solicitar dados do vendedor**:
  - Nome
  - WhatsApp
  - CEP (se possível, **auto-preencher** endereço via ViaCEP)
  - Cidade
  - Bairro
  - Rua e número
- Ao continuar:
  1. **Gerar um Token** que identifica a proposta.
  2. **Registrar** a proposta no dashboard (todas as respostas + dados + Token).
  3. Abrir o WhatsApp com **mensagem personalizada** pré-preenchida: informando que o usuário acabou de realizar a avaliação **nº {Token}**.

---

## 5. Requisitos funcionais (resumo)

| # | Requisito | Origem |
|---|-----------|--------|
| RF-01 | Home com headline e grade de categorias com ícones | Pág. 1 |
| RF-02 | Seleção em cascata Categoria → Modelo → Versão | Pág. 2 |
| RF-03 | Catálogo 100% gerenciável via painel (CRUD + ordenação + ícones) | Pág. 1–2 |
| RF-04 | Fluxo de avaliação em 3 blocos (knockout, estado, detalhados) | Pág. 3–4 |
| RF-05 | Regras eliminatórias → avaliação de sucata | Pág. 3 |
| RF-06 | Preço base por Versão × Estado, editável via painel | Pág. 4 |
| RF-07 | Estados Detalhados (perguntas) com deltas, criáveis/editáveis e **atribuíveis por versão** | Pág. 4–5 |
| RF-08 | Cálculo e exibição da proposta (valor em destaque) | Pág. 5 |
| RF-09 | Formulário de dados do vendedor + ViaCEP | Pág. 5 |
| RF-10 | Geração de Token único por proposta | Pág. 6 |
| RF-11 | Redirecionamento ao WhatsApp com mensagem + Token | Pág. 5–6 |
| RF-12 | Dashboard de propostas (visual, com todos os dados + Token) | Pág. 6 |
| RF-13 | Blog/CMS gerenciável via painel para conteúdo de SEO | Pág. 1 |
| RF-14 | Autenticação do painel administrativo | Implícito |
| RF-15 | Tema configurável (design tokens) para retematização | Pág. 1 |
| RF-16 | Notificar o operador por e-mail a cada nova proposta | Decisão §10.4 |

---

## 6. Painel administrativo (o "cérebro" configurável)

O painel é o que dá autonomia ao operador. Áreas:

### 6.1 Catálogo
- **Categorias:** nome, slug, ícone (upload), ordem, ativo.
- **Modelos:** vinculados a uma categoria; nome, slug, imagem, ordem, ativo.
- **Versões:** vinculadas a um modelo; nome/especificação (armazenamento, tecnologias, diferenciação), slug, ativo.

### 6.2 Precificação
- **Preços base:** para cada **Versão**, definir o preço de cada **Estado** (Novo/lacrado, Seminovo, Usado leve, Usado forte). _Estados base só têm o preço editável — não se criam novos._
- **Estados Detalhados (perguntas de desconto):** criar/editar/excluir perguntas, seu **texto**, **ajuda** ("como verificar"), e os **deltas** por resposta (ex.: bateria "Não" = −R$100). **Atribuir** quais estados detalhados se aplicam a cada Versão.

### 6.3 Perguntas eliminatórias (knockout)
- Configurar perguntas que levam à sucata (texto + resposta que dispara o atalho).

### 6.4 Dashboard de propostas (leads)
- Lista visual de todas as propostas: Token, aparelho/versão, estado, valor calculado, dados do vendedor, data, status (Novo/Em contato/Fechado/Perdido). Filtro e tela de detalhe.

### 6.5 Blog / CMS
- CRUD de posts: título, slug, conteúdo (editor rico), imagem de capa, resumo, **SEO title**, **meta description**, status (rascunho/publicado), data de publicação.

### 6.6 Configurações
- Número de WhatsApp, modelo da mensagem (com placeholder de Token/valor/aparelho), **tokens de tema** (cores branco/preto/verde e variáveis), textos da home.

---

## 7. Requisitos não-funcionais

- **SEO:** SSR/SSG para páginas públicas e blog; `sitemap.xml`, `robots.txt`, meta tags, dados estruturados (Schema.org), URLs amigáveis (slugs), bom Core Web Vitals.
- **Performance:** imagens otimizadas, lazy-loading de ícones.
- **Responsividade:** mobile-first (a maioria dos vendedores chega pelo celular).
- **Acessibilidade:** contraste adequado, navegação por teclado, labels nos campos.
- **Segurança:** painel autenticado; chaves de serviço só no backend; validação de entrada (Zod) no front e na API; rate-limiting nos endpoints públicos.
- **Manutenibilidade:** lógica de negócio centralizada na API; contratos tipados compartilhados; tema via tokens.
- **Custo:** stack em camadas gratuitas (Supabase + Vercel + serviço gratuito de API) para o MVP.
- **LGPD:** coleta de dados pessoais (nome, WhatsApp, endereço) com finalidade clara; aviso de privacidade; possibilidade de exclusão.

---

## 8. Integrações externas

| Integração | Uso | Custo |
|-----------|-----|-------|
| **Supabase** | Postgres, Auth (admin), Storage (ícones/imagens) | Free tier |
| **WhatsApp** (`wa.me` / link de clique-para-conversar) | Encaminhar lead com mensagem + Token | Grátis |
| **ViaCEP** | Auto-preencher endereço a partir do CEP | Grátis, sem chave |
| **Vercel** | Hospedagem do frontend | Free tier |
| **E-mail transacional** (Resend ou SMTP do Supabase) | Notificar operador a cada nova proposta (RF-16) | Free tier |

---

## 9. Fora de escopo (MVP)

- Pagamento/checkout online (o fechamento é via WhatsApp).
- Logística/coleta automatizada.
- Multiusuário com papéis granulares no painel (MVP: um perfil admin).
- App mobile nativo.
- Multilíngue (apenas PT-BR).
- Integração com CRM externo (pode ser fase futura).

---

## 10. Decisões (validadas com o cliente)

1. **Valor de sucata:** ✅ **Valor fixo por versão** (`Variant.scrapPrice`), com _fallback_ para um default global (`Setting scrap.defaultValue`) quando a versão não tiver valor. → ver [PRICING §4](PRICING.md).
2. **Deltas:** ✅ **Globais por enquanto** — os descontos vivem no `DetailedState` e valem para todas as versões. O _override_ por versão fica na modelagem como evolução futura (não usado no MVP).
3. **"Já foi aberto para manutenção?":** ✅ **Desconta** — é um Estado Detalhado com delta (valor configurável no painel).
4. **Notificação ao operador:** ✅ **Sim** — ao registrar uma proposta, enviar **alerta por e-mail** (serviço gratuito) além de gravar no dashboard. (Ver RF-16, §8.)
5. **Domínio e identidade:** ⏳ "Vendy" segue como **nome provisório** até a identidade final.
6. **Estados base:** ✅ **Fixos** (4 estados) — só o preço é editável; não se criam novos estados base.
