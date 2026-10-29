import type { DocsPageDefinition } from './types';
import { streamSample, webhookFullSample, webhookMinimalSample } from './samples';

const SCHEDULE = [['1', '0 s'], ['2', '10 s'], ['3', '30 s'], ['4', '1 min'], ['5', '5 min'], ['6', '15 min'], ['7', '30 min'], ['8', '1 h'], ['9', '2 h'], ['10', '4 h'], ['11', '8 h']];

export const webhooksDocs: DocsPageDefinition = ({ origin }) => ({
  'pt-br': {
    title: 'Webhooks',
    lead: 'O gateway avisa o sistema do cliente por um POST assinado a cada mudança de estado. Entrega pelo menos uma vez, com retentativas por até 16 horas.',
    next: { to: '/docs/simulacao', label: 'Simulação' },
    sections: [
      {
        id: 'eventos',
        title: 'Eventos',
        blocks: [{
          type: 'table',
          head: ['Evento', 'Quando'],
          code: [0],
          rows: [
            ['charge.paid', 'A cobrança foi paga, pelo valor exato. Traz a cobrança e o Pix (e2e_id, pagador).'],
            ['charge.expired', 'O prazo venceu sem pagamento.'],
            ['charge.cancelled', 'O cliente cancelou a cobrança.'],
            ['pix.received', 'Chegou um Pix sem cobrança local (transferência direta para a chave). txid é null.'],
          ],
        }],
      },
      {
        id: 'payload',
        title: 'O corpo',
        blocks: [
          { type: 'p', text: 'No modo `full` (padrão) o evento traz o estado inteiro. No modo `minimal` traz só o identificador, e o sistema consulta `GET /api/charges/:txid` para saber o resto, como em alguns PSPs reais.' },
          { type: 'code', lang: 'json', title: 'payload_mode: full', code: webhookFullSample },
          { type: 'code', lang: 'json', title: 'payload_mode: minimal', code: webhookMinimalSample },
        ],
      },
      {
        id: 'headers',
        title: 'Headers e assinatura',
        blocks: [
          {
            type: 'table',
            head: ['Header', 'Conteúdo'],
            code: [0],
            rows: [
              ['X-Webhook-Id', 'Id do evento. Igual entre duplicatas e retentativas: é a chave de idempotência.'],
              ['X-Webhook-Delivery-Id', 'Id da entrega (uma por cópia).'],
              ['X-Webhook-Event', 'O nome do evento, como charge.paid.'],
              ['X-Webhook-Attempt', 'Número da tentativa, a partir de 1.'],
              ['X-Webhook-Timestamp', 'Quando a tentativa saiu, em ISO 8601.'],
              ['X-Signature', 'Com auth_mode hmac: HMAC-SHA256 em hex do corpo cru, com o segredo do webhook.'],
              ['X-Webhook-Token', 'Com auth_mode token: o próprio segredo do webhook.'],
            ],
          },
          { type: 'p', text: 'Calcule o HMAC sobre os bytes exatos que chegaram, antes de qualquer parse de JSON, e compare em tempo constante (`timingSafeEqual` no Node, `hash_equals` no PHP). Para trocar o segredo, use [Clientes](/clientes).' },
        ],
      },
      {
        id: 'retentativas',
        title: 'Retentativas',
        blocks: [
          { type: 'p', text: 'Qualquer `2xx` conta como entregue. Outro status, erro de rede ou mais de 5 s sem resposta agendam a próxima tentativa. Esgotadas as onze, a entrega fica `failed`.' },
          { type: 'table', head: ['Tentativa', 'Espera desde a anterior'], numeric: [0, 1], rows: SCHEDULE },
        ],
      },
      {
        id: 'tempo-real',
        title: 'Tempo real numa tela',
        blocks: [
          { type: 'p', text: 'Uma tela no navegador não tem URL pública para receber webhooks. Para acompanhar ao vivo, o gateway expõe os mesmos eventos por Server-Sent Events em `GET /api/events`, mais `charge.created`, só com os eventos do cliente dono da API key. O evento é publicado dentro da mesma transação do webhook e só chega depois do commit.' },
          { type: 'code', lang: 'bash', code: streamSample(origin) },
          { type: 'p', text: 'O `EventSource` do navegador não envia headers; use `fetch` e leia o corpo como stream. O backend do cliente continua confiando no webhook e na consulta.' },
        ],
      },
    ],
  },
  'es-mx': {
    title: 'Webhooks',
    lead: 'El gateway avisa al sistema del cliente con un POST firmado en cada cambio de estado. Entrega al menos una vez, con reintentos hasta por 16 horas.',
    next: { to: '/docs/simulacao', label: 'Simulación' },
    sections: [
      {
        id: 'eventos',
        title: 'Eventos',
        blocks: [{
          type: 'table',
          head: ['Evento', 'Cuándo'],
          code: [0],
          rows: [
            ['charge.paid', 'El cobro se pagó, por el monto exacto. Trae el cobro y el Pix (e2e_id, pagador).'],
            ['charge.expired', 'El plazo venció sin pago.'],
            ['charge.cancelled', 'El cliente canceló el cobro.'],
            ['pix.received', 'Llegó un Pix sin cobro local (transferencia directa a la clave). txid es null.'],
          ],
        }],
      },
      {
        id: 'payload',
        title: 'El cuerpo',
        blocks: [
          { type: 'p', text: 'En modo `full` (predeterminado) el evento trae el estado completo. En modo `minimal` trae solo el identificador, y el sistema consulta `GET /api/charges/:txid` para saber el resto, como en algunos PSP reales.' },
          { type: 'code', lang: 'json', title: 'payload_mode: full', code: webhookFullSample },
          { type: 'code', lang: 'json', title: 'payload_mode: minimal', code: webhookMinimalSample },
        ],
      },
      {
        id: 'headers',
        title: 'Headers y firma',
        blocks: [
          {
            type: 'table',
            head: ['Header', 'Contenido'],
            code: [0],
            rows: [
              ['X-Webhook-Id', 'Id del evento. Igual entre duplicados y reintentos: es la clave de idempotencia.'],
              ['X-Webhook-Delivery-Id', 'Id de la entrega (una por copia).'],
              ['X-Webhook-Event', 'El nombre del evento, como charge.paid.'],
              ['X-Webhook-Attempt', 'Número de intento, desde 1.'],
              ['X-Webhook-Timestamp', 'Cuándo salió el intento, en ISO 8601.'],
              ['X-Signature', 'Con auth_mode hmac: HMAC-SHA256 en hex del cuerpo crudo, con el secreto del webhook.'],
              ['X-Webhook-Token', 'Con auth_mode token: el propio secreto del webhook.'],
            ],
          },
          { type: 'p', text: 'Calcula el HMAC sobre los bytes exactos recibidos, antes de cualquier parseo de JSON, y compara en tiempo constante (`timingSafeEqual` en Node, `hash_equals` en PHP). Para cambiar el secreto, usa [Clientes](/clientes).' },
        ],
      },
      {
        id: 'retentativas',
        title: 'Reintentos',
        blocks: [
          { type: 'p', text: 'Cualquier `2xx` cuenta como entregado. Otro estado, un error de red o más de 5 s sin respuesta programan el siguiente intento. Agotados los once, la entrega queda `failed`.' },
          { type: 'table', head: ['Intento', 'Espera desde el anterior'], numeric: [0, 1], rows: SCHEDULE },
        ],
      },
      {
        id: 'tempo-real',
        title: 'Tiempo real en una pantalla',
        blocks: [
          { type: 'p', text: 'Una pantalla en el navegador no tiene URL pública para recibir webhooks. Para seguirlo en vivo, el gateway expone los mismos eventos por Server-Sent Events en `GET /api/events`, más `charge.created`, solo con los eventos del cliente dueño de la API key. El evento se publica dentro de la misma transacción del webhook y llega solo después del commit.' },
          { type: 'code', lang: 'bash', code: streamSample(origin) },
          { type: 'p', text: 'El `EventSource` del navegador no envía headers; usa `fetch` y lee el cuerpo como stream. El backend del cliente sigue confiando en el webhook y en la consulta.' },
        ],
      },
    ],
  },
  'en-us': {
    title: 'Webhooks',
    lead: 'The gateway notifies the client system with a signed POST on every state change. It delivers at least once and retries for up to 16 hours.',
    next: { to: '/docs/simulacao', label: 'Simulation' },
    sections: [
      {
        id: 'eventos',
        title: 'Events',
        blocks: [{
          type: 'table',
          head: ['Event', 'When'],
          code: [0],
          rows: [
            ['charge.paid', 'The charge was paid, for its exact amount. Carries the charge and the Pix (e2e_id, payer).'],
            ['charge.expired', 'The deadline passed without payment.'],
            ['charge.cancelled', 'The client cancelled the charge.'],
            ['pix.received', 'A Pix arrived without a local charge (direct transfer to the key). txid is null.'],
          ],
        }],
      },
      {
        id: 'payload',
        title: 'The body',
        blocks: [
          { type: 'p', text: 'In `full` mode (default) the event carries the whole state. In `minimal` mode it carries only the identifier, and the system calls `GET /api/charges/:txid` for the rest, like some real PSPs.' },
          { type: 'code', lang: 'json', title: 'payload_mode: full', code: webhookFullSample },
          { type: 'code', lang: 'json', title: 'payload_mode: minimal', code: webhookMinimalSample },
        ],
      },
      {
        id: 'headers',
        title: 'Headers and signature',
        blocks: [
          {
            type: 'table',
            head: ['Header', 'Content'],
            code: [0],
            rows: [
              ['X-Webhook-Id', 'Event id. Same across duplicates and retries: it is the idempotency key.'],
              ['X-Webhook-Delivery-Id', 'Delivery id (one per copy).'],
              ['X-Webhook-Event', 'The event name, such as charge.paid.'],
              ['X-Webhook-Attempt', 'Attempt number, starting at 1.'],
              ['X-Webhook-Timestamp', 'When the attempt went out, in ISO 8601.'],
              ['X-Signature', 'With auth_mode hmac: hex HMAC-SHA256 of the raw body, keyed with the webhook secret.'],
              ['X-Webhook-Token', 'With auth_mode token: the webhook secret itself.'],
            ],
          },
          { type: 'p', text: 'Compute the HMAC over the exact bytes received, before any JSON parsing, and compare in constant time (`timingSafeEqual` in Node, `hash_equals` in PHP). To change the secret, use [Clients](/clientes).' },
        ],
      },
      {
        id: 'retentativas',
        title: 'Retries',
        blocks: [
          { type: 'p', text: 'Any `2xx` counts as delivered. Any other status, a network error or more than 5 s without an answer schedules the next attempt. After eleven, the delivery is `failed`.' },
          { type: 'table', head: ['Attempt', 'Wait since the previous one'], numeric: [0, 1], rows: SCHEDULE },
        ],
      },
      {
        id: 'tempo-real',
        title: 'Real time on a screen',
        blocks: [
          { type: 'p', text: 'A browser screen has no public URL to receive webhooks. To follow along live, the gateway exposes the same events over Server-Sent Events at `GET /api/events`, plus `charge.created`, with only the API key owner’s events. Each event is published inside the webhook’s transaction and only arrives after the commit.' },
          { type: 'code', lang: 'bash', code: streamSample(origin) },
          { type: 'p', text: 'The browser’s `EventSource` sends no headers; use `fetch` and read the body as a stream. The client backend still relies on the webhook and the lookup.' },
        ],
      },
    ],
  },
});
