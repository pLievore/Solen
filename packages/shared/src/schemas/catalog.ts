import { z } from "zod";

// ─────────────────────────── Categoria ───────────────────────────
export const categoryCreateSchema = z.object({
  name: z.string().min(1, "Nome obrigatorio"),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug deve ser minusculo, sem espacos"),
  iconUrl: z.string().url().nullish(),
  order: z.number().int().nonnegative().default(0),
  active: z.boolean().default(true),
});
export const categoryUpdateSchema = categoryCreateSchema.partial();
export type CategoryCreate = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;

// ─────────────────────────── Modelo ───────────────────────────
export const modelCreateSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  imageUrl: z.string().url().nullish(),
  order: z.number().int().nonnegative().default(0),
  active: z.boolean().default(true),
});
export const modelUpdateSchema = modelCreateSchema.partial().omit({ categoryId: true });
export type ModelCreate = z.infer<typeof modelCreateSchema>;
export type ModelUpdate = z.infer<typeof modelUpdateSchema>;

// ─────────────────────────── Versao ───────────────────────────
export const variantCreateSchema = z.object({
  modelId: z.string().uuid(),
  name: z.string().min(1),
  storage: z.string().nullish(),
  specs: z.record(z.string(), z.unknown()).nullish(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  scrapPrice: z.number().int().nonnegative().nullish(), // centavos
  active: z.boolean().default(true),
});
export const variantUpdateSchema = variantCreateSchema.partial().omit({ modelId: true });
export type VariantCreate = z.infer<typeof variantCreateSchema>;
export type VariantUpdate = z.infer<typeof variantUpdateSchema>;

// ───────────────────── Precos base (Versao x Estado) ─────────────────────
export const variantPricesSchema = z.object({
  prices: z.array(
    z.object({
      conditionStateId: z.string().uuid(),
      price: z.number().int().nonnegative(), // centavos
    }),
  ),
});
export type VariantPrices = z.infer<typeof variantPricesSchema>;

// ─────────────────── Estado Detalhado (pergunta de desconto) ───────────────────
export const detailedStateCreateSchema = z.object({
  question: z.string().min(1),
  helpText: z.string().nullish(),
  answerType: z.enum(["TOGGLE", "CHECK", "SELECT"]).default("TOGGLE"),
  yesDelta: z.number().int().default(0), // centavos (normalmente <= 0)
  noDelta: z.number().int().default(0),
  order: z.number().int().nonnegative().default(0),
  active: z.boolean().default(true),
});
export const detailedStateUpdateSchema = detailedStateCreateSchema.partial();
export type DetailedStateCreate = z.infer<typeof detailedStateCreateSchema>;
export type DetailedStateUpdate = z.infer<typeof detailedStateUpdateSchema>;

// Atribuicao de estados detalhados a uma versao (com override opcional)
export const variantDetailedStatesSchema = z.object({
  items: z.array(
    z.object({
      detailedStateId: z.string().uuid(),
      yesDeltaOverride: z.number().int().nullish(),
      noDeltaOverride: z.number().int().nullish(),
    }),
  ),
});
export type VariantDetailedStates = z.infer<typeof variantDetailedStatesSchema>;

// ─────────────────── Pergunta eliminatoria (knockout) ───────────────────
export const knockoutCreateSchema = z.object({
  question: z.string().min(1),
  helpText: z.string().nullish(),
  triggerAnswer: z.enum(["YES", "NO"]),
  order: z.number().int().nonnegative().default(0),
  active: z.boolean().default(true),
});
export const knockoutUpdateSchema = knockoutCreateSchema.partial();
export type KnockoutCreate = z.infer<typeof knockoutCreateSchema>;
export type KnockoutUpdate = z.infer<typeof knockoutUpdateSchema>;

// ─────────────────────────── Settings ───────────────────────────
export const settingUpdateSchema = z.object({
  value: z.unknown(),
});
export type SettingUpdate = z.infer<typeof settingUpdateSchema>;
