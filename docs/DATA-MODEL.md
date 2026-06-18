# DATA-MODEL — Solen

> Entidades, relacionamentos e rascunho de schema. Versão 0.1.
> Nomes em **inglês no código** / **PT-BR na UI** (mapeamento abaixo).

---

## 1. Mapa de termos

| Briefing (PT-BR) | Entidade (código) | Papel |
|------------------|-------------------|-------|
| Categoria / Produto | `Category` | Topo da árvore (iPhones, iPads, Consoles…) |
| Modelo / Aparelho | `DeviceModel` | iPhone 11, iPad 9th, PS5… |
| Versão (Modelo + Especificação) | `Variant` | iPhone 11 64GB… |
| Estado (base) | `ConditionState` | Novo/lacrado, Seminovo, Usado leve, Usado forte |
| Preço base por Versão×Estado | `VariantPrice` | Preço base |
| Estado Detalhado (pergunta de desconto) | `DetailedState` | Bateria, tela, câmeras… (deltas) |
| Atribuição Estado Detalhado ↔ Versão | `VariantDetailedState` | N:N (+ override opcional) |
| Pergunta eliminatória (knockout) | `KnockoutQuestion` | Liga? Bloqueado? → sucata |
| Proposta / Lead | `Proposal` | Resultado + dados do vendedor + Token |
| Post de blog | `Post` | Conteúdo de SEO |
| Configurações | `Setting` | WhatsApp, tema, textos |

---

## 2. Diagrama de relacionamentos

```
Category 1──* DeviceModel 1──* Variant
                                  │
              ┌───────────────────┼───────────────────────────┐
              │                   │                            │
        * VariantPrice *    * VariantDetailedState *      * Proposal
              │                   │                            │
        1 ConditionState    1 DetailedState              (snapshot das respostas)

KnockoutQuestion (global, aplicada a todas as avaliações)
Post (independente)        Setting (chave/valor)
```

---

## 3. Entidades

### Category (Categoria)
| Campo | Tipo | Notas |
|------|------|-------|
| id | uuid (PK) | |
| name | string | "iPhones" |
| slug | string (unique) | "iphones" |
| iconUrl | string? | Supabase Storage |
| order | int | ordenação na home |
| active | bool | exibe ou não |
| createdAt/updatedAt | datetime | |

### DeviceModel (Modelo / Aparelho)
| Campo | Tipo | Notas |
|------|------|-------|
| id | uuid (PK) | |
| categoryId | uuid (FK → Category) | |
| name | string | "iPhone 11" |
| slug | string | único por categoria |
| imageUrl | string? | |
| order | int | |
| active | bool | |

### Variant (Versão = Modelo + Especificação)
| Campo | Tipo | Notas |
|------|------|-------|
| id | uuid (PK) | |
| modelId | uuid (FK → DeviceModel) | |
| name | string | "iPhone 11 64GB" (ou só "64GB") |
| storage | string? | "64GB" |
| specs | json? | tecnologias / diferenciação |
| slug | string | |
| scrapPrice | int? | valor de sucata desta versão (centavos) — ver PRICING |
| active | bool | |

### ConditionState (Estado base)
| Campo | Tipo | Notas |
|------|------|-------|
| id | uuid (PK) | |
| key | enum/string | NEW · LIKE_NEW · USED_LIGHT · USED_HEAVY |
| label | string | "Novo/lacrado" |
| order | int | |
> Tabela de referência: os 4 estados são fixos (só rótulo/ordem editáveis). Novos preços vêm de `VariantPrice`.

### VariantPrice (Preço base: Versão × Estado)
| Campo | Tipo | Notas |
|------|------|-------|
| id | uuid (PK) | |
| variantId | uuid (FK → Variant) | |
| conditionStateId | uuid (FK → ConditionState) | |
| price | int | **centavos** (evita float) |
| unique(variantId, conditionStateId) | | um preço por combinação |

