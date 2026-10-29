import { describe, expect, it } from 'vitest';
import { generateCpf, isValidCpf, resolvePayer } from '../../../server/utils/pix/payer';
import { PIX_BANKS } from '../../../server/utils/pix/banks';

describe('payer', () => {
  it('generates CPFs with valid check digits', () => {
    for (let i = 0; i < 100; i++) expect(isValidCpf(generateCpf())).toBe(true);
  });

  it('validates a known CPF and rejects a wrong one', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('52998224726')).toBe(false);
    expect(isValidCpf('11111111111')).toBe(false);
  });

  it('keeps provided payer data and fills the bank from the ISPB', () => {
    const payer = resolvePayer({ name: 'Maria', document: '52998224725', ispb: '18236120' });

    expect(payer).toEqual({ name: 'Maria', document: '52998224725', ispb: '18236120', bank_name: 'Nu Pagamentos S.A.' });
  });

  it('fills missing data with a known bank', () => {
    const payer = resolvePayer();

    expect(PIX_BANKS.map(bank => bank.ispb)).toContain(payer.ispb);
    expect(isValidCpf(payer.document)).toBe(true);
  });
});
