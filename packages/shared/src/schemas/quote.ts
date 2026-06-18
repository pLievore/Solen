import { z } from "zod";

/** Resposta de uma pergunta eliminatória (knockout) ou detalhada. */
export const answerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.enum(["YES", "NO"]),
});
export type Answer = z.infer<typeof answerSchema>;

/** Entrada do cálculo de proposta (POST /quote). */
export const quoteRequestSchema = z.object({
  variantId: z.string().min(1),
  conditionStateId: z.string().min(1).optional(), // ausente quando vira sucata
  knockoutAnswers: z.array(answerSchema).default([]),
  detailedAnswers: z.array(answerSchema).default([]),
});
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export const quoteBreakdownItemSchema = z.object({
  type: z.enum(["base", "delta", "scrap"]),
  label: z.string(),
  amount: z.number().int(), // centavos
});
export type QuoteBreakdownItem = z.infer<typeof quoteBreakdownItemSchema>;

/** Resultado do cálculo (POST /quote). */
export const quoteResponseSchema = z.object({
  isScrap: z.boolean(),
  value: z.number().int(), // centavos
  valueFormatted: z.string(),
  breakdown: z.array(quoteBreakdownItemSchema),
});
export type QuoteResponse = z.infer<typeof quoteResponseSchema>;
