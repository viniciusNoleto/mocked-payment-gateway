import { randomUUID } from 'node:crypto';
import { and, count, desc, eq, gte, lt, lte, gt, isNotNull, sql } from 'drizzle-orm';
import { db } from '../utils/db';
import { charges, merchants } from '../db/schema';
import { ApiError } from '../utils/api';
import { buildBrCode } from '../utils/pix/brcode';
import { generateTxid } from '../utils/pix/ids';
import { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';
import { EChargeConfirmationSource } from '#shared/resources/charge/enums/ChargeConfirmationSource';
import { EWebhookEvent } from '#shared/resources/webhook/enums/WebhookEvent';
import { ERealtimeEvent } from '#shared/resources/realtime/enums/RealtimeEvent';
import { gatewayConfig } from './config';
import { isUniqueViolation } from './errors';
import { enqueueWebhook } from './webhooks';
import { publishRealtimeEvent } from './realtime';
import { confirmChargePayment } from './payments';
import { serializeCharge, type ChargeRow, type MerchantRow } from './serializers';
import { EApiCode } from '#shared/constants/apiCode';

export type CreateChargeInput = {
  amount: number;
  txid?: string;
  expires_in: number;
  description?: string;
  external_reference?: string;
  payer?: { name?: string; document?: string };
  metadata?: Record<string, unknown>;
  /** Só a central passa: sem ele, vale o cenário de auto-pagamento do cliente. */
  auto_pay_after_seconds?: number;
};

export function locationUrl(locationId: string): string {
  return `${gatewayConfig().publicBaseUrl}/api/qr/${locationId}`;
}

async function findByIdempotencyKey(merchantId: string, key: string): Promise<ChargeRow | undefined> {
  const [existing] = await db
    .select()
    .from(charges)
    .where(and(eq(charges.merchant_id, merchantId), eq(charges.idempotency_key, key)))
    .limit(1);

  return existing;
}

/**
 * Cria a cobrança. Com `Idempotency-Key`, uma repetição devolve a cobrança original em vez de criar outra.
 */
export async function createCharge(merchant: MerchantRow, input: CreateChargeInput, idempotencyKey: string | null): Promise<{ charge: ChargeRow; created: boolean }> {
  if (idempotencyKey) {
    const existing = await findByIdempotencyKey(merchant.id, idempotencyKey);
    if (existing) return { charge: existing, created: false };
  }

  const now = new Date();
  const locationId = randomUUID();
  const autoPayAfter = input.auto_pay_after_seconds ?? merchant.simulation_settings.auto_pay_after_seconds;

  try {
    const charge = await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(charges).values({
        merchant_id: merchant.id,
        txid: input.txid ?? generateTxid(),
        location_id: locationId,
        amount: input.amount,
        description: input.description ?? null,
        external_reference: input.external_reference ?? null,
        payer_name: input.payer?.name ?? null,
        payer_document: input.payer?.document ?? null,
        metadata: input.metadata ?? null,
        qr_code: buildBrCode({
          locationUrl: locationUrl(locationId),
          merchantName: merchant.name,
          merchantCity: merchant.city,
          amount: input.amount,
        }),
        expires_in: input.expires_in,
        expires_at: new Date(now.getTime() + input.expires_in * 1000),
        auto_pay_at: autoPayAfter != null ? new Date(now.getTime() + autoPayAfter * 1000) : null,
        idempotency_key: idempotencyKey,
      }).returning();

      await publishRealtimeEvent(tx, merchant, ERealtimeEvent.CHARGE_CREATED, { txid: inserted!.txid, charge: serializeCharge(inserted!) });

      return inserted!;
    });

    return { charge, created: true };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;

    // Corrida entre duas requisições com a mesma Idempotency-Key: a segunda devolve a primeira.
    if (idempotencyKey) {
      const existing = await findByIdempotencyKey(merchant.id, idempotencyKey);
      if (existing) return { charge: existing, created: false };
    }

    throw new ApiError(409, EApiCode.TXID_TAKEN);
  }
}

