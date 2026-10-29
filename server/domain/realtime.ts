import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { sql } from 'drizzle-orm';
import { Client } from 'pg';
import type { DbExecutor } from '../utils/db';
import type { ERealtimeEvent } from '#shared/resources/realtime/enums/RealtimeEvent';
import type { IRealtimeData, IRealtimeMessage } from '#shared/resources/realtime/models/RealtimeMessage';
import type { MerchantRow } from './serializers';

const CHANNEL = 'gateway_events';
/** O NOTIFY do Postgres aceita até 8000 bytes; acima disso o evento vai só com o txid. */
const NOTIFY_PAYLOAD_LIMIT = 7_500;
const RECONNECT_DELAY_MS = 2_000;

/** Canal do bus que recebe os eventos de todos os merchants (a central). */
const ALL = '*';

const bus = new EventEmitter();
bus.setMaxListeners(0);

/**
 * Publica um evento para os painéis conectados. Chamado dentro da transação que mudou o estado:
 * o Postgres só entrega o NOTIFY no commit, então o painel nunca vê uma mudança desfeita.
 */
export async function publishRealtimeEvent(executor: DbExecutor, merchant: Pick<MerchantRow, 'id' | 'name'>, event: ERealtimeEvent, data: IRealtimeData): Promise<void> {
  const notification: IRealtimeMessage = {
    id: randomUUID(),
    event,
    created_at: new Date().toISOString(),
    merchant: { id: merchant.id, name: merchant.name },
    data,
  };

  let payload = JSON.stringify(notification);
  if (Buffer.byteLength(payload) > NOTIFY_PAYLOAD_LIMIT) payload = JSON.stringify({ ...notification, data: { txid: data.txid } });

  await executor.execute(sql`select pg_notify(${CHANNEL}, ${payload})`);
}

/** Assina os eventos de um merchant, ou de todos com `null` (a central). */
export function subscribeRealtime(merchantId: string | null, listener: (message: IRealtimeMessage) => void): () => void {
  const channel = merchantId ?? ALL;
  bus.on(channel, listener);
  return () => bus.off(channel, listener);
}

/**
 * Conexão dedicada com LISTEN, repassando cada evento aos assinantes do merchant.
 * Funciona com várias instâncias: todas escutam o mesmo canal.
 */
export function startRealtimeListener(): () => Promise<void> {
  let client: Client | null = null;
  let stopped = false;
  let retry: NodeJS.Timeout | null = null;

  const scheduleReconnect = () => {
    if (stopped || retry) return;
    retry = setTimeout(() => {
      retry = null;
      connect();
    }, RECONNECT_DELAY_MS);
  };

  const connect = async () => {
    const current = new Client({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    });

    current.on('notification', ({ payload }) => {
      if (!payload) return;
      try {
        const message = JSON.parse(payload) as IRealtimeMessage;
        bus.emit(message.merchant.id, message);
        bus.emit(ALL, message);
      } catch (error) {
        console.error('[realtime]', error);
      }
    });

    current.on('error', (error) => {
      console.error('[realtime]', error.message);
      current.end().catch(() => {});
      scheduleReconnect();
    });

    try {
      await current.connect();
      await current.query(`LISTEN ${CHANNEL}`);
      client = current;
    } catch (error) {
      console.error('[realtime]', error instanceof Error ? error.message : error);
      current.end().catch(() => {});
      scheduleReconnect();
    }
  };

  connect();

  return async () => {
    stopped = true;
    if (retry) clearTimeout(retry);
    await client?.end().catch(() => {});
  };
}
