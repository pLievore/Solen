/** Estados base do aparelho (fixos — apenas o preço é editável). */
export const CONDITION_STATE_KEYS = [
  "NEW", // Novo/lacrado
  "LIKE_NEW", // Seminovo sem marcas de uso
  "USED_LIGHT", // Usado com marcas de uso leves
  "USED_HEAVY", // Usado com marcas de uso fortes
] as const;
export type ConditionStateKey = (typeof CONDITION_STATE_KEYS)[number];

export const CONDITION_STATE_LABELS: Record<ConditionStateKey, string> = {
  NEW: "Novo/lacrado",
  LIKE_NEW: "Seminovo sem marcas de uso",
  USED_LIGHT: "Usado com marcas de uso leves",
  USED_HEAVY: "Usado com marcas de uso fortes",
};

/** Tipo de resposta de uma pergunta de avaliação. */
export const ANSWER_TYPES = ["TOGGLE", "CHECK", "SELECT"] as const;
export type AnswerType = (typeof ANSWER_TYPES)[number];

/** Resposta booleana das chaves seletoras. */
export const BOOLEAN_ANSWERS = ["YES", "NO"] as const;
export type BooleanAnswer = (typeof BOOLEAN_ANSWERS)[number];

/** Status de um lead/proposta no dashboard. */
export const PROPOSAL_STATUSES = ["NEW", "CONTACTED", "CLOSED", "LOST"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

/** Status de um post de blog. */
export const POST_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];
