import { describe, expect, it } from 'vitest';
import { END_TO_END_ID_REGEX, TXID_REGEX, generateEndToEndId, generateTxid } from '../../../server/utils/pix/ids';

describe('pix ids', () => {
  it('generates txids within the BCB format', () => {
    for (let i = 0; i < 50; i++) expect(generateTxid()).toMatch(TXID_REGEX);
  });

  it('generates a 32-char endToEndId with ISPB and UTC timestamp', () => {
    const id = generateEndToEndId('18236120', new Date('2026-03-05T14:07:59Z'));

    expect(id).toHaveLength(32);
    expect(id).toMatch(END_TO_END_ID_REGEX);
    expect(id.slice(0, 21)).toBe('E18236120202603051407');
  });
});
