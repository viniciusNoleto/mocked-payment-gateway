import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createHmac } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ApiResponse } from '#shared/types/api';
import type { ICharge } from '#shared/resources/charge/models/Charge';
import type { IMerchantWithCredentials } from '#shared/resources/merchant/models/Merchant';
import type { ISimulationPayment } from '#shared/resources/simulation/models/SimulationPayment';
import type { IPix } from '#shared/resources/pix/models/Pix';
import type { PaginatedResponse } from '#shared/types/api';

/**
 * Fluxo completo contra um gateway rodando (com o worker ligado). Pulado se E2E_BASE_URL não estiver definido:
 *   E2E_BASE_URL=http://localhost:3000 npm test
 * Usa a central (aberta) para criar e remover o cliente de teste.
 * Com o gateway no Docker, use E2E_WEBHOOK_HOST=host.docker.internal.
 */
const BASE_URL = process.env.E2E_BASE_URL;
const WEBHOOK_HOST = process.env.E2E_WEBHOOK_HOST ?? 'localhost';

type ReceivedWebhook = { headers: http.IncomingHttpHeaders; rawBody: string; body: any };

async function call<T>(path: string, token: string | null, init: RequestInit = {}): Promise<{ status: number; json: ApiResponse<T> }> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });

  return { status: response.status, json: await response.json() as ApiResponse<T> };
}

async function waitFor<T>(fn: () => T | undefined, timeoutMs = 10_000): Promise<T> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const value = fn();
    if (value !== undefined) return value;
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  throw new Error('Timed out waiting for condition');
}

describe.skipIf(!BASE_URL)('e2e: Pix flow', () => {
  const received: ReceivedWebhook[] = [];
  let receiver: http.Server;
  let merchant: IMerchantWithCredentials;

  beforeAll(async () => {
    receiver = http.createServer((req, res) => {
      let rawBody = '';
      req.on('data', chunk => (rawBody += chunk));
      req.on('end', () => {
        received.push({ headers: req.headers, rawBody, body: JSON.parse(rawBody) });
        res.writeHead(204).end();
      });
    });

    await new Promise<void>(resolve => receiver.listen(0, resolve));
    const { port } = receiver.address() as AddressInfo;

    const { json } = await call<IMerchantWithCredentials>('/api/central/merchants', null, {
      method: 'POST',
      body: JSON.stringify({ name: 'E2E Merchant', webhook_url: `http://${WEBHOOK_HOST}:${port}/webhook` }),
    });

    expect(json.success).toBe(true);
    merchant = json.data;
  });

  afterAll(async () => {
    if (merchant) await call(`/api/central/merchants/${merchant.id}`, null, { method: 'DELETE' });
    receiver?.close();
  });

  it('creates, pays the exact amount and notifies with a valid signature', async () => {
    const created = await call<ICharge>('/api/charges', merchant.api_key, {
      method: 'POST',
      headers: { 'Idempotency-Key': 'e2e-order-1' },
      body: JSON.stringify({ amount: 5000, description: 'Pedido E2E' }),
    });

    expect(created.status).toBe(201);
    expect(created.json.code).toBe('charge_created');
    expect(created.json).not.toHaveProperty('message');
    expect(created.json.data.status).toBe('pending');
    expect(created.json.data.qr_code).toMatch(/^000201/);

    const replay = await call<ICharge>('/api/charges', merchant.api_key, {
      method: 'POST',
      headers: { 'Idempotency-Key': 'e2e-order-1' },
      body: JSON.stringify({ amount: 5000 }),
    });

    expect(replay.status).toBe(200);
    expect(replay.json.code).toBe('charge_replayed');
    expect(replay.json.data.id).toBe(created.json.data.id);

    const { txid } = created.json.data;
    const paid = await call<ISimulationPayment>(`/api/central/charges/${txid}/pay`, null, { method: 'POST', body: '{}' });

    expect(paid.status).toBe(200);
    expect(paid.json.data.pix.e2e_id).toHaveLength(32);
    expect(paid.json.data.pix.amount).toBe(5000);

    const webhook = await waitFor(() => received.find(hook => hook.body.event === 'charge.paid'));
    const signature = createHmac('sha256', merchant.webhook_secret).update(webhook.rawBody).digest('hex');

    expect(webhook.headers['x-signature']).toBe(signature);
    expect(webhook.body.data.txid).toBe(txid);
    expect(webhook.body.data.pix[0].e2e_id).toBe(paid.json.data.pix.e2e_id);

    const consulted = await call<ICharge>(`/api/charges/${txid}`, merchant.api_key);
    expect(consulted.json.data.status).toBe('paid');
    expect(consulted.json.data).not.toHaveProperty('qr_code_image');

    const again = await call(`/api/central/charges/${txid}/pay`, null, { method: 'POST', body: '{}' });
    expect(again.status).toBe(409);
    expect(again.json.code).toBe('charge_already_paid');
  });

  it('drops the webhook and leaves the payment to reconciliation', async () => {
    const created = await call<ICharge>('/api/charges', merchant.api_key, { method: 'POST', body: JSON.stringify({ amount: 100 }) });
    const { txid } = created.json.data;

    const paid = await call<ISimulationPayment>(`/api/central/charges/${txid}/pay`, null, { method: 'POST', body: JSON.stringify({ webhook: { mode: 'skip' } }) });

    const reconciled = await call<PaginatedResponse<IPix>>(`/api/received?txid=${txid}`, merchant.api_key);
    expect(reconciled.json.data.items.map(pix => pix.e2e_id)).toEqual([paid.json.data.pix.e2e_id]);
    expect(received.some(hook => hook.body.data?.txid === txid)).toBe(false);
  });

  it('keeps simulation out of the integration API', async () => {
    const route = await call('/api/simulate/settings', merchant.api_key);
    expect(route.status).toBe(404);

    const me = await call('/api/me', merchant.api_key);
    expect(me.json.data).not.toHaveProperty('simulation_settings');
  });

  it('answers 503 for every merchant route during a simulated outage', async () => {
    await call(`/api/central/merchants/${merchant.id}/simulation`, null, { method: 'PUT', body: JSON.stringify({ outage: true }) });

    const during = await call('/api/charges', merchant.api_key);
    expect(during.status).toBe(503);
    expect(during.json.code).toBe('gateway_unavailable');

    await call(`/api/central/merchants/${merchant.id}/simulation`, null, { method: 'PUT', body: JSON.stringify({ outage: false }) });

    const after = await call('/api/charges', merchant.api_key);
    expect(after.status).toBe(200);
  });

  it('auto-pays and duplicates webhooks by the client scenarios', async () => {
    const scenarios = { auto_pay_after_seconds: 1, webhook_duplicates: 1 };
    await call(`/api/central/merchants/${merchant.id}/simulation`, null, { method: 'PUT', body: JSON.stringify(scenarios) });

    const created = await call<ICharge>('/api/charges', merchant.api_key, { method: 'POST', body: JSON.stringify({ amount: 700 }) });
    const { txid } = created.json.data;
    expect(created.json.data.auto_pay_at).not.toBeNull();

    const copies = await waitFor(() => {
      const hooks = received.filter(hook => hook.body.event === 'charge.paid' && hook.body.data.txid === txid);
      return hooks.length === 2 ? hooks : undefined;
    });
    expect(copies[0]!.headers['x-webhook-id']).toBe(copies[1]!.headers['x-webhook-id']);

    await call(`/api/central/merchants/${merchant.id}/simulation`, null, { method: 'PUT', body: JSON.stringify({ auto_pay_after_seconds: null, webhook_duplicates: 0 }) });
  });
});
