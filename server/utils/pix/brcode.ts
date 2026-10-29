/**
 * BR Code (EMV QRCPS-MPM) de Pix dinâmico: o QR aponta para uma URL de location,
 * e o "copia e cola" é esta mesma string.
 */

export type BrCodeInput = {
  locationUrl: string;
  merchantName: string;
  merchantCity: string;
  amount: number; // centavos
};

function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

/** Remove acentos e caracteres fora do conjunto aceito pelo EMV, e limita o tamanho. */
function sanitize(value: string, maxLength: number): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .\-]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .trim()
    .slice(0, maxLength)
    .trim() || 'NA';
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no campo 63. */
export function crc16(payload: string): string {
  let crc = 0xFFFF;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;

    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function buildBrCode({ locationUrl, merchantName, merchantCity, amount }: BrCodeInput): string {
  const merchantAccount = field('00', 'br.gov.bcb.pix') + field('25', locationUrl.replace(/^https?:\/\//, ''));

  const payload = [
    field('00', '01'),
    field('01', '12'), // dinâmico, uso único
    field('26', merchantAccount),
    field('52', '0000'),
    field('53', '986'),
    field('54', (amount / 100).toFixed(2)),
    field('58', 'BR'),
    field('59', sanitize(merchantName, 25)),
    field('60', sanitize(merchantCity, 15)),
    field('62', field('05', '***')),
  ].join('') + '6304';

  return payload + crc16(payload);
}

export type ParsedBrCode = {
  fields: Record<string, string>;
  locationUrl: string | null;
  amount: number | null;
};

function parseTlv(payload: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let cursor = 0;

  while (cursor < payload.length) {
    const id = payload.slice(cursor, cursor + 2);
    const length = Number(payload.slice(cursor + 2, cursor + 4));

    if (id.length < 2 || Number.isNaN(length)) throw new Error('Malformed BR Code');

    fields[id] = payload.slice(cursor + 4, cursor + 4 + length);
    cursor += 4 + length;
  }

  return fields;
}

/** Lê um BR Code e confere o CRC. Lança erro se a string for inválida. */
export function parseBrCode(brCode: string): ParsedBrCode {
  const code = brCode.trim();

  if (code.length < 8 || code.slice(-8, -4) !== '6304') throw new Error('Missing CRC');
  if (crc16(code.slice(0, -4)) !== code.slice(-4).toUpperCase()) throw new Error('Invalid CRC');

  const fields = parseTlv(code.slice(0, -8));
  const merchantAccount = fields['26'] ? parseTlv(fields['26']) : {};

  return {
    fields,
    locationUrl: merchantAccount['25'] ?? null,
    amount: fields['54'] ? Math.round(Number(fields['54']) * 100) : null,
  };
}
