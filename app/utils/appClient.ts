import type { AppApiResponse } from '#shared/types/api';

const NETWORK_ERROR: AppApiResponse<null> = {
  success: false,
  code: 'server_error',
  message: {
    'pt-br': 'Não foi possível conectar ao gateway.',
    'es-mx': 'No fue posible conectar con el gateway.',
    'en-us': 'Could not connect to the gateway.',
  },
  data: null,
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

/**
 * Cliente das rotas da central (`/api/central/*`), abertas e com `message` traduzida no envelope.
 * Resolve com o envelope quando `success` é true; rejeita com o envelope de erro caso contrário.
 */
async function request<T>(url: string, options: RequestOptions = {}): Promise<AppApiResponse<T>> {
  const response = await $fetch.raw<AppApiResponse<T>>(url, {
    method: options.method ?? 'GET',
    body: options.body as Record<string, unknown> | undefined,
    signal: options.signal,
    headers: options.headers,
    ignoreResponseError: true,
  }).catch(() => {
    throw NETWORK_ERROR;
  });

  const data = response._data;

  if (data?.success) return data;

  throw data ?? NETWORK_ERROR;
}

export const appClient = {
  get<T>(url: string, options?: { signal?: AbortSignal }): Promise<AppApiResponse<T>> {
    return request<T>(url, { signal: options?.signal });
  },
  post<T>(url: string, options: { body: unknown; headers?: Record<string, string>; signal?: AbortSignal }): Promise<AppApiResponse<T>> {
    return request<T>(url, { method: 'POST', ...options });
  },
  put<T>(url: string, options: { body: unknown }): Promise<AppApiResponse<T>> {
    return request<T>(url, { method: 'PUT', body: options.body });
  },
  patch<T>(url: string, options: { body: unknown }): Promise<AppApiResponse<T>> {
    return request<T>(url, { method: 'PATCH', body: options.body });
  },
  delete<T>(url: string): Promise<AppApiResponse<T>> {
    return request<T>(url, { method: 'DELETE' });
  },
};
