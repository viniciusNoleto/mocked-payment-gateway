import { defineEventHandler, isError, setResponseStatus, type H3Event } from 'h3';
import type { ApiMessage, ApiResponse, AppApiResponse, PaginatedMeta } from '#shared/types/api';
import { EApiCode } from '#shared/constants/apiCode';

export function msg(pt: string, es: string, en: string): ApiMessage {
  return { 'pt-br': pt, 'es-mx': es, 'en-us': en };
}

/** Texto de cada código, usado só nas respostas da central. */
export const API_CODE_MESSAGES: Record<EApiCode, ApiMessage> = {
  [EApiCode.OK]: msg('Operação realizada com sucesso.', 'Operación realizada con éxito.', 'Operation completed successfully.'),
  [EApiCode.INVALID_PAYLOAD]: msg('Corpo da requisição inválido.', 'Cuerpo de la solicitud inválido.', 'Invalid request body.'),
  [EApiCode.VALIDATION_ERROR]: msg('Dados inválidos.', 'Datos inválidos.', 'Invalid data.'),
  [EApiCode.UNAUTHORIZED]: msg('Credenciais ausentes ou inválidas.', 'Credenciales ausentes o inválidas.', 'Missing or invalid credentials.'),
  [EApiCode.NOT_FOUND]: msg('Registro não encontrado.', 'Registro no encontrado.', 'Record not found.'),
  [EApiCode.ROUTE_NOT_FOUND]: msg('Rota não encontrada.', 'Ruta no encontrada.', 'Route not found.'),
  [EApiCode.SERVER_ERROR]: msg('Erro inesperado. Tente novamente.', 'Error inesperado. Inténtalo de nuevo.', 'Unexpected error. Please try again.'),
  [EApiCode.CENTRAL_DISABLED]: msg('A central está desativada.', 'La central está desactivada.', 'The control center is disabled.'),
  [EApiCode.GATEWAY_UNAVAILABLE]: msg('Gateway indisponível (simulação).', 'Gateway no disponible (simulación).', 'Gateway unavailable (simulated).'),
  [EApiCode.SIMULATED_FAILURE]: msg('Falha simulada do gateway.', 'Falla simulada del gateway.', 'Simulated gateway failure.'),

  [EApiCode.CHARGE_CREATED]: msg('Cobrança criada.', 'Cobro creado.', 'Charge created.'),
  [EApiCode.CHARGE_REPLAYED]: msg('Cobrança já criada com esta Idempotency-Key.', 'Cobro ya creado con esta Idempotency-Key.', 'Charge already created with this Idempotency-Key.'),
  [EApiCode.TXID_TAKEN]: msg('Já existe uma cobrança com este txid.', 'Ya existe un cobro con este txid.', 'A charge with this txid already exists.'),
  [EApiCode.CHARGE_CANCELLED]: msg('Cobrança cancelada.', 'Cobro cancelado.', 'Charge cancelled.'),
  [EApiCode.CHARGE_EXPIRED]: msg('Cobrança expirada.', 'Cobro expirado.', 'Charge expired.'),
  [EApiCode.CHARGE_NOT_PENDING]: msg('A cobrança não está pendente.', 'El cobro no está pendiente.', 'The charge is not pending.'),
  [EApiCode.CHARGE_PAID]: msg('Pagamento registrado.', 'Pago registrado.', 'Payment recorded.'),
  [EApiCode.CHARGE_ALREADY_PAID]: msg('A cobrança já foi paga.', 'El cobro ya fue pagado.', 'The charge has already been paid.'),
  [EApiCode.CHARGE_NOT_PAYABLE]: msg('A cobrança não pode mais ser paga.', 'El cobro ya no puede pagarse.', 'The charge can no longer be paid.'),
  [EApiCode.PIX_RECEIVED]: msg('Pix sem cobrança recebido.', 'Pix sin cobro recibido.', 'Pix without charge received.'),
  [EApiCode.SIMULATION_SETTINGS_UPDATED]: msg('Cenários de simulação salvos.', 'Escenarios de simulación guardados.', 'Simulation scenarios saved.'),

  [EApiCode.WEBHOOK_SECRET_ROTATED]: msg('Novo segredo do webhook gerado.', 'Nuevo secreto del webhook generado.', 'New webhook secret generated.'),

  [EApiCode.MERCHANT_CREATED]: msg('Cliente criado. Guarde a API key: ela não será exibida de novo.', 'Cliente creado. Guarda la API key: no se mostrará de nuevo.', 'Client created. Store the API key: it will not be shown again.'),
  [EApiCode.MERCHANT_UPDATED]: msg('Cliente atualizado.', 'Cliente actualizado.', 'Client updated.'),
  [EApiCode.MERCHANT_DELETED]: msg('Cliente removido.', 'Cliente eliminado.', 'Client deleted.'),
  [EApiCode.API_KEY_ROTATED]: msg('Nova API key gerada. A anterior deixou de funcionar.', 'Nueva API key generada. La anterior dejó de funcionar.', 'New API key generated. The previous one no longer works.'),
  [EApiCode.API_KEY_TAKEN]: msg('Esta API key já está em uso.', 'Esta API key ya está en uso.', 'This API key is already in use.'),
};

/** Erro de API com envelope próprio. Lançado em qualquer ponto de um handler; `defineApiHandler` converte em resposta. */
export class ApiError<T = null> extends Error {
  constructor(
    public readonly status: number,
    public readonly code: EApiCode,
    public readonly data: T = null as T,
  ) {
    super(code);
  }
}

export function apiOk<T>(event: H3Event, data: T, code: EApiCode = EApiCode.OK, status = 200): ApiResponse<T> {
  setResponseStatus(event, status);
  return { success: true, code, data };
}

export function apiError<T = null>(event: H3Event, code: EApiCode, status = 400, data: T = null as T): ApiResponse<T> {
  setResponseStatus(event, status);
  return { success: false, code, data };
}

type HandlerOptions = {
  /** Acrescenta `message` traduzida ao envelope. Só para as rotas da central; integração responde só com `code`. */
  messages?: boolean;
};

function withMessage<T>(response: ApiResponse<T>): AppApiResponse<T> {
  return { ...response, message: API_CODE_MESSAGES[response.code as EApiCode] };
}

/**
 * Envolve um handler para que toda saída, inclusive erros, siga o envelope `{ success, code, data }`.
 */
export function defineApiHandler<T>(handler: (event: H3Event) => Promise<ApiResponse<T>> | ApiResponse<T>, options: HandlerOptions = {}) {
  const finish = <R>(response: ApiResponse<R>) => (options.messages ? withMessage(response) : response);

  return defineEventHandler(async (event): Promise<ApiResponse<T | unknown>> => {
    try {
      return finish(await handler(event));
    } catch (error) {
      if (error instanceof ApiError) return finish(apiError(event, error.code, error.status, error.data));

      if (isError(error) && error.statusCode < 500) {
        return finish(apiError(event, EApiCode.INVALID_PAYLOAD, error.statusCode));
      }

      console.error(error);
      return finish(apiError(event, EApiCode.SERVER_ERROR, 500));
    }
  });
}

export function paginationMeta(page: number, perPage: number, total: number): PaginatedMeta {
  return { page, per_page: perPage, total, last_page: Math.max(1, Math.ceil(total / perPage)) };
}

export function toIso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}
