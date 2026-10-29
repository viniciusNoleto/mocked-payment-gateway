import { startRealtimeListener } from '../domain/realtime';

/** Escuta os eventos publicados pelo domínio e os repassa ao `GET /api/events`. */
export default defineNitroPlugin((nitroApp) => {
  if (import.meta.prerender) return;

  const stop = startRealtimeListener();
  nitroApp.hooks.hook('close', stop);
});
