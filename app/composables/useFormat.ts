import { shallowRef } from 'vue';

function formatters(intl: string) {
  return {
    money: new Intl.NumberFormat(intl, { style: 'currency', currency: 'BRL' }),
    clock: new Intl.DateTimeFormat(intl, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    dateTime: new Intl.DateTimeFormat(intl, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    date: new Intl.DateTimeFormat(intl, { day: '2-digit', month: 'short', year: 'numeric' }),
    relative: new Intl.RelativeTimeFormat(intl, { numeric: 'auto', style: 'short' }),
  };
}

/** Reativo: trocar o idioma refaz os textos que usam estes formatadores. */
const active = shallowRef(formatters('pt-BR'));

/** Chamado pelo `useI18n` quando o idioma muda. A moeda continua real: muda só a escrita. */
export function setFormatLocale(intl: string) {
  active.value = formatters(intl);
}

/** Centavos inteiros → "R$ 49,90". */
export function formatMoney(cents: number): string {
  return active.value.money.format(cents / 100);
}

export function formatClock(iso: string): string {
  return active.value.clock.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return active.value.dateTime.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return active.value.date.format(new Date(iso));
}

/** Segundos → "04:12" ou "1:04:12". */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm.padStart(2, '0')}:${ss}` : `${mm.padStart(2, '0')}:${ss}`;
}

/** "agora", "há 12 s", "há 4 min", no idioma atual. */
export function formatAgo(iso: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  const { relative } = active.value;
  if (seconds < 5) return relative.format(0, 'second');
  if (seconds < 60) return relative.format(-seconds, 'second');
  if (seconds < 3600) return relative.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 86_400) return relative.format(-Math.floor(seconds / 3600), 'hour');
  return relative.format(-Math.floor(seconds / 86_400), 'day');
}

/** Converte "49,90" ou "49.90" em centavos. Retorna null se não for um valor válido. */
export function parseMoneyInput(value: string): number | null {
  const normalized = value.trim().replace(/[R$\s]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return cents > 0 ? cents : null;
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}
