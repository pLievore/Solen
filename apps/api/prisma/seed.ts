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

  // Modelo de exemplo: iPhone 11 (categoria iPhones) com 2 versoes
  const iphonesId = categoryBySlug[slugify("iPhones")];
  const model = await prisma.deviceModel.upsert({
    where: { categoryId_slug: { categoryId: iphonesId, slug: "iphone-11" } },
    update: { name: "iPhone 11" },
    create: { categoryId: iphonesId, name: "iPhone 11", slug: "iphone-11", order: 0 },
  });

  const variants = [
    { name: "iPhone 11 64GB", storage: "64GB", slug: "iphone-11-64gb", scrapPrice: 15000 },
    { name: "iPhone 11 128GB", storage: "128GB", slug: "iphone-11-128gb", scrapPrice: 18000 },
  ];

  // precos base do exemplo do briefing (iPhone 11 64GB)
  const basePrices: Record<string, number> = {
    NEW: 70000,
    LIKE_NEW: 65000,
    USED_LIGHT: 55000,
    USED_HEAVY: 50000,
  };

  const states = await prisma.conditionState.findMany();

  for (const v of variants) {
    const variantId = `${model.id}-${v.slug}`;
    const variant = await prisma.variant.upsert({
      where: { id: variantId },
      update: { name: v.name, storage: v.storage, scrapPrice: v.scrapPrice },
      create: {
        id: variantId,
        modelId: model.id,
        name: v.name,
        storage: v.storage,
        slug: v.slug,
        scrapPrice: v.scrapPrice,
      },
    });

    for (const st of states) {
      await prisma.variantPrice.upsert({
        where: {
          variantId_conditionStateId: {
            variantId: variant.id,
            conditionStateId: st.id,
          },
        },
        update: { price: basePrices[st.key] ?? 0 },
        create: {
          variantId: variant.id,
          conditionStateId: st.id,
          price: basePrices[st.key] ?? 0,
        },
      });
    }

    // atribui todos os estados detalhados a cada versao
    for (const dsId of detailedIds) {
      await prisma.variantDetailedState.upsert({
        where: {
          variantId_detailedStateId: { variantId: variant.id, detailedStateId: dsId },
        },
        update: {},
        create: { variantId: variant.id, detailedStateId: dsId },
      });
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

  console.log("Seed concluido: categorias, estados, perguntas, iPhone 11 e settings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
