/**
 * Valores monetários trafegam SEMPRE em centavos (inteiros), para evitar
 * erros de ponto flutuante. Formatação acontece só na borda (UI).
 */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function realToCents(real: number): number {
  return Math.round(real * 100);
}
