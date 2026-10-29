/** Cenários de simulação de um cliente, configurados só na central, para testar a resiliência do sistema dele. */
export interface ISimulationSettings {
  /** API de integração responde 503 em tudo (PSP fora do ar). */
  outage: boolean;
  /** Atraso artificial em cada resposta da API de integração. */
  latency_ms: number;
  /** Percentual (0-100) de requisições da API de integração que falham com 500. */
  failure_rate: number;
  /** Todos os webhooks são perdidos (ficam como `dropped`). */
  webhook_drop: boolean;
  /** Atraso antes da primeira tentativa de entrega de cada webhook. */
  webhook_delay_seconds: number;
  /** Cópias extras de cada webhook, com o mesmo id de evento. */
  webhook_duplicates: number;
  /** Toda cobrança nova do cliente é paga pelo gateway após N segundos. `null` desliga. */
  auto_pay_after_seconds: number | null;
}
