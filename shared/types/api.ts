import type { SupportedLocale } from '../constants/locale';
import type { EApiCode } from '../constants/apiCode';

export type ApiMessage = Record<SupportedLocale, string>;

/** Envelope das rotas de integração (API para API): só o código, sem texto. */
export type ApiResponse<T> = {
  success: boolean;
  code: `${EApiCode}`;
  data: T;
};

/** Envelope das rotas da central (`/api/central/*`): o código e a mensagem traduzida para o painel. */
export type AppApiResponse<T> = ApiResponse<T> & {
  message: ApiMessage;
};

export type ApiValidationIssue = {
  path: string;
  /** Código do Zod (`too_small`, `invalid_type`, `invalid_format`…) ou um código próprio da regra. */
  code: string;
};

export type ApiValidationErrorData = {
  errors: ApiValidationIssue[];
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginatedMeta;
};

export type PaginatedMeta = {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type PayloadBody<T extends FormData | object> = {
  body: T;
};

export type PayloadQuery<T extends object> = {
  query?: T;
};
