import { getRouterParam } from 'h3';
import { defineCentralHandler } from '../../../../utils/auth';
import { apiOk } from '../../../../utils/api';
import { assertUuid, readValidatedJson } from '../../../../utils/validation';
import { chargeCountsByMerchant, updateSimulationSettings } from '../../../../domain/merchants';
import { serializeCentralMerchant } from '../../../../domain/serializers';
import { simulationSettingsSchema } from '../../../../schemas/simulation';
import { EApiCode } from '#shared/constants/apiCode';

/** Cenários de simulação do cliente. Campos omitidos mantêm o valor atual. */
export default defineCentralHandler(async (event) => {
  const merchantId = assertUuid(getRouterParam(event, 'merchant_id'));
  const body = await readValidatedJson(event, simulationSettingsSchema);
  const merchant = await updateSimulationSettings(merchantId, body);

  const counts = await chargeCountsByMerchant([merchant.id]);

  return apiOk(event, serializeCentralMerchant(merchant, counts.get(merchant.id)), EApiCode.SIMULATION_SETTINGS_UPDATED);
});
