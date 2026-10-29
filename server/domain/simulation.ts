import { ApiError } from '../utils/api';
import { EApiCode } from '#shared/constants/apiCode';
import { confirmChargePayment, type ConfirmPaymentOptions } from './payments';
import type { ChargeRow, PixRow } from './serializers';

/** Paga uma cobrança do merchant, traduzindo os desfechos não pagos em erros de API. */
export async function payCharge(charge: ChargeRow, options: ConfirmPaymentOptions): Promise<{ charge: ChargeRow; pix: PixRow }> {
  if (options.paidAt && options.paidAt < charge.created_at) {
    throw new ApiError(422, EApiCode.VALIDATION_ERROR, { errors: [{ path: 'paid_at', code: 'paid_at_before_creation' }] });
  }

  const result = await confirmChargePayment(charge.id, options);

  if (result.outcome === 'not_found') throw new ApiError(404, EApiCode.NOT_FOUND);
  if (result.outcome === 'already_paid') throw new ApiError(409, EApiCode.CHARGE_ALREADY_PAID);
  if (result.outcome === 'not_payable') throw new ApiError(409, EApiCode.CHARGE_NOT_PAYABLE);

  return { charge: result.charge, pix: result.pix };
}
