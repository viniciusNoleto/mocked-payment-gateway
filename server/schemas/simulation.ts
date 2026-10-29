import { z } from 'zod';
import { ESimulationWebhookMode } from '#shared/resources/simulation/enums/SimulationWebhookMode';
import type { WebhookSimulationOptions } from '../domain/payments';

export const payerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  document: z.string().regex(/^(\d{11}|\d{14})$/).optional(),
  ispb: z.string().regex(/^\d{8}$/).optional(),
});

export const webhookSimulationSchema = z.object({
  /** `skip` perde o webhook (fica `dropped`). */
  mode: z.enum(ESimulationWebhookMode).default(ESimulationWebhookMode.SEND),
  delay_seconds: z.number().int().min(0).max(24 * 60 * 60).default(0),
  /** Cópias extras do mesmo evento, para testar idempotência. */
  duplicates: z.number().int().min(0).max(10).default(0),
}).default({ mode: ESimulationWebhookMode.SEND, delay_seconds: 0, duplicates: 0 });

/** Cenários do cliente. Campos omitidos mantêm o valor atual. */
export const simulationSettingsSchema = z.object({
  outage: z.boolean(),
  latency_ms: z.number().int().min(0).max(60_000),
  failure_rate: z.number().int().min(0).max(100),
  webhook_drop: z.boolean(),
  webhook_delay_seconds: z.number().int().min(0).max(24 * 60 * 60),
  webhook_duplicates: z.number().int().min(0).max(10),
  auto_pay_after_seconds: z.number().int().min(0).max(24 * 60 * 60).nullable(),
}).partial();

export function toWebhookOptions(webhook: z.output<typeof webhookSimulationSchema>): WebhookSimulationOptions {
  return {
    skip: webhook.mode === ESimulationWebhookMode.SKIP,
    delaySeconds: webhook.delay_seconds,
    duplicates: webhook.duplicates,
  };
}
