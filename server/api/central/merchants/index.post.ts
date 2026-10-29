import { z } from 'zod';
import { defineCentralHandler } from '../../../utils/auth';
import { apiOk } from '../../../utils/api';
import { readValidatedJson } from '../../../utils/validation';
import { createMerchant } from '../../../domain/merchants';
import { serializeCentralMerchant } from '../../../domain/serializers';
import type { IMerchantWithCredentials } from '#shared/resources/merchant/models/Merchant';
import { merchantFields } from '../../../schemas/merchant';
import { EApiCode } from '#shared/constants/apiCode';

const bodySchema = z.object({
  name: merchantFields.name,
  pix_key: merchantFields.pix_key.optional(),
  city: merchantFields.city.optional(),
  webhook_url: merchantFields.webhook_url.optional(),
  webhook_auth_mode: merchantFields.webhook_auth_mode.optional(),
  webhook_payload_mode: merchantFields.webhook_payload_mode.optional(),
});

export default defineCentralHandler(async (event) => {
  const body = await readValidatedJson(event, bodySchema);
  const { merchant, apiKey } = await createMerchant(body);

  const data: IMerchantWithCredentials = { ...serializeCentralMerchant(merchant), api_key: apiKey };

  return apiOk(event, data, EApiCode.MERCHANT_CREATED, 201);
});
