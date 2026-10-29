import type { ISimulationTick } from '#shared/resources/simulation/models/SimulationTick';
import { autoPayDueCharges, expireDueCharges } from './charges';
import { deliverDueWebhooks } from './webhooks';

let current: Promise<ISimulationTick> | null = null;

/**
 * Uma rodada do worker. A ordem importa: pagamentos automáticos antes da expiração,
 * e entregas por último para já levar os webhooks gerados nesta mesma rodada.
 */
async function tick(): Promise<ISimulationTick> {
  const autoPaid = await autoPayDueCharges();
  const expired = await expireDueCharges();
  const webhooksAttempted = await deliverDueWebhooks();

  return { auto_paid: autoPaid, expired, webhooks_attempted: webhooksAttempted };
}

/**
 * Executa uma rodada sem sobrepor outra no mesmo processo (equivalente ao withoutOverlapping).
 * `wait: false` pula a rodada se outra estiver em andamento; `wait: true` espera e roda em seguida.
 */
export async function runWorkerTick({ wait }: { wait: boolean }): Promise<ISimulationTick | null> {
  if (current && !wait) return null;

  while (current) await current.catch(() => undefined);

  current = tick();

  try {
    return await current;
  } finally {
    current = null;
  }
}
