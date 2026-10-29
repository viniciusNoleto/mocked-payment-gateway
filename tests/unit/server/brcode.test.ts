import { describe, expect, it } from 'vitest';
import { buildBrCode, crc16, parseBrCode } from '../../../server/utils/pix/brcode';

describe('brcode', () => {
  it('crc16 matches the CCITT-FALSE check value', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('crc16 matches the example from the BCB BR Code manual', () => {
    const payload = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304';
    expect(crc16(payload)).toBe('1D3D');
  });

  it('builds a dynamic BR Code that round-trips through the parser', () => {
    const code = buildBrCode({
      locationUrl: 'https://gateway.test/api/qr/2f1c6d1e-4b2a-4c3d-9e8f-0a1b2c3d4e5f',
      merchantName: 'Padaria São João & Filhos Ltda',
      merchantCity: 'São Paulo',
      amount: 12345,
    });

    const parsed = parseBrCode(code);

    expect(parsed.fields['01']).toBe('12');
    expect(parsed.fields['53']).toBe('986');
    expect(parsed.fields['54']).toBe('123.45');
    expect(parsed.fields['59']).toBe('PADARIA SAO JOAO FILHOS L');
    expect(parsed.fields['60']).toBe('SAO PAULO');
    expect(parsed.locationUrl).toBe('gateway.test/api/qr/2f1c6d1e-4b2a-4c3d-9e8f-0a1b2c3d4e5f');
    expect(parsed.amount).toBe(12345);
  });

  it('rejects a code with a tampered CRC', () => {
    const code = buildBrCode({ locationUrl: 'gateway.test/api/qr/x', merchantName: 'A', merchantCity: 'B', amount: 100 });
    const tampered = code.slice(0, -4) + (code.endsWith('0000') ? '1111' : '0000');

    expect(() => parseBrCode(tampered)).toThrow('Invalid CRC');
  });

  it('rejects a code with a tampered amount', () => {
    const code = buildBrCode({ locationUrl: 'gateway.test/api/qr/x', merchantName: 'A', merchantCity: 'B', amount: 100 });

    expect(() => parseBrCode(code.replace('54041.00', '54049.00'))).toThrow('Invalid CRC');
  });
});