Exemplo (iPhone 11 64GB):
```
NEW         → R$ 700,00
LIKE_NEW    → R$ 650,00
USED_LIGHT  → R$ 550,00
USED_HEAVY  → R$ 500,00
```

### DetailedState (Estado Detalhado / pergunta de desconto)
| Campo | Tipo | Notas |
|------|------|-------|
| id | uuid (PK) | |
| question | string | "A bateria está acima de 85%?" |
| helpText | string? | "como verificar…" |
| answerType | enum | TOGGLE (Sim/Não) · CHECK · SELECT |
| yesDelta | int | delta se "Sim" (centavos, ≤ 0 normalmente) |
| noDelta | int | delta se "Não" |
| order | int | |
| active | bool | |
> Global e reutilizável. Deltas padrão definidos aqui; atribuição e override por versão em `VariantDetailedState`.

Exemplos (deltas em R$):
```
Bateria > 85%?            Sim  0    | Não  -100
Tela perfeita?            Sim  0    | Não  -250
Câmeras perfeitas?        Sim  0    | Não  -250
Face ID funciona?         Sim  0    | Não  -250
Tem restrição?            Sim -150  | Não   0
Mensagem peça desconhec.? Sim -150  | Não   0
Já aberto p/ manutenção?  Sim  -X   | Não   0   (desconta; X definido no painel)
```
> **Globais no MVP:** os deltas vivem no `DetailedState` e valem para todas as versões. As colunas de _override_ em `VariantDetailedState` ficam para evolução futura — **não usadas no MVP** (SPEC §10.2).

### VariantDetailedState (atribuição N:N + override)
| Campo | Tipo | Notas |
|------|------|-------|
| id | uuid (PK) | |
| variantId | uuid (FK → Variant) | |
| detailedStateId | uuid (FK → DetailedState) | |
| yesDeltaOverride | int? | sobrepõe o padrão (opcional) |
| noDeltaOverride | int? | sobrepõe o padrão (opcional) |
| unique(variantId, detailedStateId) | | |
> Implementa "atribuir EstadosDetalhados para cada [Modelo (Especificação)]". Sem override → usa os deltas do `DetailedState`.

### KnockoutQuestion (pergunta eliminatória)
| Campo | Tipo | Notas |
|------|------|-------|
| id | uuid (PK) | |
| question | string | "O aparelho liga?" |
| triggerAnswer | enum | YES · NO → resposta que leva à sucata |
| order | int | |
| active | bool | |

Exemplos:
```
"O aparelho liga?"      triggerAnswer = NO   → sucata
"O aparelho é bloqueado?" triggerAnswer = YES → sucata
```

### Proposal (Proposta / Lead)
| Campo | Tipo | Notas |
|------|------|-------|
| id | uuid (PK) | |
| token | string (unique) | identificador curto exibido ao usuário |
| variantId | uuid (FK → Variant) | |
| conditionStateId | uuid? (FK) | nulo se sucata |
| isScrap | bool | caiu no caminho de sucata |
| answers | json | **snapshot** das respostas (perguntas + deltas no momento) |
| calculatedValue | int | valor final (centavos) |
| breakdown | json | composição do cálculo (auditoria) |
| sellerName | string | |
| sellerWhatsapp | string | |
| cep | string | |
| city | string | |
| neighborhood | string | |
| street | string | |
| number | string | |
| status | enum | NEW · CONTACTED · CLOSED · LOST |
| createdAt | datetime | |
> `answers`/`breakdown` são **snapshots**: se os preços mudarem depois, a proposta histórica permanece fiel ao que foi mostrado.

### Post (Blog)
| Campo | Tipo | Notas |
|------|------|-------|
| id | uuid (PK) | |
| title | string | |
| slug | string (unique) | URL amigável |
| excerpt | string? | resumo |
| content | text | HTML/Markdown do editor |
| coverImageUrl | string? | |
| seoTitle | string? | |
| metaDescription | string? | |
| status | enum | DRAFT · PUBLISHED |
| publishedAt | datetime? | |
| createdAt/updatedAt | datetime | |

