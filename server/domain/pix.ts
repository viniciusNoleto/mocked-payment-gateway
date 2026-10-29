import { and, count, desc, eq, gte, lt, isNotNull, isNull } from 'drizzle-orm';
import { db } from '../utils/db';
import { pixPayments } from '../db/schema';
import { ApiError } from '../utils/api';
import { EApiCode } from '#shared/constants/apiCode';
import type { PixRow } from './serializers';

export type PixListFilters = {
  from: Date;
  to: Date;
  txid?: string;
  /** `true` = só Pix com cobrança, `false` = só Pix sem cobrança. */
  with_charge?: boolean;
  page: number;
  perPage: number;
};

/** Lista de Pix recebidos num período — a forma mais leve de reconciliação do lado do merchant. */
export async function listReceivedPix(merchantId: string, filters: PixListFilters) {
  const condition = and(
    eq(pixPayments.merchant_id, merchantId),
    gte(pixPayments.paid_at, filters.from),
    lt(pixPayments.paid_at, filters.to),
    filters.txid ? eq(pixPayments.txid, filters.txid) : undefined,
    filters.with_charge === undefined ? undefined : filters.with_charge ? isNotNull(pixPayments.charge_id) : isNull(pixPayments.charge_id),
  );

  const [{ value: total }] = await db.select({ value: count() }).from(pixPayments).where(condition) as [{ value: number }];

  const items = await db
    .select()
    .from(pixPayments)
    .where(condition)
    .orderBy(desc(pixPayments.paid_at))
    .limit(filters.perPage)
    .offset((filters.page - 1) * filters.perPage);

  return { items, total };
}

export async function findPixByE2eId(merchantId: string, e2eId: string): Promise<PixRow> {
  const [pix] = await db
    .select()
    .from(pixPayments)
    .where(and(eq(pixPayments.merchant_id, merchantId), eq(pixPayments.e2e_id, e2eId)))
    .limit(1);

  if (!pix) throw new ApiError(404, EApiCode.NOT_FOUND);

  return pix;
}
