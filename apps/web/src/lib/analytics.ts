/**
 * Disparo de eventos de conversao para o GA4 (se NEXT_PUBLIC_GA_ID estiver
 * configurado). Seguro de chamar mesmo sem analytics: vira no-op.
 */
type GtagParams = Record<string, string | number | boolean | undefined>;

export function track(event: string, params: GtagParams = {}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  if (typeof w.gtag === "function") {
    w.gtag("event", event, params);
  }
}