export async function findChargeByTxid(merchantId: string, txid: string): Promise<ChargeRow> {
  const [charge] = await db
    .select()
    .from(charges)
    .where(and(eq(charges.merchant_id, merchantId), eq(charges.txid, txid)))
    .limit(1);

  if (!charge) throw new ApiError(404, EApiCode.NOT_FOUND);

  return charge;
}

/** Central: a cobrança pelo txid (único no gateway), com o merchant dono dela. */
export async function findChargeWithMerchant(txid: string): Promise<{ charge: ChargeRow; merchant: MerchantRow }> {
  const [row] = await db
    .select({ charge: charges, merchant: merchants })
    .from(charges)
    .innerJoin(merchants, eq(merchants.id, charges.merchant_id))
    .where(eq(charges.txid, txid))
    .limit(1);

  if (!row) throw new ApiError(404, EApiCode.NOT_FOUND);

  return row;
}

export type CentralChargeFilters = {
  status?: EChargeStatus;
  merchant_id?: string;
  page: number;
  perPage: number;
};

/** Central: cobranças de todos os merchants, as mais recentes primeiro. */
export async function listCentralCharges(filters: CentralChargeFilters) {
  const condition = and(
    filters.status ? eq(charges.status, filters.status) : undefined,
    filters.merchant_id ? eq(charges.merchant_id, filters.merchant_id) : undefined,
  );

  const [{ value: total }] = await db.select({ value: count() }).from(charges).where(condition) as [{ value: number }];

  const items = await db
    .select({ charge: charges, merchant: { id: merchants.id, name: merchants.name } })
    .from(charges)
    .innerJoin(merchants, eq(merchants.id, charges.merchant_id))
    .where(condition)
    .orderBy(desc(charges.created_at))
    .limit(filters.perPage)
    .offset((filters.page - 1) * filters.perPage);

  return { items, total };
}

/** Central: quantas cobranças em cada status, e quanto está aguardando pagamento. */
export async function centralChargeStats(merchantId?: string) {
  const rows = await db
    .select({ status: charges.status, count: count(), amount: sql<string>`coalesce(sum(${charges.amount}), 0)` })
    .from(charges)
    .where(merchantId ? eq(charges.merchant_id, merchantId) : undefined)
    .groupBy(charges.status);

  const counts = Object.fromEntries(Object.values(EChargeStatus).map(status => [status, 0])) as Record<EChargeStatus, number>;
  let pendingAmount = 0;

  for (const row of rows) {
    counts[row.status as EChargeStatus] = Number(row.count);
    if (row.status === EChargeStatus.PENDING) pendingAmount = Number(row.amount);
  }

  return { counts, pending_amount: pendingAmount };
}

export type ChargeListFilters = {
  status?: EChargeStatus;
  external_reference?: string;
  from?: Date;
  to?: Date;
  page: number;
  perPage: number;
};

export async function listCharges(merchantId: string, filters: ChargeListFilters) {
  const condition = and(
    eq(charges.merchant_id, merchantId),
    filters.status ? eq(charges.status, filters.status) : undefined,
    filters.external_reference ? eq(charges.external_reference, filters.external_reference) : undefined,
    filters.from ? gte(charges.created_at, filters.from) : undefined,
    filters.to ? lt(charges.created_at, filters.to) : undefined,
  );

  const [{ value: total }] = await db.select({ value: count() }).from(charges).where(condition) as [{ value: number }];

  const items = await db
    .select()
    .from(charges)
    .where(condition)
    .orderBy(desc(charges.created_at))
    .limit(filters.perPage)
    .offset((filters.page - 1) * filters.perPage);

  return { items, total };
}

type TerminalTransition = {
  status: EChargeStatus.CANCELLED | EChargeStatus.EXPIRED;
  event: EWebhookEvent.CHARGE_CANCELLED | EWebhookEvent.CHARGE_EXPIRED;
};

