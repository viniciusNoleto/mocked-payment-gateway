import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appClient } from '~/utils/appClient';
import { getChargesService } from '~/resources/charge/services/getCharges';
import { getChargeStatsService } from '~/resources/charge/services/getChargeStats';
import { getChargeService } from '~/resources/charge/services/getCharge';
import { createChargeService } from '~/resources/charge/services/createCharge';
import { payChargeService } from '~/resources/charge/services/payCharge';
import { expireChargeService } from '~/resources/charge/services/expireCharge';
import { cancelChargeService } from '~/resources/charge/services/cancelCharge';
import { getMerchantsService } from '~/resources/merchant/services/getMerchants';
import { getMerchantService } from '~/resources/merchant/services/getMerchant';
import { createMerchantService } from '~/resources/merchant/services/createMerchant';
import { updateMerchantService } from '~/resources/merchant/services/updateMerchant';
import { deleteMerchantService } from '~/resources/merchant/services/deleteMerchant';
import { rotateMerchantApiKeyService } from '~/resources/merchant/services/rotateMerchantApiKey';
import { rotateMerchantWebhookSecretService } from '~/resources/merchant/services/rotateMerchantWebhookSecret';
import { updateMerchantSimulationService } from '~/resources/merchant/services/updateMerchantSimulation';
import { createPixService } from '~/resources/pix/services/createPix';

vi.mock('~/utils/appClient', () => ({
  appClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const signal = new AbortController().signal;
const ctx = { signal };

describe('services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('charge', () => {
    it('getChargesService without query', () => {
      getChargesService(ctx);
      expect(appClient.get).toHaveBeenCalledWith('/api/central/charges', { signal });
    });

    it('getChargesService with filters', () => {
      getChargesService({ ...ctx, query: { status: 'pending', merchant_id: 'm1', page: 2, per_page: 50 } });
      expect(appClient.get).toHaveBeenCalledWith('/api/central/charges?status=pending&merchant_id=m1&page=2&per_page=50', { signal });
    });

    it('getChargeStatsService', () => {
      getChargeStatsService(ctx);
      expect(appClient.get).toHaveBeenCalledWith('/api/central/charges/stats', { signal });

      getChargeStatsService({ ...ctx, query: { merchant_id: 'm1' } });
      expect(appClient.get).toHaveBeenCalledWith('/api/central/charges/stats?merchant_id=m1', { signal });
    });

    it('getChargeService', () => {
      getChargeService({ ...ctx, txid: 'abc' });
      expect(appClient.get).toHaveBeenCalledWith('/api/central/charges/abc', { signal });
    });

    it('createChargeService', () => {
      createChargeService({ body: { merchant_id: 'm1', amount: 5000 } });
      expect(appClient.post).toHaveBeenCalledWith('/api/central/charges', { body: { merchant_id: 'm1', amount: 5000 } });
    });

    it('payChargeService', () => {
      payChargeService({ txid: 'abc', body: { webhook: { mode: 'skip' } } });
      expect(appClient.post).toHaveBeenCalledWith('/api/central/charges/abc/pay', { body: { webhook: { mode: 'skip' } } });
    });

    it('expireChargeService', () => {
      expireChargeService({ txid: 'abc' });
      expect(appClient.post).toHaveBeenCalledWith('/api/central/charges/abc/expire', { body: {} });
    });

    it('cancelChargeService', () => {
      cancelChargeService({ txid: 'abc' });
      expect(appClient.post).toHaveBeenCalledWith('/api/central/charges/abc/cancel', { body: {} });
    });
  });

  describe('merchant', () => {
    it('getMerchantsService', () => {
      getMerchantsService({ ...ctx, query: { page: 3 } });
      expect(appClient.get).toHaveBeenCalledWith('/api/central/merchants?page=3', { signal });
    });

    it('getMerchantService', () => {
      getMerchantService({ ...ctx, merchantId: 'm1' });
      expect(appClient.get).toHaveBeenCalledWith('/api/central/merchants/m1', { signal });
    });

    it('createMerchantService', () => {
      createMerchantService({ body: { name: 'Loja' } });
      expect(appClient.post).toHaveBeenCalledWith('/api/central/merchants', { body: { name: 'Loja' } });
    });

    it('updateMerchantService', () => {
      updateMerchantService({ merchantId: 'm1', body: { name: 'X' } });
      expect(appClient.put).toHaveBeenCalledWith('/api/central/merchants/m1', { body: { name: 'X' } });
    });

    it('deleteMerchantService', () => {
      deleteMerchantService({ merchantId: 'm1' });
      expect(appClient.delete).toHaveBeenCalledWith('/api/central/merchants/m1');
    });

    it('rotateMerchantApiKeyService', () => {
      rotateMerchantApiKeyService({ merchantId: 'm1' });
      expect(appClient.patch).toHaveBeenCalledWith('/api/central/merchants/m1/rotate-api-key', { body: {} });
    });

    it('rotateMerchantWebhookSecretService', () => {
      rotateMerchantWebhookSecretService({ merchantId: 'm1' });
      expect(appClient.patch).toHaveBeenCalledWith('/api/central/merchants/m1/rotate-webhook-secret', { body: {} });
    });

    it('updateMerchantSimulationService', () => {
      updateMerchantSimulationService({ merchantId: 'm1', body: { outage: true } });
      expect(appClient.put).toHaveBeenCalledWith('/api/central/merchants/m1/simulation', { body: { outage: true } });
    });
  });

  describe('pix', () => {
    it('createPixService', () => {
      createPixService({ body: { merchant_id: 'm1', amount: 2500 } });
      expect(appClient.post).toHaveBeenCalledWith('/api/central/pix', { body: { merchant_id: 'm1', amount: 2500 } });
    });
  });
});
