import { describe, expect, it } from 'vitest';
import { parseRetrySchedule } from '../../../server/domain/config';

describe('parseRetrySchedule', () => {
  it('parses a comma separated list', () => {
    expect(parseRetrySchedule('10, 30,60')).toEqual([10, 30, 60]);
  });

  it('accepts a single number (runtime config may coerce it)', () => {
    expect(parseRetrySchedule(5)).toEqual([5]);
  });

  it('ignores invalid entries and falls back when empty', () => {
    expect(parseRetrySchedule('a,-1,20')).toEqual([20]);
    expect(parseRetrySchedule('')).toEqual([10]);
  });
});