/** Leva uma cobrança pendente a um estado final, com o webhook gravado na mesma transação. */
async function finalizePendingCharge(chargeId: string, merchant: MerchantRow, transition: TerminalTransition): Promise<ChargeRow | null> {
  return db.transaction(async (tx) => {
    const [locked] = await tx.select().from(charges).where(eq(charges.id, chargeId)).for('update').limit(1);
    if (!locked || locked.status !== EChargeStatus.PENDING) return null;

    const now = new Date();

    const [updated] = await tx.update(charges).set({
      status: transition.status,
      ...(transition.status === EChargeStatus.CANCELLED ? { cancelled_at: now } : { expired_at: now }),
      updated_at: now,
    }).where(eq(charges.id, chargeId)).returning();

    await enqueueWebhook(tx, merchant, transition.event, {
      txid: updated!.txid,
      fullData: { txid: updated!.txid, charge: serializeCharge(updated!) },
      minimalData: { txid: updated!.txid },
    });

    await publishRealtimeEvent(tx, merchant, transition.event === EWebhookEvent.CHARGE_CANCELLED ? ERealtimeEvent.CHARGE_CANCELLED : ERealtimeEvent.CHARGE_EXPIRED, {
      txid: updated!.txid,
      charge: serializeCharge(updated!),
    });

    return updated!;
  });
}

export async function cancelCharge(merchant: MerchantRow, txid: string): Promise<ChargeRow> {
  const charge = await findChargeByTxid(merchant.id, txid);
  const cancelled = await finalizePendingCharge(charge.id, merchant, { status: EChargeStatus.CANCELLED, event: EWebhookEvent.CHARGE_CANCELLED });

  if (!cancelled) throw new ApiError(409, EApiCode.CHARGE_NOT_PENDING);

  return cancelled;
}

/** Simulação: expira agora, sem esperar o `expires_at`. */
export async function forceExpireCharge(merchant: MerchantRow, txid: string): Promise<ChargeRow> {
  const charge = await findChargeByTxid(merchant.id, txid);
  const expired = await finalizePendingCharge(charge.id, merchant, { status: EChargeStatus.EXPIRED, event: EWebhookEvent.CHARGE_EXPIRED });

  if (!expired) throw new ApiError(409, EApiCode.CHARGE_NOT_PENDING);

  return expired;
}

async function loadMerchant(merchantId: string): Promise<MerchantRow | undefined> {
  const [merchant] = await db.select().from(merchants).where(eq(merchants.id, merchantId)).limit(1);
  return merchant;
}

/** Worker: expira cobranças pendentes cujo prazo venceu. */
export async function expireDueCharges(limit = 100): Promise<number> {
  const due = await db
    .select({ id: charges.id, merchant_id: charges.merchant_id })
    .from(charges)
    .where(and(eq(charges.status, EChargeStatus.PENDING), lte(charges.expires_at, new Date())))
    .limit(limit);

  let expired = 0;

  for (const charge of due) {
    const merchant = await loadMerchant(charge.merchant_id);
    if (!merchant) continue;

    const result = await finalizePendingCharge(charge.id, merchant, { status: EChargeStatus.EXPIRED, event: EWebhookEvent.CHARGE_EXPIRED });
    if (result) expired++;
  }

  return expired;
}

/** Worker: paga as cobranças com `auto_pay_at` vencido (cenário do cliente ou cobrança de teste da central). */
export async function autoPayDueCharges(limit = 100): Promise<number> {
  const now = new Date();

  const due = await db
    .select({ id: charges.id })
    .from(charges)
    .where(and(
      eq(charges.status, EChargeStatus.PENDING),
      isNotNull(charges.auto_pay_at),
      lte(charges.auto_pay_at, now),
      gt(charges.expires_at, now),
    ))
    .limit(limit);

  let paid = 0;

  for (const charge of due) {
    const result = await confirmChargePayment(charge.id, { source: EChargeConfirmationSource.AUTO_PAY });
    if (result.outcome === 'paid') paid++;
  }

  return paid;
}
