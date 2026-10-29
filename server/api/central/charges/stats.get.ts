import { z } from 'zod';
import { defineCentralHandler } from '../../../utils/auth';
import { apiOk } from '../../../utils/api';
import { readValidatedQuery } from '../../../utils/validation';
import { centralChargeStats } from '../../../domain/charges';
import type { IChargeStats } from '#shared/resources/charge/models/ChargeStats';

const querySchema = z.object({ merchant_id: z.uuid().optional() });

export default defineCentralHandler(async (event) => {
  const query = readValidatedQuery(event, querySchema);
  const data: IChargeStats = await centralChargeStats(query.merchant_id);

  return apiOk(event, data);
});