### Setting (Configurações)
| Campo | Tipo | Notas |
|------|------|-------|
| key | string (PK) | "whatsapp_phone", "theme.tokens", "home.headline", "whatsapp_message_template", "scrap.defaultValue", "notify_email" |
| value | json | |

---

## 4. Rascunho Prisma (`apps/api/prisma/schema.prisma`)

```prisma
// Esboço — refinar na Fase 1. Valores monetários em centavos (Int).

model Category {
  id        String        @id @default(uuid())
  name      String
  slug      String        @unique
  iconUrl   String?
  order     Int           @default(0)
  active    Boolean       @default(true)
  models    DeviceModel[]
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}

model DeviceModel {
  id         String    @id @default(uuid())
  categoryId String
  category   Category  @relation(fields: [categoryId], references: [id])
  name       String
  slug       String
  imageUrl   String?
  order      Int       @default(0)
  active     Boolean   @default(true)
  variants   Variant[]
  @@unique([categoryId, slug])
}

model Variant {
  id             String                 @id @default(uuid())
  modelId        String
  model          DeviceModel            @relation(fields: [modelId], references: [id])
  name           String
  storage        String?
  specs          Json?
  slug           String
  scrapPrice     Int?
  active         Boolean                @default(true)
  prices         VariantPrice[]
  detailedStates VariantDetailedState[]
  proposals      Proposal[]
}

model ConditionState {
  id     String         @id @default(uuid())
  key    String         @unique          // NEW | LIKE_NEW | USED_LIGHT | USED_HEAVY
  label  String
  order  Int            @default(0)
  prices VariantPrice[]
}

model VariantPrice {
  id               String         @id @default(uuid())
  variantId        String
  variant          Variant        @relation(fields: [variantId], references: [id])
  conditionStateId String
  conditionState   ConditionState @relation(fields: [conditionStateId], references: [id])
  price            Int                                  // centavos
  @@unique([variantId, conditionStateId])
}

model DetailedState {
  id        String                 @id @default(uuid())
  question  String
  helpText  String?
  answerType String                @default("TOGGLE")
  yesDelta  Int                    @default(0)
  noDelta   Int                    @default(0)
  order     Int                    @default(0)
  active    Boolean                @default(true)
  variants  VariantDetailedState[]
}

model VariantDetailedState {
  id               String        @id @default(uuid())
  variantId        String
  variant          Variant       @relation(fields: [variantId], references: [id])
  detailedStateId  String
  detailedState    DetailedState @relation(fields: [detailedStateId], references: [id])
  yesDeltaOverride Int?
  noDeltaOverride  Int?
  @@unique([variantId, detailedStateId])
}

model KnockoutQuestion {
  id            String  @id @default(uuid())
  question      String
  triggerAnswer String                                  // YES | NO
  order         Int     @default(0)
  active        Boolean @default(true)
}

model Proposal {
  id               String   @id @default(uuid())
  token            String   @unique
  variantId        String
  variant          Variant  @relation(fields: [variantId], references: [id])
  conditionStateId String?
  isScrap          Boolean  @default(false)
  answers          Json
  calculatedValue  Int
  breakdown        Json
  sellerName       String
  sellerWhatsapp   String
  cep              String
  city             String
  neighborhood     String
  street           String
  number           String
  status           String   @default("NEW")
  createdAt        DateTime @default(now())
}

model Post {
  id              String    @id @default(uuid())
  title           String
  slug            String    @unique
  excerpt         String?
  content         String
  coverImageUrl   String?
  seoTitle        String?
  metaDescription String?
  status          String    @default("DRAFT")
  publishedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Setting {
  key   String @id
  value Json
}
```

---

## 5. Seed inicial (Fase 1)
- 8 categorias do briefing (com ícones placeholder).
- 4 `ConditionState` fixos.
- `DetailedState` e `KnockoutQuestion` dos exemplos do briefing (com deltas).
- 1 modelo de exemplo (iPhone 11) com 2 versões (64GB/128GB) e preços do exemplo.
- 1 post de blog de exemplo.
