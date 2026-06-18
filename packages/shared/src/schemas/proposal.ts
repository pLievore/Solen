import { z } from "zod";
import { quoteRequestSchema } from "./quote";

/** Dados do vendedor coletados antes de enviar a proposta ao WhatsApp. */
export const sellerSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  whatsapp: z
    .string()
    .min(10, "WhatsApp inválido")
    .regex(/[\d()+\-\s]+/, "WhatsApp inválido"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  city: z.string().min(1),
  neighborhood: z.string().min(1),
  street: z.string().min(1),
  number: z.string().min(1),
});
export type Seller = z.infer<typeof sellerSchema>;

/** Criação de proposta/lead (POST /proposals). */
export const createProposalSchema = z.object({
  quote: quoteRequestSchema,
  seller: sellerSchema,
});
export type CreateProposal = z.infer<typeof createProposalSchema>;

/** Resposta ao criar a proposta. */
export const createProposalResponseSchema = z.object({
  token: z.string(),
  value: z.number().int(),
  valueFormatted: z.string(),
  whatsappUrl: z.string().url(),
});
export type CreateProposalResponse = z.infer<
  typeof createProposalResponseSchema
>;
