import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function randomAlphanumeric(length: number, alphabet = ALPHANUMERIC): string {
  const bytes = randomBytes(length);
  let out = '';

  for (let i = 0; i < length; i++) out += alphabet[bytes[i]! % alphabet.length];

  return out;
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hmacSha256(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function generateApiKey(): string {
  return `mpg_test_${randomAlphanumeric(32)}`;
}

export function generateWebhookSecret(): string {
  return `whsec_${randomAlphanumeric(32)}`;
}

/** Parte exibível da chave, para identificar qual chave está em uso sem revelá-la. */
export function apiKeyPrefix(apiKey: string): string {
  return `${apiKey.slice(0, 13)}…`;
}
