import { randomUUID } from 'node:crypto';
import { and, asc, count, desc, eq, gte, inArray, lte, lt } from 'drizzle-orm';
import { db, type DbExecutor } from '../utils/db';
import { merchants, webhookAttempts, webhookDeliveries } from '../db/schema';
import { hmacSha256 } from '../utils/crypto';
import { ApiError } from '../utils/api';
import { EWebhookAuthMode } from '#shared/resources/webhook/enums/WebhookAuthMode';
import { EWebhookPayloadMode } from '#shared/resources/webhook/enums/WebhookPayloadMode';
import { EWebhookEvent } from '#shared/resources/webhook/enums/WebhookEvent';
import { EWebhookDeliveryStatus } from '#shared/resources/webhook-delivery/enums/WebhookDeliveryStatus';
import type { IWebhookPayload } from '#shared/resources/webhook/models/Webhook';
import { gatewayConfig } from './config';
import type { MerchantRow, WebhookDeliveryRow } from './serializers';
import { EApiCode } from '#shared/constants/apiCode';

/** Tempo que uma entrega fica reservada para um worker antes de poder ser retomada por outro. */
const CLAIM_LEASE_MS = 60_000;
const RESPONSE_BODY_LIMIT = 2_000;

export type EnqueueWebhookOptions = {
  txid?: string | null;
  /** Corpo enviado no modo `full`. */
  fullData: Record<string, unknown>;
  /** Corpo enviado no modo `minimal`: só identificadores, o merchant consulta a API para saber o estado. */
  minimalData: Record<string, unknown>;
  /** Força a perda do webhook (simulação). */
  skip?: boolean;
  delaySeconds?: number;
  /** Entregas extras com o mesmo `id` de evento, para testar idempotência do merchant. */
  duplicates?: number;
};

/**
 * Grava o evento no outbox. Deve ser chamado dentro da mesma transação que mudou o estado,
 * para que o webhook exista se, e somente se, a mudança foi gravada.
 */
export async function enqueueWebhook(
  executor: DbExecutor,
  merchant: MerchantRow,
  event: EWebhookEvent,
  options: EnqueueWebhookOptions,
): Promise<WebhookDeliveryRow[]> {
  if (!merchant.webhook_url) return [];

  const settings = merchant.simulation_settings;
  const eventId = randomUUID();
  const now = new Date();

  const payload: IWebhookPayload = {
    id: eventId,
    event,
    created_at: now.toISOString(),
    data: merchant.webhook_payload_mode === EWebhookPayloadMode.MINIMAL ? options.minimalData : options.fullData,
  };

  const dropped = options.skip || settings.webhook_drop;
  const delaySeconds = (options.delaySeconds ?? 0) + settings.webhook_delay_seconds;
  const copies = 1 + Math.max(0, options.duplicates ?? 0) + settings.webhook_duplicates;

  const rows = Array.from({ length: copies }, (_, index) => ({
    merchant_id: merchant.id,
    event,
    txid: options.txid ?? null,
    url: merchant.webhook_url!,
    payload: payload as unknown as Record<string, unknown>,
    status: dropped ? EWebhookDeliveryStatus.DROPPED : EWebhookDeliveryStatus.PENDING,
    max_attempts: gatewayConfig().webhookRetrySchedule.length + 1,
    // Duplicatas saem com um pequeno espaçamento para chegarem como requisições separadas.
    next_attempt_at: dropped ? null : new Date(now.getTime() + delaySeconds * 1000 + index * 500),
  }));

  return executor.insert(webhookDeliveries).values(rows).returning();
}

export function signWebhookBody(secret: string, body: string): string {
  return hmacSha256(secret, body);
}

