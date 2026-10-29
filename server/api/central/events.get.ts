import { defineCentralStreamHandler } from '../../utils/auth';
import { subscribeRealtime } from '../../domain/realtime';

const HEARTBEAT_MS = 20_000;

/** Eventos em tempo real de todos os clientes (SSE). É o que a fila ao vivo do painel escuta. */
export default defineCentralStreamHandler((_event, stream) => {
  const unsubscribe = subscribeRealtime(null, (message) => {
    stream.push({ id: message.id, event: message.event, data: JSON.stringify(message) }).catch(() => {});
  });

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
