import { useStorage } from '@vueuse/core';
import { SUPPORTED_LOCALES, type SupportedLocale } from '#shared/constants/locale';
import { ptBr, type Messages } from '~/locales/pt-br';
import { esMx } from '~/locales/es-mx';
import { enUs } from '~/locales/en-us';

const DICTIONARIES: Record<SupportedLocale, Messages> = { 'pt-br': ptBr, 'es-mx': esMx, 'en-us': enUs };

function detectLocale(): SupportedLocale {
  if (!import.meta.client) return 'pt-br';
  const language = navigator.language.toLowerCase();
  if (language.startsWith('es')) return 'es-mx';
  if (language.startsWith('en')) return 'en-us';
  return 'pt-br';
}

let locale: Ref<SupportedLocale> | null = null;

/**
 * Idioma do painel, guardado neste navegador. `m` é o dicionário tipado do idioma atual:
 * `m.charges.title`, `m.charges.count(3)`. Os locales são os mesmos das mensagens da API.
 */
export function useI18n() {
  if (!locale) {
    locale = useStorage<SupportedLocale>('mpg:locale', detectLocale());
    if (!SUPPORTED_LOCALES.includes(locale.value)) locale.value = 'pt-br';

    watch(locale, (value) => {
      setFormatLocale(DICTIONARIES[value].intl);
      if (import.meta.client) document.documentElement.lang = DICTIONARIES[value].intl;
    }, { immediate: true });
  }

  const current = locale;
  const m = computed(() => DICTIONARIES[current.value]);
  const options = SUPPORTED_LOCALES.map(value => ({ value, label: DICTIONARIES[value].languageName }));

  return { locale: current, m, options };
}
