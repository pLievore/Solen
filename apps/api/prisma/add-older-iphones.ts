/**
 * Insere APENAS os iPhones anteriores ao 11 (ver older-iphones.ts) no banco.
 * NAO toca em nenhum outro modelo/variante/preco ja existente: so cria/atualiza
 * os modelos listados em OLDER_IPHONE_MODELS. Idempotente (pode rodar de novo).
 *
 * Rodar:
 *   pnpm --filter @vendy/api exec dotenv -e ../../.env -- ts-node prisma/add-older-iphones.ts
 */
import { PrismaClient } from "@prisma/client";
import { OLDER_IPHONE_MODELS } from "./older-iphones";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});

const QUESTION_BY_KEY: Record<string, string> = {
  battery: "A bateria esta acima de 85%?",
  screen: "A tela do aparelho esta em perfeito funcionamento?",
  cameras: "As cameras funcionam perfeitamente?",
  "face-id": "O Face ID funciona?",
  restriction: "O aparelho tem alguma restricao?",
  "unknown-part": "O aparelho possui alguma mensagem de peca desconhecida?",
  opened: "O aparelho ja foi aberto para manutencao?",
};

const STATE_ORDER = ["NEW", "LIKE_NEW", "USED_LIGHT", "USED_HEAVY"];

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: "iphones" } });
  if (!category) throw new Error("Categoria 'iphones' nao encontrada.");

  const states = await prisma.conditionState.findMany();
  const stateById = new Map(states.map((s) => [s.key, s.id]));

  // Resolve os ids dos estados detalhados pelas perguntas usadas.
  const detailedIdByKey: Record<string, string> = {};
  for (const [key, question] of Object.entries(QUESTION_BY_KEY)) {
    const ds = await prisma.detailedState.findFirst({ where: { question } });
    if (!ds) throw new Error(`Estado detalhado nao encontrado: ${question}`);
    detailedIdByKey[key] = ds.id;
  }

  let createdModels = 0;
  let createdVariants = 0;

  for (const m of OLDER_IPHONE_MODELS) {
    const model = await prisma.deviceModel.upsert({
      where: { categoryId_slug: { categoryId: category.id, slug: m.slug } },
      update: { name: m.name, order: m.order, active: true },
      create: { categoryId: category.id, name: m.name, slug: m.slug, order: m.order },
    });
    createdModels++;

    for (const v of m.variants) {
      const variantId = `${model.id}-${v.slug}`;
      const variant = await prisma.variant.upsert({
        where: { id: variantId },
        update: { name: v.name, storage: v.storage, scrapPrice: v.scrap, active: true },
        create: {
          id: variantId,
          modelId: model.id,
          name: v.name,
          storage: v.storage,
          slug: v.slug,
          scrapPrice: v.scrap,
        },
      });
      createdVariants++;

      const prices = STATE_ORDER.map((key, i) => ({
        variantId: variant.id,
        conditionStateId: stateById.get(key)!,
        price: v.prices[i] ?? 0,
      }));
      const detailIds = m.detailKeys.map((k) => detailedIdByKey[k]);

      // Escopo restrito a ESTA variante nova: nao afeta outros aparelhos.
      await prisma.$transaction([
        prisma.variantPrice.deleteMany({ where: { variantId: variant.id } }),
        prisma.variantPrice.createMany({ data: prices }),
        prisma.variantDetailedState.deleteMany({ where: { variantId: variant.id } }),
        prisma.variantDetailedState.createMany({
          data: detailIds.map((detailedStateId) => ({
            variantId: variant.id,
            detailedStateId,
          })),
        }),
      ]);
    }
  }

  console.log(
    `OK: ${createdModels} modelos e ${createdVariants} variantes (iPhones pre-11) inseridos/atualizados.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
