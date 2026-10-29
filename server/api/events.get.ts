import { defineMerchantStreamHandler } from '../utils/auth';
import { subscribeRealtime } from '../domain/realtime';

const HEARTBEAT_MS = 20_000;

/**
 * Eventos em tempo real do merchant (SSE): `charge.created`, `charge.paid`, `charge.expired`,
 * `charge.cancelled` e `pix.received`. É o que o painel usa para mostrar novas cobranças sem recarregar.
 */
export default defineMerchantStreamHandler((_event, merchant, stream) => {
  const unsubscribe = subscribeRealtime(merchant.id, (message) => {
    stream.push({ id: message.id, event: message.event, data: JSON.stringify(message) }).catch(() => {});
  });

  // Evento periódico sem dados: mantém proxies e o navegador com a conexão aberta.
  const heartbeat = setInterval(() => {
    stream.push({ event: 'ping', data: '{}' }).catch(() => {});
  }, HEARTBEAT_MS);

  stream.onClosed(async () => {
    clearInterval(heartbeat);
    unsubscribe();
    await stream.close();
  });

  stream.push({ event: 'ready', data: '{}' }).catch(() => {});
});
