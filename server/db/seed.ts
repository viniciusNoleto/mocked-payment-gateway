import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { apiKeyPrefix, generateApiKey, generateWebhookSecret, sha256 } from '../utils/crypto';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

const db = drizzle(pool, { schema });

async function seed() {
  const name = process.env.SEED_MERCHANT_NAME || 'Loja Teste';
  const apiKey = process.env.SEED_MERCHANT_API_KEY || generateApiKey();
  const webhookSecret = process.env.SEED_MERCHANT_WEBHOOK_SECRET || generateWebhookSecret();
  const webhookUrl = process.env.SEED_MERCHANT_WEBHOOK_URL || null;

  const [existing] = await db.select({ id: schema.merchants.id }).from(schema.merchants).where(eq(schema.merchants.api_key_hash, sha256(apiKey))).limit(1);

  if (existing) {
    console.log(`Merchant da seed já existe (${existing.id}). Nada a fazer.`);
    return;
  }

  const [merchant] = await db.insert(schema.merchants).values({
    name,
    pix_key: randomUUID(),
    api_key_hash: sha256(apiKey),
    api_key_prefix: apiKeyPrefix(apiKey),
    webhook_url: webhookUrl,
    webhook_secret: webhookSecret,
  }).returning();

  console.log('Merchant criado:');
  console.log(`  id:             ${merchant!.id}`);
  console.log(`  nome:           ${merchant!.name}`);
  console.log(`  api_key:        ${apiKey}`);
  console.log(`  webhook_secret: ${webhookSecret}`);
  console.log(`  webhook_url:    ${webhookUrl ?? '(não configurada)'}`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
