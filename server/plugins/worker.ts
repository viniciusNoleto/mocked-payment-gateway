import { gatewayConfig } from '../domain/config';
import { runWorkerTick } from '../domain/worker';

/** Worker em processo: substitui fila + scheduler (queue:work / schedule:run do Laravel). */
export default defineNitroPlugin((nitroApp) => {
  if (import.meta.prerender) return;

  const { workerEnabled, workerIntervalMs } = gatewayConfig();
  if (!workerEnabled) return;

  const timer = setInterval(() => {
    runWorkerTick({ wait: false }).catch(error => console.error('[worker]', error));
  }, workerIntervalMs);

  nitroApp.hooks.hook('close', () => clearInterval(timer));
});