function buildHeaders(merchant: MerchantRow, delivery: WebhookDeliveryRow, body: string, attempt: number): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'MockedPaymentGateway-Webhook/1.0',
    'X-Webhook-Id': String((delivery.payload as { id?: string }).id ?? delivery.id),
    'X-Webhook-Delivery-Id': delivery.id,
    'X-Webhook-Event': delivery.event,
    'X-Webhook-Attempt': String(attempt),
    'X-Webhook-Timestamp': new Date().toISOString(),
  };

  if (merchant.webhook_auth_mode === EWebhookAuthMode.TOKEN) headers['X-Webhook-Token'] = merchant.webhook_secret;
  else headers['X-Signature'] = signWebhookBody(merchant.webhook_secret, body);

  return headers;
}

/** Reserva entregas vencidas com SKIP LOCKED: várias instâncias podem rodar o worker sem entregar duas vezes. */
async function claimDueDeliveries(limit: number): Promise<WebhookDeliveryRow[]> {
  const now = new Date();

  const due = db
    .select({ id: webhookDeliveries.id })
    .from(webhookDeliveries)
    .where(and(eq(webhookDeliveries.status, EWebhookDeliveryStatus.PENDING), lte(webhookDeliveries.next_attempt_at, now)))
    .orderBy(asc(webhookDeliveries.next_attempt_at))
    .limit(limit)
    .for('update', { skipLocked: true });

  return db
    .update(webhookDeliveries)
    .set({ next_attempt_at: new Date(now.getTime() + CLAIM_LEASE_MS), updated_at: now })
    .where(inArray(webhookDeliveries.id, due))
    .returning();
}

async function attemptDelivery(delivery: WebhookDeliveryRow): Promise<void> {
  const [merchant] = await db.select().from(merchants).where(eq(merchants.id, delivery.merchant_id)).limit(1);
  if (!merchant) return;

  const { webhookTimeoutMs, webhookRetrySchedule } = gatewayConfig();
  const attempt = delivery.attempts + 1;
  const body = JSON.stringify(delivery.payload);
  const startedAt = Date.now();

  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(delivery.url, {
      method: 'POST',
      headers: buildHeaders(merchant, delivery, body, attempt),
      body,
      signal: AbortSignal.timeout(webhookTimeoutMs),
      redirect: 'manual',
    });

    statusCode = response.status;
    responseBody = (await response.text().catch(() => '')).slice(0, RESPONSE_BODY_LIMIT);
  } catch (err) {
    error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }

  const durationMs = Date.now() - startedAt;
  const delivered = statusCode !== null && statusCode >= 200 && statusCode < 300;
  const exhausted = attempt >= delivery.max_attempts;
  const now = new Date();
  const retryDelaySeconds = webhookRetrySchedule[Math.min(attempt - 1, webhookRetrySchedule.length - 1)]!;

  await db.transaction(async (tx) => {
    await tx.insert(webhookAttempts).values({
      delivery_id: delivery.id,
      attempt,
      url: delivery.url,
      status_code: statusCode,
      response_body: responseBody,
      error: error ?? (delivered ? null : `HTTP ${statusCode}`),
      duration_ms: durationMs,
    });

    await tx.update(webhookDeliveries).set({
      attempts: attempt,
      status: delivered ? EWebhookDeliveryStatus.DELIVERED : exhausted ? EWebhookDeliveryStatus.FAILED : EWebhookDeliveryStatus.PENDING,
      next_attempt_at: delivered || exhausted ? null : new Date(now.getTime() + retryDelaySeconds * 1000),
      last_status_code: statusCode,
      last_error: delivered ? null : error ?? `HTTP ${statusCode}`,
      delivered_at: delivered ? now : null,
      updated_at: now,
    }).where(eq(webhookDeliveries.id, delivery.id));
  });
}

/** Entrega os webhooks vencidos. Retorna quantas tentativas foram feitas. */
export async function deliverDueWebhooks(limit = 20): Promise<number> {
  const claimed = await claimDueDeliveries(limit);
  await Promise.all(claimed.map(delivery => attemptDelivery(delivery).catch(error => console.error('[webhook]', error))));
  return claimed.length;
}
