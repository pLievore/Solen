/**
 * Seed inicial do Solen (Fase 0/1).
 * Idempotente: usa upsert por chaves estaveis (slug/key).
 * Valores em centavos.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  "iPhones",
  "Apple Watches",
  "iPads",
  "AirPods",
  "Acessorios e perifericos",
  "Consoles",
  "Colecionaveis",
];

const CONDITION_STATES = [
  { key: "NEW", label: "Novo/lacrado", order: 0 },
  { key: "LIKE_NEW", label: "Seminovo sem marcas de uso", order: 1 },
  { key: "USED_LIGHT", label: "Usado com marcas de uso leves", order: 2 },
  { key: "USED_HEAVY", label: "Usado com marcas de uso fortes", order: 3 },
];

const KNOCKOUT = [
  { question: "O aparelho liga?", triggerAnswer: "NO", order: 0 },
  { question: "O aparelho e bloqueado?", triggerAnswer: "YES", order: 1 },
];

// deltas em centavos (descontos negativos)
const DETAILED = [
  { question: "A bateria esta acima de 85%?", yesDelta: 0, noDelta: -10000, order: 0 },
  { question: "A tela do aparelho esta em perfeito funcionamento?", yesDelta: 0, noDelta: -25000, order: 1 },
  { question: "As cameras funcionam perfeitamente?", yesDelta: 0, noDelta: -25000, order: 2 },
  { question: "O Face ID funciona?", yesDelta: 0, noDelta: -25000, order: 3 },
  { question: "O aparelho tem alguma restricao?", yesDelta: -15000, noDelta: 0, order: 4 },
  {
    question: "O aparelho possui alguma mensagem de peca desconhecida?",
    helpText: "Como verificar: Ajustes > Geral > Sobre.",
    yesDelta: -15000,
    noDelta: 0,
    order: 5,
  },
  { question: "O aparelho ja foi aberto para manutencao?", yesDelta: -10000, noDelta: 0, order: 6 },
];

// ─── Catálogo de iPhones ───────────────────────────────────────────────────
// Preços em centavos [NEW, LIKE_NEW, USED_LIGHT, USED_HEAVY]
// Levemente abaixo do mercado de usados (posição de compra competitiva)
const IPHONE_MODELS = [
  {
    name: "iPhone 11", slug: "iphone-11", order: 0,
    variants: [
      { name: "iPhone 11 64GB",  storage: "64GB",  slug: "iphone-11-64gb",  scrap: 12000, prices: [90000,  78000,  62000,  48000]  },
      { name: "iPhone 11 128GB", storage: "128GB", slug: "iphone-11-128gb", scrap: 15000, prices: [99000,  86000,  70000,  54000]  },
      { name: "iPhone 11 256GB", storage: "256GB", slug: "iphone-11-256gb", scrap: 17000, prices: [108000, 95000,  78000,  60000]  },
    ],
  },
  {
    name: "iPhone 12 Mini", slug: "iphone-12-mini", order: 1,
    variants: [
      { name: "iPhone 12 Mini 64GB",  storage: "64GB",  slug: "iphone-12-mini-64gb",  scrap: 13000, prices: [99000,  86000,  70000,  55000]  },
      { name: "iPhone 12 Mini 128GB", storage: "128GB", slug: "iphone-12-mini-128gb", scrap: 16000, prices: [109000, 96000,  78000,  62000]  },
      { name: "iPhone 12 Mini 256GB", storage: "256GB", slug: "iphone-12-mini-256gb", scrap: 18000, prices: [120000, 106000, 86000,  69000]  },
    ],
  },
  {
    name: "iPhone 12", slug: "iphone-12", order: 2,
    variants: [
      { name: "iPhone 12 64GB",  storage: "64GB",  slug: "iphone-12-64gb",  scrap: 15000, prices: [120000, 105000, 85000,  68000]  },
      { name: "iPhone 12 128GB", storage: "128GB", slug: "iphone-12-128gb", scrap: 18000, prices: [130000, 115000, 95000,  76000]  },
      { name: "iPhone 12 256GB", storage: "256GB", slug: "iphone-12-256gb", scrap: 21000, prices: [144000, 127000, 105000, 84000]  },
    ],
  },
  {
    name: "iPhone 13 Mini", slug: "iphone-13-mini", order: 3,
    variants: [
      { name: "iPhone 13 Mini 128GB", storage: "128GB", slug: "iphone-13-mini-128gb", scrap: 18000, prices: [150000, 130000, 105000, 84000]  },
      { name: "iPhone 13 Mini 256GB", storage: "256GB", slug: "iphone-13-mini-256gb", scrap: 21000, prices: [165000, 143000, 116000, 93000]  },
      { name: "iPhone 13 Mini 512GB", storage: "512GB", slug: "iphone-13-mini-512gb", scrap: 24000, prices: [185000, 162000, 131000, 105000] },
    ],
  },
  {
    name: "iPhone 13", slug: "iphone-13", order: 4,
    variants: [
      { name: "iPhone 13 128GB", storage: "128GB", slug: "iphone-13-128gb", scrap: 20000, prices: [200000, 175000, 143000, 114000] },
      { name: "iPhone 13 256GB", storage: "256GB", slug: "iphone-13-256gb", scrap: 23000, prices: [220000, 193000, 158000, 126000] },
      { name: "iPhone 13 512GB", storage: "512GB", slug: "iphone-13-512gb", scrap: 28000, prices: [248000, 217000, 178000, 142000] },
    ],
  },
  {
    name: "iPhone 13 Pro", slug: "iphone-13-pro", order: 5,
    variants: [
      { name: "iPhone 13 Pro 128GB", storage: "128GB", slug: "iphone-13-pro-128gb", scrap: 25000, prices: [260000, 228000, 187000, 149000] },
      { name: "iPhone 13 Pro 256GB", storage: "256GB", slug: "iphone-13-pro-256gb", scrap: 29000, prices: [290000, 254000, 208000, 166000] },
      { name: "iPhone 13 Pro 512GB", storage: "512GB", slug: "iphone-13-pro-512gb", scrap: 33000, prices: [330000, 289000, 237000, 189000] },
      { name: "iPhone 13 Pro 1TB",   storage: "1TB",   slug: "iphone-13-pro-1tb",   scrap: 38000, prices: [380000, 333000, 273000, 218000] },
    ],
  },
  {
    name: "iPhone 13 Pro Max", slug: "iphone-13-pro-max", order: 6,
    variants: [
      { name: "iPhone 13 Pro Max 128GB", storage: "128GB", slug: "iphone-13-pro-max-128gb", scrap: 28000, prices: [290000, 254000, 208000, 166000] },
      { name: "iPhone 13 Pro Max 256GB", storage: "256GB", slug: "iphone-13-pro-max-256gb", scrap: 32000, prices: [320000, 280000, 230000, 184000] },
      { name: "iPhone 13 Pro Max 512GB", storage: "512GB", slug: "iphone-13-pro-max-512gb", scrap: 36000, prices: [360000, 315000, 258000, 206000] },
      { name: "iPhone 13 Pro Max 1TB",   storage: "1TB",   slug: "iphone-13-pro-max-1tb",   scrap: 41000, prices: [410000, 359000, 294000, 235000] },
    ],
  },
  {
    name: "iPhone 14", slug: "iphone-14", order: 7,
    variants: [
      { name: "iPhone 14 128GB", storage: "128GB", slug: "iphone-14-128gb", scrap: 30000, prices: [310000, 272000, 223000, 178000] },
      { name: "iPhone 14 256GB", storage: "256GB", slug: "iphone-14-256gb", scrap: 34000, prices: [345000, 302000, 247000, 198000] },
      { name: "iPhone 14 512GB", storage: "512GB", slug: "iphone-14-512gb", scrap: 39000, prices: [390000, 341000, 280000, 224000] },
    ],
  },
  {
    name: "iPhone 14 Plus", slug: "iphone-14-plus", order: 8,
    variants: [
      { name: "iPhone 14 Plus 128GB", storage: "128GB", slug: "iphone-14-plus-128gb", scrap: 33000, prices: [335000, 294000, 241000, 192000] },
      { name: "iPhone 14 Plus 256GB", storage: "256GB", slug: "iphone-14-plus-256gb", scrap: 37000, prices: [370000, 324000, 266000, 213000] },
      { name: "iPhone 14 Plus 512GB", storage: "512GB", slug: "iphone-14-plus-512gb", scrap: 42000, prices: [420000, 368000, 302000, 241000] },
    ],
  },
  {
    name: "iPhone 14 Pro", slug: "iphone-14-pro", order: 9,
    variants: [
      { name: "iPhone 14 Pro 128GB", storage: "128GB", slug: "iphone-14-pro-128gb", scrap: 42000, prices: [420000, 368000, 302000, 241000] },
      { name: "iPhone 14 Pro 256GB", storage: "256GB", slug: "iphone-14-pro-256gb", scrap: 47000, prices: [470000, 412000, 338000, 270000] },
      { name: "iPhone 14 Pro 512GB", storage: "512GB", slug: "iphone-14-pro-512gb", scrap: 53000, prices: [530000, 464000, 381000, 304000] },
      { name: "iPhone 14 Pro 1TB",   storage: "1TB",   slug: "iphone-14-pro-1tb",   scrap: 61000, prices: [610000, 534000, 438000, 350000] },
    ],
  },
  {
    name: "iPhone 14 Pro Max", slug: "iphone-14-pro-max", order: 10,
    variants: [
      { name: "iPhone 14 Pro Max 128GB", storage: "128GB", slug: "iphone-14-pro-max-128gb", scrap: 46000, prices: [460000, 403000, 331000, 264000] },
      { name: "iPhone 14 Pro Max 256GB", storage: "256GB", slug: "iphone-14-pro-max-256gb", scrap: 51000, prices: [510000, 447000, 367000, 293000] },
      { name: "iPhone 14 Pro Max 512GB", storage: "512GB", slug: "iphone-14-pro-max-512gb", scrap: 58000, prices: [580000, 508000, 417000, 333000] },
      { name: "iPhone 14 Pro Max 1TB",   storage: "1TB",   slug: "iphone-14-pro-max-1tb",   scrap: 67000, prices: [670000, 587000, 482000, 385000] },
    ],
  },
  {
    name: "iPhone 15", slug: "iphone-15", order: 11,
    variants: [
      { name: "iPhone 15 128GB", storage: "128GB", slug: "iphone-15-128gb", scrap: 47000, prices: [470000, 412000, 338000, 270000] },
      { name: "iPhone 15 256GB", storage: "256GB", slug: "iphone-15-256gb", scrap: 52000, prices: [520000, 456000, 374000, 299000] },
      { name: "iPhone 15 512GB", storage: "512GB", slug: "iphone-15-512gb", scrap: 59000, prices: [590000, 517000, 424000, 339000] },
    ],
  },
  {
    name: "iPhone 15 Plus", slug: "iphone-15-plus", order: 12,
    variants: [
      { name: "iPhone 15 Plus 128GB", storage: "128GB", slug: "iphone-15-plus-128gb", scrap: 51000, prices: [510000, 447000, 367000, 293000] },
      { name: "iPhone 15 Plus 256GB", storage: "256GB", slug: "iphone-15-plus-256gb", scrap: 57000, prices: [570000, 499000, 410000, 327000] },
      { name: "iPhone 15 Plus 512GB", storage: "512GB", slug: "iphone-15-plus-512gb", scrap: 65000, prices: [650000, 570000, 468000, 374000] },
    ],
  },
  {
    name: "iPhone 15 Pro", slug: "iphone-15-pro", order: 13,
    variants: [
      { name: "iPhone 15 Pro 128GB", storage: "128GB", slug: "iphone-15-pro-128gb", scrap: 63000, prices: [630000, 552000, 453000, 362000] },
      { name: "iPhone 15 Pro 256GB", storage: "256GB", slug: "iphone-15-pro-256gb", scrap: 70000, prices: [700000, 613000, 503000, 402000] },
      { name: "iPhone 15 Pro 512GB", storage: "512GB", slug: "iphone-15-pro-512gb", scrap: 79000, prices: [790000, 692000, 568000, 454000] },
      { name: "iPhone 15 Pro 1TB",   storage: "1TB",   slug: "iphone-15-pro-1tb",   scrap: 91000, prices: [910000, 797000, 654000, 523000] },
    ],
  },
  {
    name: "iPhone 15 Pro Max", slug: "iphone-15-pro-max", order: 14,
    variants: [
      { name: "iPhone 15 Pro Max 256GB", storage: "256GB", slug: "iphone-15-pro-max-256gb", scrap: 80000, prices: [800000,  701000,  575000,  460000]  },
      { name: "iPhone 15 Pro Max 512GB", storage: "512GB", slug: "iphone-15-pro-max-512gb", scrap: 90000, prices: [900000,  789000,  648000,  518000]  },
      { name: "iPhone 15 Pro Max 1TB",   storage: "1TB",   slug: "iphone-15-pro-max-1tb",   scrap: 104000, prices: [1040000, 911000,  748000,  598000] },
    ],
  },
  {
    name: "iPhone 16", slug: "iphone-16", order: 15,
    variants: [
      { name: "iPhone 16 128GB", storage: "128GB", slug: "iphone-16-128gb", scrap: 58000, prices: [580000, 509000, 418000, 334000] },
      { name: "iPhone 16 256GB", storage: "256GB", slug: "iphone-16-256gb", scrap: 65000, prices: [650000, 570000, 468000, 374000] },
      { name: "iPhone 16 512GB", storage: "512GB", slug: "iphone-16-512gb", scrap: 74000, prices: [740000, 649000, 533000, 426000] },
    ],
  },
  {
    name: "iPhone 16 Plus", slug: "iphone-16-plus", order: 16,
    variants: [
      { name: "iPhone 16 Plus 128GB", storage: "128GB", slug: "iphone-16-plus-128gb", scrap: 64000, prices: [640000, 561000, 461000, 369000] },
      { name: "iPhone 16 Plus 256GB", storage: "256GB", slug: "iphone-16-plus-256gb", scrap: 72000, prices: [720000, 631000, 518000, 414000] },
      { name: "iPhone 16 Plus 512GB", storage: "512GB", slug: "iphone-16-plus-512gb", scrap: 82000, prices: [820000, 719000, 590000, 472000] },
    ],
  },
  {
    name: "iPhone 16 Pro", slug: "iphone-16-pro", order: 17,
    variants: [
      { name: "iPhone 16 Pro 128GB", storage: "128GB", slug: "iphone-16-pro-128gb", scrap: 83000,  prices: [830000,  728000,  598000,  478000]  },
      { name: "iPhone 16 Pro 256GB", storage: "256GB", slug: "iphone-16-pro-256gb", scrap: 92000,  prices: [920000,  807000,  663000,  530000]  },
      { name: "iPhone 16 Pro 512GB", storage: "512GB", slug: "iphone-16-pro-512gb", scrap: 105000, prices: [1050000, 920000,  756000,  604000] },
      { name: "iPhone 16 Pro 1TB",   storage: "1TB",   slug: "iphone-16-pro-1tb",   scrap: 120000, prices: [1200000, 1052000, 864000,  690000] },
    ],
  },
  {
    name: "iPhone 16 Pro Max", slug: "iphone-16-pro-max", order: 18,
    variants: [
      { name: "iPhone 16 Pro Max 256GB", storage: "256GB", slug: "iphone-16-pro-max-256gb", scrap: 105000, prices: [1050000, 920000,  756000,  604000]  },
      { name: "iPhone 16 Pro Max 512GB", storage: "512GB", slug: "iphone-16-pro-max-512gb", scrap: 120000, prices: [1200000, 1052000, 864000,  690000]  },
      { name: "iPhone 16 Pro Max 1TB",   storage: "1TB",   slug: "iphone-16-pro-max-1tb",   scrap: 138000, prices: [1380000, 1210000, 994000,  794000] },
    ],
  },
];

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  // Estados base (fixos)
  for (const s of CONDITION_STATES) {
    await prisma.conditionState.upsert({
      where: { key: s.key },
      update: { label: s.label, order: s.order },
      create: s,
    });
  }

  // Categorias
  const categoryBySlug: Record<string, string> = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const name = CATEGORIES[i];
    const slug = slugify(name);
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { name, order: i },
      create: { name, slug, order: i },
    });
    categoryBySlug[slug] = cat.id;
  }

  // Perguntas eliminatorias
  for (const k of KNOCKOUT) {
    const existing = await prisma.knockoutQuestion.findFirst({
      where: { question: k.question },
    });
    if (existing) {
      await prisma.knockoutQuestion.update({ where: { id: existing.id }, data: k });
    } else {
      await prisma.knockoutQuestion.create({ data: k });
    }
  }

  // Estados detalhados (perguntas de desconto)
  const detailedIds: string[] = [];
  for (const d of DETAILED) {
    const existing = await prisma.detailedState.findFirst({
      where: { question: d.question },
    });
    const row = existing
      ? await prisma.detailedState.update({ where: { id: existing.id }, data: d })
      : await prisma.detailedState.create({ data: d });
    detailedIds.push(row.id);
  }

  // Modelos iPhone com variantes e precos
  const iphonesId = categoryBySlug[slugify("iPhones")];
  const states = await prisma.conditionState.findMany();
  const stateOrder = ["NEW", "LIKE_NEW", "USED_LIGHT", "USED_HEAVY"];

  for (const m of IPHONE_MODELS) {
    const model = await prisma.deviceModel.upsert({
      where: { categoryId_slug: { categoryId: iphonesId, slug: m.slug } },
      update: { name: m.name, order: m.order },
      create: { categoryId: iphonesId, name: m.name, slug: m.slug, order: m.order },
    });

    for (const v of m.variants) {
      const variantId = `${model.id}-${v.slug}`;
      const variant = await prisma.variant.upsert({
        where: { id: variantId },
        update: { name: v.name, storage: v.storage, scrapPrice: v.scrap },
        create: {
          id: variantId,
          modelId: model.id,
          name: v.name,
          storage: v.storage,
          slug: v.slug,
          scrapPrice: v.scrap,
        },
      });

      for (const st of states) {
        const priceIndex = stateOrder.indexOf(st.key);
        const price = priceIndex >= 0 ? v.prices[priceIndex] : 0;
        await prisma.variantPrice.upsert({
          where: { variantId_conditionStateId: { variantId: variant.id, conditionStateId: st.id } },
          update: { price },
          create: { variantId: variant.id, conditionStateId: st.id, price },
        });
      }

      for (const dsId of detailedIds) {
        await prisma.variantDetailedState.upsert({
          where: { variantId_detailedStateId: { variantId: variant.id, detailedStateId: dsId } },
          update: {},
          create: { variantId: variant.id, detailedStateId: dsId },
        });
      }
    }
  }

  // Configuracoes iniciais
  const settings: Record<string, unknown> = {
    whatsapp_phone: process.env.WHATSAPP_PHONE ?? "5599999999999",
    "home.headline": "Venda seus usados",
    "scrap.defaultValue": 10000,
    notify_email: "",
    whatsapp_message_template:
      "Ola! Acabei de fazer a avaliacao no. {token} no site. Aparelho: {variant} - Estado: {condition}. Proposta: {value}.",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: value as any },
      create: { key, value: value as any },
    });
  }

  const totalModels = IPHONE_MODELS.length;
  const totalVariants = IPHONE_MODELS.reduce((s, m) => s + m.variants.length, 0);
  console.log(`Seed concluido: ${totalModels} modelos, ${totalVariants} variantes, categorias, estados e settings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
