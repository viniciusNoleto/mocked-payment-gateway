export type GatewayConfig = {
  publicBaseUrl: string;
  workerEnabled: boolean;
  workerIntervalMs: number;
  webhookTimeoutMs: number;
  webhookRetrySchedule: number[];
};

export function parseRetrySchedule(value: unknown): number[] {
  const schedule = String(value ?? '')
    .split(',')
    .map(part => part.trim())
    .filter(part => part !== '')
    .map(Number)
    .filter(seconds => Number.isFinite(seconds) && seconds >= 0);

  return schedule.length > 0 ? schedule : [10];
}

export function gatewayConfig(): GatewayConfig {
  const config = useRuntimeConfig();

  return {
    publicBaseUrl: String(config.publicBaseUrl).replace(/\/+$/, ''),
    workerEnabled: Boolean(config.workerEnabled),
    workerIntervalMs: Number(config.workerIntervalMs) || 1000,
    webhookTimeoutMs: Number(config.webhookTimeoutMs) || 5000,
    webhookRetrySchedule: parseRetrySchedule(config.webhookRetrySchedule),
  };
}
