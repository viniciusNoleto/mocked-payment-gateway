import { getRouterParam } from 'h3';
import { eq } from 'drizzle-orm';
import { defineApiHandler, apiOk, ApiError } from '../../utils/api';
import { assertUuid } from '../../utils/validation';
import { db } from '../../utils/db';
import { charges, merchants } from '../../db/schema';
import type { IChargeLocation } from '#shared/resources/charge/models/Charge';
import type { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';
import { EApiCode } from '#shared/constants/apiCode';

/** Location do BR Code dinâmico: o que o app do banco do pagador lê ao escanear o QR. Pública. */
export default defineApiHandler(async (event) => {
  const locationId = assertUuid(getRouterParam(event, 'location_id'));

  const [row] = await db
    .select({ charge: charges, merchant_name: merchants.name, pix_key: merchants.pix_key })
    .from(charges)
    .innerJoin(merchants, eq(merchants.id, charges.merchant_id))
    .where(eq(charges.location_id, locationId))
    .limit(1);

  if (!row) throw new ApiError(404, EApiCode.NOT_FOUND);

  const location: IChargeLocation = {
    location_id: row.charge.location_id,
    txid: row.charge.txid,
    amount: row.charge.amount,
    status: row.charge.status as EChargeStatus,
    description: row.charge.description,
    merchant_name: row.merchant_name,
    pix_key: row.pix_key,
    expires_at: row.charge.expires_at.toISOString(),
  };

  return apiOk(event, location);
});
