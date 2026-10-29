import { createEventStream, defineEventHandler, getHeader, type H3Event } from 'h3';
import { eq } from 'drizzle-orm';
import type { ApiResponse } from '#shared/types/api';
import { EApiCode } from '#shared/constants/apiCode';
import { db } from './db';
import { merchants } from '../db/schema';
import type { MerchantRow } from '../domain/serializers';
import { API_CODE_MESSAGES, ApiError, apiError, defineApiHandler } from './api';
import { sha256 } from './crypto';

export type { MerchantRow };

export function getBearerToken(event: H3Event): string | null {
  const header = getHeader(event, 'authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

export async function requireMerchant(event: H3Event): Promise<MerchantRow> {
  const apiKey = getBearerToken(event);
  if (!apiKey) throw new ApiError(401, EApiCode.UNAUTHORIZED);

  const [merchant] = await db.select().from(merchants).where(eq(merchants.api_key_hash, sha256(apiKey))).limit(1);
  if (!merchant) throw new ApiError(401, EApiCode.UNAUTHORIZED);

  return merchant;
}

/** Aplica os cenários de caos do merchant (configurados na central): indisponibilidade, latência e falhas aleatórias. */
async function applySimulationChaos(merchant: MerchantRow): Promise<void> {
  const settings = merchant.simulation_settings;

  if (settings.latency_ms > 0) await new Promise(resolve => setTimeout(resolve, settings.latency_ms));
  if (settings.outage) throw new ApiError(503, EApiCode.GATEWAY_UNAVAILABLE);
  if (settings.failure_rate > 0 && Math.random() * 100 < settings.failure_rate) throw new ApiError(500, EApiCode.SIMULATED_FAILURE);
}

/** Rota de integração do merchant: autentica pela API key e aplica o caos configurado. Responde só com `code`. */
export function defineMerchantHandler<T>(handler: (event: H3Event, merchant: MerchantRow) => Promise<ApiResponse<T>>) {
  return defineApiHandler(async (event) => {
    const merchant = await requireMerchant(event);
    await applySimulationChaos(merchant);
    return handler(event, merchant);
  });
}

function requireCentral(event: H3Event): void {
  if (!useRuntimeConfig(event).centralEnabled) throw new ApiError(403, EApiCode.CENTRAL_DISABLED);
}

/**
 * Rota da central (`/api/central/*`): o painel aberto que vê todos os clientes. Sem login, ligada por
 * `NUXT_CENTRAL_ENABLED`. Responde com `code` e `message` traduzida.
 */
export function defineCentralHandler<T>(handler: (event: H3Event) => Promise<ApiResponse<T>>) {
  return defineApiHandler(async (event) => {
    requireCentral(event);
    return handler(event);
  }, { messages: true });
}

type EventStream = ReturnType<typeof createEventStream>;

function openStream(event: H3Event, start: (stream: EventStream) => void) {
  const stream = createEventStream(event);
  start(stream);
  return stream.send();
}

/**
 * Rota de streaming (Server-Sent Events) do merchant. Sem caos: o canal serve a telas de acompanhamento.
 * Falhas de autenticação ainda respondem com o envelope; depois disso a resposta é o stream.
 */
export function defineMerchantStreamHandler(handler: (event: H3Event, merchant: MerchantRow, stream: EventStream) => void) {
  return defineEventHandler(async (event) => {
    let merchant: MerchantRow;

    try {
      merchant = await requireMerchant(event);
    } catch (error) {
      if (error instanceof ApiError) return apiError(event, error.code, error.status, error.data);
      throw error;
    }

    return openStream(event, stream => handler(event, merchant, stream));
  });
}

/** Stream da central: eventos de todos os clientes. */
export function defineCentralStreamHandler(handler: (event: H3Event, stream: EventStream) => void) {
  return defineEventHandler((event) => {
    try {
      requireCentral(event);
    } catch (error) {
      if (error instanceof ApiError) return { ...apiError(event, error.code, error.status), message: API_CODE_MESSAGES[error.code] };
      throw error;
    }

    return openStream(event, stream => handler(event, stream));
  });
}
