import type { ApiValidationErrorData, AppApiResponse } from '#shared/types/api';

/** Texto de um envelope de erro da central, no idioma atual, com os campos inválidos quando houver. */
export function useApiErrorText() {
  const { m, locale } = useI18n();

  return (failure: unknown): string => {
    const envelope = failure as AppApiResponse<ApiValidationErrorData | null> | null;
    const base = envelope?.message?.[locale.value] ?? m.value.common.unexpected;
    const fields = envelope?.data?.errors?.map(issue => issue.path).filter(Boolean);
    return fields?.length ? `${base} ${m.value.validation(fields.join(', '))}` : base;
  };
}
