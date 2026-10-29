import { getRouterParam } from 'h3';
import { defineCentralHandler } from '../../../../utils/auth';
import { apiOk } from '../../../../utils/api';
import { assertUuid } from '../../../../utils/validation';
import { findMerchant, rotateWebhookSecret } from '../../../../domain/merchants';
import { EApiCode } from '#shared/constants/apiCode';
import type { IMerchantWebhookSecret } from '#shared/resources/merchant/models/Merchant';

export default defineCentralHandler(async (event) => {
  const merchant = await findMerchant(assertUuid(getRouterParam(event, 'merchant_id')));
  const data: IMerchantWebhookSecret = { webhook_secret: await rotateWebhookSecret(merchant.id) };

  return apiOk(event, data, EApiCode.WEBHOOK_SECRET_ROTATED);
});
