import type { IRealtimeMessage } from '#shared/resources/realtime/models/RealtimeMessage';

export type GatewayStreamStatus = 'idle' | 'connecting' | 'live' | 'offline';

type GatewayStreamOptions = {
  url: string;
  /** Bearer token, para o stream de um merchant (`/api/events`). A central não usa. */
  token?: string;
  onMessage: (message: IRealtimeMessage) => void;
  onStatus: (status: GatewayStreamStatus) => void;
};

const MAX_RETRY_DELAY_MS = 15_000;

type SseFrame = { event: string; data: string };

function parseFrame(raw: string): SseFrame | null {
  let event = 'message';
  const data: string[] = [];

  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }

  return data.length ? { event, data: data.join('\n') } : null;
}

/**
 * Conecta a um stream de eventos (Server-Sent Events). Usa `fetch` e não `EventSource` para poder enviar
 * o Bearer token quando há um. Reconecta sozinho com espera crescente. Retorna a função que encerra a conexão.
 */
export function openGatewayStream({ url, token, onMessage, onStatus }: GatewayStreamOptions): () => void {
  let stopped = false;
  let controller: AbortController | null = null;
  let attempt = 0;

  const run = async () => {
    while (!stopped) {
      controller = new AbortController();
      onStatus('connecting');

      try {
        const response = await fetch(url, {
          headers: { Accept: 'text/event-stream', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

        onStatus('live');
        attempt = 0;

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += value.replace(/\r\n/g, '\n');
          let boundary = buffer.indexOf('\n\n');

          while (boundary !== -1) {
            const frame = parseFrame(buffer.slice(0, boundary));
            buffer = buffer.slice(boundary + 2);
            boundary = buffer.indexOf('\n\n');

            if (!frame || frame.event === 'ping' || frame.event === 'ready') continue;

            try {
              onMessage(JSON.parse(frame.data) as IRealtimeMessage);
            } catch {
              // Frame malformado: ignora e segue lendo.
            }
          }
        }
      } catch {
        if (stopped) return;
      }

      if (stopped) return;

      onStatus('offline');
      attempt++;
      await new Promise(resolve => setTimeout(resolve, Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS)));
    }
  };

  run();

  return () => {
    stopped = true;
    controller?.abort();
  };
}
