import { randomAlphanumeric } from '../crypto';

/** txid do BCB: 26 a 35 caracteres alfanuméricos. */
export const TXID_REGEX = /^[a-zA-Z0-9]{26,35}$/;

export function generateTxid(): string {
  return randomAlphanumeric(32);
}

function formatSpiDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}`;
}

/** endToEndId do SPI, 32 caracteres: `E` (1), ISPB do pagador (8), AAAAMMDDHHmm (12) e sequência (11). */
export function generateEndToEndId(payerIspb: string, date = new Date()): string {
  return `E${payerIspb}${formatSpiDate(date)}${randomAlphanumeric(11)}`;
}

export const END_TO_END_ID_REGEX = /^E\d{8}\d{12}[a-zA-Z0-9]{11}$/;
