import { describe, expect, it } from 'vitest';
import { centsToInput, formatCountdown, parseMoneyInput } from '~/composables/useFormat';

describe('format', () => {
  it('parseMoneyInput accepts Brazilian and dotted decimals', () => {
    expect(parseMoneyInput('49,90')).toBe(4990);
    expect(parseMoneyInput('49.90')).toBe(4990);
    expect(parseMoneyInput('R$ 1.234,56')).toBe(123456);
    expect(parseMoneyInput('10')).toBe(1000);
  });

  it('parseMoneyInput rejects zero and garbage', () => {
    expect(parseMoneyInput('0')).toBeNull();
    expect(parseMoneyInput('abc')).toBeNull();
    expect(parseMoneyInput('1,234')).toBeNull();
  });

  it('centsToInput round-trips', () => {
    expect(centsToInput(4990)).toBe('49,90');
    expect(parseMoneyInput(centsToInput(123456))).toBe(123456);
  });

  it('formatCountdown pads and clamps', () => {
    expect(formatCountdown(252)).toBe('04:12');
    expect(formatCountdown(3852)).toBe('1:04:12');
    expect(formatCountdown(-5)).toBe('00:00');
  });
});
