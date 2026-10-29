import { count, desc, eq, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '../utils/db';
import { charges, merchants, DEFAULT_SIMULATION_SETTINGS } from '../db/schema';
import { ApiError } from '../utils/api';
import { apiKeyPrefix, generateApiKey, generateWebhookSecret, sha256 } from '../utils/crypto';
import { EWebhookAuthMode } from '#shared/resources/webhook/enums/WebhookAuthMode';
import { EWebhookPayloadMode } from '#shared/resources/webhook/enums/WebhookPayloadMode';
import type { ISimulationSettings } from '#shared/resources/simulation/models/SimulationSettings';
import type { MerchantChargeCounts, MerchantRow } from './serializers';
import { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';
import { EApiCode } from '#shared/constants/apiCode';

export type CreateMerchantInput = {
  name: string;
  pix_key?: string;
  city?: string;
  webhook_url?: string | null;
  webhook_auth_mode?: EWebhookAuthMode;
  webhook_payload_mode?: EWebhookPayloadMode;
  /** Permite fixar credenciais conhecidas (seed, testes automatizados). */
  api_key?: string;
  webhook_secret?: string;
};

export async function createMerchant(input: CreateMerchantInput): Promise<{ merchant: MerchantRow; apiKey: string; webhookSecret: string }> {
  const apiKey = input.api_key ?? generateApiKey();
  const webhookSecret = input.webhook_secret ?? generateWebhookSecret();

  const [existing] = await db.select({ id: merchants.id }).from(merchants).where(eq(merchants.api_key_hash, sha256(apiKey))).limit(1);
  if (existing) throw new ApiError(409, EApiCode.API_KEY_TAKEN);

  const [merchant] = await db.insert(merchants).values({
    name: input.name,
    pix_key: input.pix_key ?? randomUUID(), // chave aleatória (EVP)
    city: input.city ?? 'SAO PAULO',
    api_key_hash: sha256(apiKey),
    api_key_prefix: apiKeyPrefix(apiKey),
    webhook_url: input.webhook_url ?? null,
    webhook_secret: webhookSecret,
    webhook_auth_mode: input.webhook_auth_mode ?? EWebhookAuthMode.HMAC,
    webhook_payload_mode: input.webhook_payload_mode ?? EWebhookPayloadMode.FULL,
    simulation_settings: DEFAULT_SIMULATION_SETTINGS,
  }).returning();

  return { merchant: merchant!, apiKey, webhookSecret };
}

export async function findMerchant(merchantId: string): Promise<MerchantRow> {
  const [merchant] = await db.select().from(merchants).where(eq(merchants.id, merchantId)).limit(1);
  if (!merchant) throw new ApiError(404, EApiCode.NOT_FOUND);
  return merchant;
}

export async function listMerchants(page: number, perPage: number) {
  const [{ value: total }] = await db.select({ value: count() }).from(merchants) as [{ value: number }];

  const items = await db
    .select()
    .from(merchants)
    .orderBy(desc(merchants.created_at))
    .limit(perPage)
    .offset((page - 1) * perPage);

  return { items, total };
}

export type UpdateMerchantInput = Partial<Pick<MerchantRow, 'name' | 'pix_key' | 'city' | 'webhook_url'>> & {
  webhook_auth_mode?: EWebhookAuthMode;
  webhook_payload_mode?: EWebhookPayloadMode;
};

export async function updateMerchant(merchantId: string, input: UpdateMerchantInput): Promise<MerchantRow> {
  const [merchant] = await db
    .update(merchants)
    .set({ ...input, updated_at: new Date() })
    .where(eq(merchants.id, merchantId))
    .returning();

  if (!merchant) throw new ApiError(404, EApiCode.NOT_FOUND);

  return merchant;
}

export async function deleteMerchant(merchantId: string): Promise<void> {
  const deleted = await db.delete(merchants).where(eq(merchants.id, merchantId)).returning({ id: merchants.id });
  if (deleted.length === 0) throw new ApiError(404, EApiCode.NOT_FOUND);
}

export async function rotateMerchantApiKey(merchantId: string): Promise<{ merchant: MerchantRow; apiKey: string }> {
  const apiKey = generateApiKey();

  const [merchant] = await db
    .update(merchants)
    .set({ api_key_hash: sha256(apiKey), api_key_prefix: apiKeyPrefix(apiKey), updated_at: new Date() })
    .where(eq(merchants.id, merchantId))
    .returning();

  if (!merchant) throw new ApiError(404, EApiCode.NOT_FOUND);

  return { merchant, apiKey };
}

export async function rotateWebhookSecret(merchantId: string): Promise<string> {
  const secret = generateWebhookSecret();

  await db.update(merchants).set({ webhook_secret: secret, updated_at: new Date() }).where(eq(merchants.id, merchantId));

  return secret;
}

/** Mescla os cenários no banco (`||` do jsonb), sem sobrescrever o que outra requisição mudou entre a leitura e a escrita. */
export async function updateSimulationSettings(merchantId: string, input: Partial<ISimulationSettings>): Promise<MerchantRow> {
  const [updated] = await db
    .update(merchants)
    .set({ simulation_settings: sql`${merchants.simulation_settings} || ${JSON.stringify(input)}::jsonb`, updated_at: new Date() })
    .where(eq(merchants.id, merchantId))
    .returning();

  if (!updated) throw new ApiError(404, EApiCode.NOT_FOUND);

  return updated;
}

/** Central: cobranças aguardando e total de cada merchant, numa consulta só. */
export async function chargeCountsByMerchant(merchantIds: string[]): Promise<Map<string, MerchantChargeCounts>> {
  const result = new Map<string, MerchantChargeCounts>();
  if (merchantIds.length === 0) return result;

  const rows = await db
    .select({
      merchant_id: charges.merchant_id,
      total: count(),
      pending: sql<string>`count(*) filter (where ${charges.status} = ${EChargeStatus.PENDING})`,
    })
    .from(charges)
    .where(inArray(charges.merchant_id, merchantIds))
    .groupBy(charges.merchant_id);

  for (const row of rows) result.set(row.merchant_id, { pending: Number(row.pending), total: Number(row.total) });

  return result;
}
