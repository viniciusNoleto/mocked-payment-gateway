import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { apiKeyPrefix, generateApiKey, hmacSha256, safeEqual } from '../../../server/utils/crypto';

describe('crypto', () => {
  it('signs like a merchant would verify (hex HMAC-SHA256 of the raw body)', () => {
    const body = JSON.stringify({ id: '1', event: 'charge.paid' });
    const expected = createHmac('sha256', 'secret').update(body).digest('hex');

    expect(hmacSha256('secret', body)).toBe(expected);
  });

  it('compares strings in constant time without throwing on different lengths', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });

  it('generates api keys with a stable prefix', () => {
    const key = generateApiKey();

    expect(key).toMatch(/^mpg_test_[a-zA-Z0-9]{32}$/);
    expect(apiKeyPrefix(key)).toBe(`${key.slice(0, 13)}…`);
  });
});
