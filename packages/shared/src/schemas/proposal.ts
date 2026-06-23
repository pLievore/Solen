import { z } from "zod";
import { quoteRequestSchema } from "./quote";

/**
 * Dados do vendedor. Nome e WhatsApp sao capturados ANTES de revelar a
 * avaliacao (garante o lead). Endereco e opcional (nao coletado por enquanto).
 */
export const sellerSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  whatsapp: z
    .string()
    .min(10, "WhatsApp inválido")
    .regex(/[\d()+\-\s]+/, "WhatsApp inválido"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido").optional(),
  city: z.string().min(1).optional(),
  neighborhood: z.string().min(1).optional(),
  street: z.string().min(1).optional(),
  number: z.string().min(1).optional(),
});
export type Seller = z.infer<typeof sellerSchema>;

/** Pontos de coleta disponíveis (+ opção de envio pelos Correios). */
export const PICKUP_POINTS = [
  { id: "sp-pinheiros", name: "Estação Pinheiros", city: "São Paulo", uf: "SP", region: "São Paulo" },
  { id: "sp-morumbi", name: "Estação Morumbi", city: "São Paulo", uf: "SP", region: "São Paulo" },
  { id: "pg-centro", name: "Centro", city: "Ponta Grossa", uf: "PR", region: "Ponta Grossa" },
  { id: "pg-uvaranas", name: "Uvaranas", city: "Ponta Grossa", uf: "PR", region: "Ponta Grossa" },
  { id: "correios", name: "Envio pelos Correios", city: "", uf: "", region: "Correios" },
] as const;

export type PickupPointId = (typeof PICKUP_POINTS)[number]["id"];

const pickupPointIds = PICKUP_POINTS.map((p) => p.id) as [
  PickupPointId,
  ...PickupPointId[],
];

/** Rótulo legível do ponto de coleta (usado na mensagem do WhatsApp/e-mail). */
export function pickupPointLabel(id: string): string {
  const p = PICKUP_POINTS.find((x) => x.id === id);
  if (!p) return id;
  if (p.id === "correios") return "Envio pelos Correios";
  return `${p.name} — ${p.city}/${p.uf}`;
}

/**
 * Criação de proposta/lead (POST /proposals). O ponto de coleta e opcional
 * aqui porque o lead e criado ANTES de o usuario ver o valor; o pickup e
 * escolhido depois e gravado via PATCH /proposals/:token/pickup.
 */
export const createProposalSchema = z.object({
  quote: quoteRequestSchema,
  seller: sellerSchema,
  pickupPointId: z.enum(pickupPointIds).optional(),
});
export type CreateProposal = z.infer<typeof createProposalSchema>;

/** Atualização do ponto de coleta (PATCH /proposals/:token/pickup). */
export const updateProposalPickupSchema = z.object({
  pickupPointId: z.enum(pickupPointIds),
});
export type UpdateProposalPickup = z.infer<typeof updateProposalPickupSchema>;

const breakdownItemSchema = z.object({
  type: z.string(),
  label: z.string(),
  amount: z.number().int(),
});

/** Resposta ao criar a proposta (inclui o resultado da avaliação). */
export const createProposalResponseSchema = z.object({
  token: z.string(),
  value: z.number().int(),
  valueFormatted: z.string(),
  isScrap: z.boolean(),
  breakdown: z.array(breakdownItemSchema),
  whatsappUrl: z.string().url(),
});
export type CreateProposalResponse = z.infer<
  typeof createProposalResponseSchema
>;
