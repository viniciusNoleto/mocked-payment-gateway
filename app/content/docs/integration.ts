import type { DocsPageDefinition } from './types';
import { chargeResponseSample, confirmSamples, createChargeSamples, envSample, errorResponseSample, receiveSamples, reconcileSample } from './samples';

export const integrationDocs: DocsPageDefinition = ({ origin }) => ({
  'pt-br': {
    title: 'Integração',
    lead: 'O caminho completo de um sistema que recebe Pix: credenciais, webhook, cobrança, confirmação e reconciliação. Os exemplos já apontam para este gateway; troque a URL e as chaves pelas do PSP real quando for para produção.',
    next: { to: '/docs/webhooks', label: 'Webhooks' },
    sections: [
      {
        id: 'cliente',
        title: 'Crie o cliente',
        blocks: [
          { type: 'p', text: 'Em [Clientes](/clientes), crie um cliente para o seu sistema. A central mostra a **API key** uma única vez, junto com o **segredo do webhook** e a URL do gateway, prontos para o `.env`:' },
          { type: 'code', lang: 'bash', title: '.env', code: envSample(origin) },
          { type: 'p', text: 'Toda chamada leva `Authorization: Bearer $PIX_API_KEY`. Se a chave se perder, gere outra na mesma tela: a anterior para de funcionar na hora.' },
        ],
      },
      {
        id: 'respostas',
        title: 'Como a API responde',
        blocks: [
          { type: 'p', text: 'As rotas de integração são feitas para conversa entre sistemas e respondem só com o necessário: `{ success, code, data }`. Não há mensagens em texto; o `code` diz o que aconteceu e o seu sistema decide o que mostrar.' },
          { type: 'code', lang: 'http', title: 'Erros', code: errorResponseSample },
          { type: 'p', text: 'A lista completa de códigos está na [Referência da API](/docs/api#codigos).' },
        ],
      },
      {
        id: 'webhook-url',
        title: 'Cadastre a URL do webhook',
        blocks: [
          { type: 'p', text: 'Na central, em [Clientes](/clientes), edite o cliente e informe a URL, o `auth_mode` e o `payload_mode`. A API de integração não altera configurações: tudo fica na central. Com o gateway no Docker e o seu sistema no host, use `host.docker.internal` no lugar de `localhost`.' },
          { type: 'p', text: '`auth_mode: hmac` assina o corpo com o segredo no header `X-Signature`; `token` manda o próprio segredo em `X-Webhook-Token`. `payload_mode: minimal` manda só o `txid` e obriga o sistema a consultar a cobrança.' },
        ],
      },
      {
        id: 'criar',
        title: 'Crie a cobrança',
        blocks: [
          { type: 'p', text: 'Na hora do checkout. Guarde o `txid` no pedido. O gateway devolve o BR Code em `qr_code` (o copia e cola) e **o seu sistema gera a imagem do QR Code** a partir dele, com qualquer biblioteca de QR. A `Idempotency-Key` faz um retry de rede devolver a mesma cobrança em vez de criar outra.' },
          { type: 'tabs', samples: createChargeSamples(origin) },
          { type: 'code', lang: 'json', title: '201', code: chargeResponseSample },
          { type: 'p', text: 'Assim que a cobrança é criada ela aparece na fila de [Cobranças ao vivo](/), com o nome do cliente, onde pode ser marcada como paga.' },
        ],
      },
      {
        id: 'receber',
        title: 'Receba o webhook',
        blocks: [
          { type: 'p', text: 'Verifique a assinatura sobre o corpo cru, descarte eventos repetidos pelo `id`, enfileire o trabalho e responda `2xx` rápido. Qualquer outra resposta, ou demorar mais de 5 s, faz o gateway tentar de novo mais tarde.' },
          { type: 'tabs', samples: receiveSamples },
        ],
      },
      {
        id: 'consultar',
        title: 'Confirme pela consulta',
        blocks: [
          { type: 'p', text: 'O webhook avisa; a consulta confirma. No job, busque `GET /api/charges/:txid`, trave o pedido e só então marque como pago. A cobrança é sempre paga pelo valor exato, então basta conferir o `status`.' },
          { type: 'tabs', samples: confirmSamples },
        ],
      },
      {
        id: 'reconciliar',
        title: 'Reconcilie o dia',
        blocks: [
          { type: 'p', text: 'Webhooks se perdem. Um job agendado lista os Pix recebidos no período e confere com os pedidos: o que foi pago e não está marcado é corrigido, e Pix sem cobrança (`txid: null`) vão para análise.' },
          { type: 'code', lang: 'bash', code: reconcileSample(origin) },
          { type: 'p', text: 'Para testar, pague uma cobrança na central escolhendo **Perder o webhook**: só a reconciliação vai achar esse pagamento.' },
        ],
      },
      {
        id: 'checklist',
        title: 'Antes de trocar pelo PSP real',
        blocks: [
          {
            type: 'ul',
            items: [
              'O pedido só vira pago depois da consulta, nunca pelo corpo do webhook sozinho.',
              'O handler aceita o mesmo evento duas vezes sem efeito colateral.',
              'Um webhook perdido é recuperado pela reconciliação.',
              'Um webhook atrasado, chegando depois da reconciliação, não paga o pedido de novo.',
              'O checkout trata `gateway_unavailable` (503) e respostas lentas sem quebrar.',
            ],
          },
          { type: 'p', text: 'Cada item tem um cenário pronto em [Simulação](/docs/simulacao).' },
        ],
      },
    ],
  },
  'es-mx': {
    title: 'Integración',
    lead: 'El camino completo de un sistema que recibe Pix: credenciales, webhook, cobro, confirmación y conciliación. Los ejemplos ya apuntan a este gateway; cambia la URL y las claves por las del PSP real al pasar a producción.',
    next: { to: '/docs/webhooks', label: 'Webhooks' },
    sections: [
      {
        id: 'cliente',
        title: 'Crea el cliente',
        blocks: [
          { type: 'p', text: 'En [Clientes](/clientes), crea un cliente para tu sistema. La central muestra la **API key** una sola vez, junto con el **secreto del webhook** y la URL del gateway, listos para el `.env`:' },
          { type: 'code', lang: 'bash', title: '.env', code: envSample(origin) },
          { type: 'p', text: 'Toda llamada lleva `Authorization: Bearer $PIX_API_KEY`. Si la clave se pierde, genera otra en la misma pantalla: la anterior deja de funcionar al instante.' },
        ],
      },
      {
        id: 'respostas',
        title: 'Cómo responde la API',
        blocks: [
          { type: 'p', text: 'Las rutas de integración están hechas para la conversación entre sistemas y responden solo lo necesario: `{ success, code, data }`. No hay mensajes de texto; el `code` dice qué pasó y tu sistema decide qué mostrar.' },
          { type: 'code', lang: 'http', title: 'Errores', code: errorResponseSample },
          { type: 'p', text: 'La lista completa de códigos está en la [Referencia de la API](/docs/api#codigos).' },
        ],
      },
      {
        id: 'webhook-url',
        title: 'Registra la URL del webhook',
        blocks: [
          { type: 'p', text: 'En la central, en [Clientes](/clientes), edita el cliente e indica la URL, el `auth_mode` y el `payload_mode`. La API de integración no cambia configuraciones: todo queda en la central. Con el gateway en Docker y tu sistema en el host, usa `host.docker.internal` en lugar de `localhost`.' },
          { type: 'p', text: '`auth_mode: hmac` firma el cuerpo con el secreto en el header `X-Signature`; `token` envía el propio secreto en `X-Webhook-Token`. `payload_mode: minimal` envía solo el `txid` y obliga al sistema a consultar el cobro.' },
        ],
      },
      {
        id: 'criar',
        title: 'Crea el cobro',
        blocks: [
          { type: 'p', text: 'En el checkout. Guarda el `txid` en el pedido. El gateway devuelve el BR Code en `qr_code` (el copia y pega) y **tu sistema genera la imagen del código QR** a partir de él, con cualquier biblioteca de QR. La `Idempotency-Key` hace que un reintento de red devuelva el mismo cobro en lugar de crear otro.' },
          { type: 'tabs', samples: createChargeSamples(origin) },
          { type: 'code', lang: 'json', title: '201', code: chargeResponseSample },
          { type: 'p', text: 'En cuanto se crea, el cobro aparece en la fila de [Cobros en vivo](/), con el nombre del cliente, donde puede marcarse como pagado.' },
        ],
      },
      {
        id: 'receber',
        title: 'Recibe el webhook',
        blocks: [
          { type: 'p', text: 'Verifica la firma sobre el cuerpo crudo, descarta eventos repetidos por el `id`, encola el trabajo y responde `2xx` rápido. Cualquier otra respuesta, o tardar más de 5 s, hace que el gateway reintente más tarde.' },
          { type: 'tabs', samples: receiveSamples },
        ],
      },
      {
        id: 'consultar',
        title: 'Confirma con la consulta',
        blocks: [
          { type: 'p', text: 'El webhook avisa; la consulta confirma. En el job, llama a `GET /api/charges/:txid`, bloquea el pedido y solo entonces márcalo como pagado. El cobro siempre se paga por el monto exacto, así que basta revisar el `status`.' },
          { type: 'tabs', samples: confirmSamples },
        ],
      },
      {
        id: 'reconciliar',
        title: 'Concilia el día',
        blocks: [
          { type: 'p', text: 'Los webhooks se pierden. Un job programado lista los Pix recibidos en el periodo y los compara con los pedidos: lo pagado que no está marcado se corrige, y los Pix sin cobro (`txid: null`) van a revisión.' },
          { type: 'code', lang: 'bash', code: reconcileSample(origin) },
          { type: 'p', text: 'Para probarlo, paga un cobro en la central eligiendo **Perder el webhook**: solo la conciliación encontrará ese pago.' },
        ],
      },
      {
        id: 'checklist',
        title: 'Antes de cambiar al PSP real',
        blocks: [
          {
            type: 'ul',
            items: [
              'El pedido solo pasa a pagado después de la consulta, nunca solo por el cuerpo del webhook.',
              'El handler acepta el mismo evento dos veces sin efectos secundarios.',
              'Un webhook perdido se recupera con la conciliación.',
              'Un webhook tardío, que llega después de la conciliación, no paga el pedido otra vez.',
              'El checkout maneja `gateway_unavailable` (503) y respuestas lentas sin romperse.',
            ],
          },
          { type: 'p', text: 'Cada punto tiene un escenario listo en [Simulación](/docs/simulacao).' },
        ],
      },
    ],
  },
  'en-us': {
    title: 'Integration',
    lead: 'The full path of a system that receives Pix: credentials, webhook, charge, confirmation and reconciliation. The examples already point to this gateway; swap the URL and keys for the real PSP’s when you go to production.',
    next: { to: '/docs/webhooks', label: 'Webhooks' },
    sections: [
      {
        id: 'cliente',
        title: 'Create the client',
        blocks: [
          { type: 'p', text: 'In [Clients](/clientes), create a client for your system. The center shows the **API key** once, together with the **webhook secret** and the gateway URL, ready for your `.env`:' },
          { type: 'code', lang: 'bash', title: '.env', code: envSample(origin) },
          { type: 'p', text: 'Every call carries `Authorization: Bearer $PIX_API_KEY`. If the key is lost, generate another on the same screen: the old one stops working immediately.' },
        ],
      },
      {
        id: 'respostas',
        title: 'How the API responds',
        blocks: [
          { type: 'p', text: 'Integration routes are built for system-to-system traffic and return only what is needed: `{ success, code, data }`. There are no text messages; the `code` says what happened and your system decides what to show.' },
          { type: 'code', lang: 'http', title: 'Errors', code: errorResponseSample },
          { type: 'p', text: 'The full list of codes is in the [API reference](/docs/api#codigos).' },
        ],
      },
      {
        id: 'webhook-url',
        title: 'Register the webhook URL',
        blocks: [
          { type: 'p', text: 'In the center, under [Clients](/clientes), edit the client and set the URL, `auth_mode` and `payload_mode`. The integration API does not change settings: everything stays in the center. With the gateway in Docker and your system on the host, use `host.docker.internal` instead of `localhost`.' },
          { type: 'p', text: '`auth_mode: hmac` signs the body with the secret in the `X-Signature` header; `token` sends the secret itself in `X-Webhook-Token`. `payload_mode: minimal` sends only the `txid` and makes the system look the charge up.' },
        ],
      },
      {
        id: 'criar',
        title: 'Create the charge',
        blocks: [
          { type: 'p', text: 'At checkout. Store the `txid` on the order. The gateway returns the BR Code in `qr_code` (copy and paste) and **your system renders the QR Code image** from it, with any QR library. The `Idempotency-Key` makes a network retry return the same charge instead of creating another.' },
          { type: 'tabs', samples: createChargeSamples(origin) },
          { type: 'code', lang: 'json', title: '201', code: chargeResponseSample },
          { type: 'p', text: 'As soon as it is created, the charge shows up in the [Live charges](/) queue with the client’s name, where it can be marked as paid.' },
        ],
      },
      {
        id: 'receber',
        title: 'Receive the webhook',
        blocks: [
          { type: 'p', text: 'Verify the signature over the raw body, drop repeated events by `id`, queue the work and answer `2xx` quickly. Any other response, or taking more than 5 s, makes the gateway retry later.' },
          { type: 'tabs', samples: receiveSamples },
        ],
      },
      {
        id: 'consultar',
        title: 'Confirm with a lookup',
        blocks: [
          { type: 'p', text: 'The webhook notifies; the lookup confirms. In the job, call `GET /api/charges/:txid`, lock the order and only then mark it as paid. A charge is always paid for its exact amount, so checking `status` is enough.' },
          { type: 'tabs', samples: confirmSamples },
        ],
      },
      {
        id: 'reconciliar',
        title: 'Reconcile the day',
        blocks: [
          { type: 'p', text: 'Webhooks get lost. A scheduled job lists the Pix received in the period and checks them against orders: anything paid but not marked is fixed, and Pix without a charge (`txid: null`) go to review.' },
          { type: 'code', lang: 'bash', code: reconcileSample(origin) },
          { type: 'p', text: 'To test it, pay a charge in the center choosing **Lose the webhook**: only reconciliation will find that payment.' },
        ],
      },
      {
        id: 'checklist',
        title: 'Before switching to the real PSP',
        blocks: [
          {
            type: 'ul',
            items: [
              'An order becomes paid only after the lookup, never from the webhook body alone.',
              'The handler accepts the same event twice with no side effect.',
              'A lost webhook is recovered by reconciliation.',
              'A late webhook, arriving after reconciliation, does not pay the order again.',
              'Checkout handles `gateway_unavailable` (503) and slow responses without breaking.',
            ],
          },
          { type: 'p', text: 'Each item has a ready-made scenario in [Simulation](/docs/simulacao).' },
        ],
      },
    ],
  },
});
