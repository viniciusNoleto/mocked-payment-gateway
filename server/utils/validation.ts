import { getQuery, readBody, type H3Event } from 'h3';
import { z } from 'zod';
import { ApiError } from './api';
import { EApiCode } from '#shared/constants/apiCode';
import type { ApiValidationErrorData } from '#shared/types/api';

function toValidationError(error: z.ZodError): ApiError<ApiValidationErrorData> {
  return new ApiError(422, EApiCode.VALIDATION_ERROR, {
    // Regras próprias (`refine`) usam a mensagem como código: `paid_at_in_future`, por exemplo.
    errors: error.issues.map(issue => ({ path: issue.path.join('.'), code: issue.code === 'custom' ? issue.message : issue.code })),
  });
}

export async function readValidatedJson<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.output<T>> {
  const body = await readBody(event).catch(() => {
    throw new ApiError(400, EApiCode.INVALID_PAYLOAD);
  });

  const result = schema.safeParse(body ?? {});
  if (!result.success) throw toValidationError(result.error);

  return result.data;
}

export function readValidatedQuery<T extends z.ZodType>(event: H3Event, schema: T): z.output<T> {
  const result = schema.safeParse(getQuery(event));
  if (!result.success) throw toValidationError(result.error);

  return result.data;
}

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(15),
};

/** Valor monetário em centavos inteiros. */
export const amountSchema = z.number().int().min(1).max(100_000_000_00);

/** Parâmetro de rota que deve ser UUID — evita erro do Postgres ao comparar com coluna uuid. */
export function assertUuid(value: string | undefined): string {
  if (!value || !z.uuid().safeParse(value).success) throw new ApiError(404, EApiCode.NOT_FOUND);
  return value;
}
