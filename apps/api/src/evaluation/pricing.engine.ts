import { formatBRL } from "@vendy/shared";

export type BreakdownItem = {
  type: "base" | "delta" | "scrap";
  label: string;
  amount: number; // centavos
};

export type EngineInput = {
  isScrap: boolean;
  scrapValue?: number;
  base?: { label: string; amount: number };
  deltas?: BreakdownItem[];
  minValue?: number;
};

export type EngineResult = {
  isScrap: boolean;
  value: number;
  valueFormatted: string;
  breakdown: BreakdownItem[];
};

/**
 * Motor de calculo PURO (sem I/O) — ver docs/PRICING.md.
 * Regras: knockout tem prioridade absoluta; valor final nunca abaixo do piso.
 */
export function computeQuote(input: EngineInput): EngineResult {
  const minValue = input.minValue ?? 0;

  if (input.isScrap) {
    const value = Math.max(input.scrapValue ?? 0, minValue);
    return {
      isScrap: true,
      value,
      valueFormatted: formatBRL(value),
      breakdown: [{ type: "scrap", label: "Avaliacao de sucata", amount: value }],
    };
  }

  const breakdown: BreakdownItem[] = [];
  let total = 0;

  if (input.base) {
    breakdown.push({ type: "base", label: input.base.label, amount: input.base.amount });
    total += input.base.amount;
  }
  for (const d of input.deltas ?? []) {
    breakdown.push(d);
    total += d.amount;
  }

  const value = Math.max(total, minValue);
  return { isScrap: false, value, valueFormatted: formatBRL(value), breakdown };
}
