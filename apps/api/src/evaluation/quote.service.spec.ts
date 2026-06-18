import { test } from "node:test";
import assert from "node:assert/strict";
import { BadRequestException } from "@nestjs/common";
import type { QuoteRequest } from "@solen/shared";
import { QuoteService } from "./quote.service";

function createService() {
  const prisma = {
    variant: {
      findFirst: async () => ({ id: "variant-1", scrapPrice: 5000 }),
    },
    knockoutQuestion: {
      findMany: async () => [
        { id: "knockout-1", triggerAnswer: "NO" },
      ],
    },
    variantPrice: {
      findUnique: async () => ({
        price: 10000,
        conditionState: { label: "Usado" },
      }),
    },
    variantDetailedState: {
      findMany: async () => [
        {
          detailedStateId: "detail-1",
          yesDeltaOverride: null,
          noDeltaOverride: null,
          detailedState: {
            question: "Bateria em bom estado?",
            yesDelta: 0,
            noDelta: -1000,
          },
        },
      ],
    },
    setting: {
      findUnique: async () => null,
    },
  };

  return new QuoteService(prisma as never);
}

const completeInput: QuoteRequest = {
  variantId: "variant-1",
  conditionStateId: "condition-1",
  knockoutAnswers: [{ questionId: "knockout-1", answer: "YES" }],
  detailedAnswers: [{ questionId: "detail-1", answer: "NO" }],
};

test("rejeita cotacao sem todas as perguntas eliminatorias", async () => {
  const service = createService();
  await assert.rejects(
    () => service.quote({ ...completeInput, knockoutAnswers: [] }),
    BadRequestException,
  );
});

test("rejeita respostas duplicadas", async () => {
  const service = createService();
  await assert.rejects(
    () =>
      service.quote({
        ...completeInput,
        knockoutAnswers: [
          completeInput.knockoutAnswers[0],
          completeInput.knockoutAnswers[0],
        ],
      }),
    BadRequestException,
  );
});

test("rejeita cotacao sem todos os estados detalhados", async () => {
  const service = createService();
  await assert.rejects(
    () => service.quote({ ...completeInput, detailedAnswers: [] }),
    BadRequestException,
  );
});

test("calcula cotacao quando o conjunto de respostas esta completo", async () => {
  const service = createService();
  const result = await service.quote(completeInput);
  assert.equal(result.value, 9000);
});
