/**
 * Disparo de eventos de conversao para o GA4 (se NEXT_PUBLIC_GA_ID estiver
 * configurado). Seguro de chamar mesmo sem analytics: vira no-op.
 *
 * Eventos canonicos do funil de avaliacao (use estes nomes no GA4):
 *   - page_view           -> automatico do GA4 (Enhanced Measurement)
 *   - iniciou_avaliacao    -> clicou numa categoria na home
 *   - selecionou_modelo    -> escolheu o modelo do aparelho
 *   - avancou_etapa        -> avancou um passo (param `etapa`: versao |
 *                             iniciou_questionario | dados_contato)
 *   - enviou_avaliacao     -> enviou as respostas e gerou a proposta
 *   - lead                 -> seguiu para o WhatsApp (lead efetivo)
 */
type GtagParams = Record<string, string | number | boolean | undefined>;

export function track(event: string, params: GtagParams = {}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  if (typeof w.gtag === "function") {
    w.gtag("event", event, params);
  }
}
