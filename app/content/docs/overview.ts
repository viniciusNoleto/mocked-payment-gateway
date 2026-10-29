import type { DocsPageDefinition } from './types';

export const overviewDocs: DocsPageDefinition = () => ({
  'pt-br': {
    title: 'Como funciona',
    lead: 'Um PSP Pix de mentira que se comporta como um de verdade: cria cobranças com BR Code, guarda o status e envia webhooks assinados com retentativas. Você integra seus sistemas nele e testa tudo sem mover um centavo.',
    next: { to: '/docs/integracao', label: 'Integração' },
    sections: [
      {
        id: 'o-que-e',
        title: 'O que é',
        blocks: [
          { type: 'p', text: 'Integrar Pix com um PSP real exige conta, homologação e dinheiro de verdade para cada teste. Este gateway responde com o mesmo formato e as mesmas garantias de um provedor, então cada sistema roda o fluxo completo localmente: gerar a cobrança, mostrar o QR Code, receber o webhook de pagamento, conferir pela consulta e reconciliar no fim do dia.' },
          { type: 'p', text: 'Ele é a **fonte da verdade** do status, como um PSP. O sistema do cliente nunca decide que algo foi pago: ou recebe o webhook `charge.paid`, ou consulta `GET /api/charges/:txid` e vê `paid`.' },
        ],
      },
      {
        id: 'central',
        title: 'Uma central para vários clientes',
        blocks: [
          { type: 'p', text: 'Cada **cliente** é um sistema que integra com o gateway (uma loja, um app, um ambiente de testes). Em [Clientes](/clientes) você cria um, recebe a API key dele e configura a URL do webhook. A API key só aparece quando é gerada.' },
          { type: 'p', text: 'A fila de [Cobranças ao vivo](/) mostra as cobranças de todos os clientes ao mesmo tempo, com o dono de cada uma. Dali você marca qualquer uma como paga, expira ou cancela, sem trocar de credencial.' },
        ],
      },
      {
        id: 'ciclo',
        title: 'O ciclo de uma cobrança',
        blocks: [
          { type: 'p', text: 'Toda cobrança nasce `pending` e termina em um de três estados. Cada passagem dispara um webhook para a URL cadastrada pelo cliente.' },
          { type: 'lifecycle' },
          { type: 'p', text: 'Valores andam sempre em **centavos inteiros**: `4990` é R$ 49,90. Uma cobrança é sempre paga pelo valor exato: não existe pagamento parcial. O `txid` identifica a cobrança e o `e2e_id` identifica o Pix que a pagou, como no SPI.' },
        ],
      },
      {
        id: 'pecas',
        title: 'As peças do gateway',
        blocks: [
          {
            type: 'table',
            head: ['Peça', 'Onde', 'O que faz'],
            code: [1],
            rows: [
              ['API de integração', '/api/charges, /api/received', 'O que os sistemas dos clientes chamam: criam cobranças, consultam o status, e listam os Pix recebidos. Respondem só com código, sem mensagens.'],
              ['Worker', 'server/domain/worker.ts', 'Roda a cada segundo: entrega webhooks, refaz tentativas, expira cobranças vencidas e faz auto-pagamentos.'],
              ['Outbox de webhooks', 'webhook_deliveries', 'Todo evento é gravado na mesma transação que mudou o estado e só depois enviado. Sem commit, sem webhook.'],
              ['Simulação', '/clientes e /', 'O lado do pagador e do caos, só na central: pagar, expirar, receber Pix sem cobrança, deixar o PSP de um cliente fora do ar ou lento.'],
              ['Central', '/api/central/* e este painel', 'Clientes, credenciais e a fila de todas as cobranças, ao vivo por Server-Sent Events.'],
            ],
          },
        ],
      },
      {
        id: 'garantias',
        title: 'O que ele garante',
        blocks: [
          {
            type: 'ul',
            items: [
              '**Webhook se, e somente se, a mudança foi gravada.** Estado e evento entram na mesma transação, com a linha da cobrança travada.',
              '**Pagar duas vezes tem o efeito de pagar uma.** A segunda tentativa encontra `paid` e não cria outro Pix.',
              '**Criar com a mesma `Idempotency-Key`** devolve a cobrança original em vez de duplicar.',
              '**Entrega pelo menos uma vez.** Sem resposta 2xx, o worker tenta de novo em 10 s, 30 s, 1 min, 5 min, 15 min, 30 min, 1 h, 2 h, 4 h e 8 h. O handler precisa aceitar duplicatas pelo `X-Webhook-Id`.',
              '**Várias instâncias são seguras.** O worker reserva entregas com `FOR UPDATE SKIP LOCKED`.',
            ],
          },
        ],
      },
      {
        id: 'limites',
        title: 'O que não é simulado',
        blocks: [
          {
            type: 'ul',
            items: [
              'A imagem do QR Code: o gateway devolve o BR Code (`qr_code`) e o sistema do cliente desenha a imagem, como em vários PSPs.',
              'Devoluções (MED e devolução de Pix).',
              'mTLS e allowlist de IP: ficam a cargo da sua infraestrutura.',
              'Chaves Pix reais e DICT: o BR Code aponta para uma location deste gateway, que nenhum banco real vai ler.',
            ],
          },
        ],
      },
    ],
  },
  'es-mx': {
    title: 'Cómo funciona',
    lead: 'Un PSP Pix de mentira que se comporta como uno real: crea cobros con BR Code, guarda el estado y envía webhooks firmados con reintentos. Integras tus sistemas con él y pruebas todo sin mover un centavo.',
    next: { to: '/docs/integracao', label: 'Integración' },
    sections: [
      {
        id: 'o-que-e',
        title: 'Qué es',
        blocks: [
          { type: 'p', text: 'Integrar Pix con un PSP real exige cuenta, homologación y dinero de verdad en cada prueba. Este gateway responde con el mismo formato y las mismas garantías de un proveedor, así cada sistema corre el flujo completo en local: generar el cobro, mostrar el código QR, recibir el webhook de pago, confirmar con la consulta y conciliar al final del día.' },
          { type: 'p', text: 'Es la **fuente de verdad** del estado, como un PSP. El sistema del cliente nunca decide que algo se pagó: o recibe el webhook `charge.paid`, o consulta `GET /api/charges/:txid` y ve `paid`.' },
        ],
      },
      {
        id: 'central',
        title: 'Una central para varios clientes',
        blocks: [
          { type: 'p', text: 'Cada **cliente** es un sistema que se integra con el gateway (una tienda, una app, un ambiente de pruebas). En [Clientes](/clientes) creas uno, recibes su API key y configuras la URL del webhook. La API key solo se muestra al generarse.' },
          { type: 'p', text: 'La fila de [Cobros en vivo](/) muestra los cobros de todos los clientes a la vez, con el dueño de cada uno. Desde ahí marcas cualquiera como pagado, lo expiras o lo cancelas, sin cambiar de credencial.' },
        ],
      },
      {
        id: 'ciclo',
        title: 'El ciclo de un cobro',
        blocks: [
          { type: 'p', text: 'Todo cobro nace `pending` y termina en uno de tres estados. Cada transición dispara un webhook a la URL registrada por el cliente.' },
          { type: 'lifecycle' },
          { type: 'p', text: 'Los montos siempre van en **centavos enteros**: `4990` es R$ 49,90. Un cobro siempre se paga por el monto exacto: no existe el pago parcial. El `txid` identifica el cobro y el `e2e_id` identifica el Pix que lo pagó, como en el SPI.' },
        ],
      },
      {
        id: 'pecas',
        title: 'Las piezas del gateway',
        blocks: [
          {
            type: 'table',
            head: ['Pieza', 'Dónde', 'Qué hace'],
            code: [1],
            rows: [
              ['API de integración', '/api/charges, /api/received', 'Lo que llaman los sistemas de los clientes: crean cobros, consultan el estado, y listan los Pix recibidos. Responden solo con código, sin mensajes.'],
              ['Worker', 'server/domain/worker.ts', 'Corre cada segundo: entrega webhooks, reintenta, expira cobros vencidos y hace pagos automáticos.'],
              ['Outbox de webhooks', 'webhook_deliveries', 'Todo evento se graba en la misma transacción que cambió el estado y se envía después. Sin commit, no hay webhook.'],
              ['Simulación', '/clientes y /', 'El lado del pagador y del caos, solo en la central: pagar, expirar, recibir Pix sin cobro, dejar el PSP de un cliente caído o lento.'],
              ['Central', '/api/central/* y este panel', 'Clientes, credenciales y la fila de todos los cobros, en vivo por Server-Sent Events.'],
            ],
          },
        ],
      },
      {
        id: 'garantias',
        title: 'Qué garantiza',
        blocks: [
          {
            type: 'ul',
            items: [
              '**Webhook si, y solo si, el cambio se guardó.** Estado y evento entran en la misma transacción, con la fila del cobro bloqueada.',
              '**Pagar dos veces tiene el efecto de pagar una.** El segundo intento encuentra `paid` y no crea otro Pix.',
              '**Crear con la misma `Idempotency-Key`** devuelve el cobro original en lugar de duplicarlo.',
              '**Entrega al menos una vez.** Sin respuesta 2xx, el worker reintenta a los 10 s, 30 s, 1 min, 5 min, 15 min, 30 min, 1 h, 2 h, 4 h y 8 h. El handler debe aceptar duplicados por el `X-Webhook-Id`.',
              '**Varias instancias son seguras.** El worker reserva entregas con `FOR UPDATE SKIP LOCKED`.',
            ],
          },
        ],
      },
      {
        id: 'limites',
        title: 'Qué no se simula',
        blocks: [
          {
            type: 'ul',
            items: [
              'La imagen del código QR: el gateway devuelve el BR Code (`qr_code`) y el sistema del cliente dibuja la imagen, como en varios PSP.',
              'Devoluciones (MED y devolución de Pix).',
              'mTLS y lista de IP permitidas: quedan a cargo de tu infraestructura.',
              'Claves Pix reales y DICT: el BR Code apunta a una location de este gateway, que ningún banco real va a leer.',
            ],
          },
        ],
      },
    ],
  },
  'en-us': {
    title: 'How it works',
    lead: 'A fake Pix PSP that behaves like a real one: it creates charges with a BR Code, keeps the status and sends signed webhooks with retries. You integrate your systems with it and test everything without moving a cent.',
    next: { to: '/docs/integracao', label: 'Integration' },
    sections: [
      {
        id: 'o-que-e',
        title: 'What it is',
        blocks: [
          { type: 'p', text: 'Integrating Pix with a real PSP takes an account, certification and real money for every test. This gateway answers with the same format and guarantees as a provider, so each system runs the whole flow locally: create the charge, show the QR Code, receive the payment webhook, confirm with a lookup and reconcile at the end of the day.' },
          { type: 'p', text: 'It is the **source of truth** for the status, like a PSP. The client system never decides something was paid: it either receives the `charge.paid` webhook or calls `GET /api/charges/:txid` and sees `paid`.' },
        ],
      },
      {
        id: 'central',
        title: 'One center for many clients',
        blocks: [
          { type: 'p', text: 'Each **client** is a system that integrates with the gateway (a shop, an app, a test environment). In [Clients](/clientes) you create one, get its API key and set its webhook URL. The API key is shown only when it is generated.' },
          { type: 'p', text: 'The [Live charges](/) queue shows the charges of every client at once, with the owner of each. From there you mark any of them as paid, expire or cancel it, without switching credentials.' },
        ],
      },
      {
        id: 'ciclo',
        title: 'The life of a charge',
        blocks: [
          { type: 'p', text: 'Every charge is born `pending` and ends in one of three states. Each transition fires a webhook to the URL the client registered.' },
          { type: 'lifecycle' },
          { type: 'p', text: 'Amounts are always **integer cents**: `4990` is R$ 49.90. A charge is always paid for its exact amount: there are no partial payments. The `txid` identifies the charge and the `e2e_id` identifies the Pix that paid it, as in SPI.' },
        ],
      },
      {
        id: 'pecas',
        title: 'The parts of the gateway',
        blocks: [
          {
            type: 'table',
            head: ['Part', 'Where', 'What it does'],
            code: [1],
            rows: [
              ['Integration API', '/api/charges, /api/received', 'What client systems call: create charges, check the status, and list received Pix. Responses carry only a code, no messages.'],
              ['Worker', 'server/domain/worker.ts', 'Runs every second: delivers webhooks, retries, expires overdue charges and runs auto-payments.'],
              ['Webhook outbox', 'webhook_deliveries', 'Every event is written in the same transaction that changed the state and sent afterwards. No commit, no webhook.'],
              ['Simulation', '/clientes and /', 'The payer’s side and chaos, only in the center: pay, expire, receive a Pix without a charge, make a client’s PSP down or slow.'],
              ['Center', '/api/central/* and this panel', 'Clients, credentials and the queue of every charge, live over Server-Sent Events.'],
            ],
          },
        ],
      },
      {
        id: 'garantias',
        title: 'What it guarantees',
        blocks: [
          {
            type: 'ul',
            items: [
              '**A webhook if, and only if, the change was saved.** State and event go in the same transaction, with the charge row locked.',
              '**Paying twice has the effect of paying once.** The second attempt finds `paid` and creates no other Pix.',
              '**Creating with the same `Idempotency-Key`** returns the original charge instead of a duplicate.',
              '**At-least-once delivery.** Without a 2xx, the worker retries after 10 s, 30 s, 1 min, 5 min, 15 min, 30 min, 1 h, 2 h, 4 h and 8 h. Handlers must accept duplicates by `X-Webhook-Id`.',
              '**Several instances are safe.** The worker claims deliveries with `FOR UPDATE SKIP LOCKED`.',
            ],
          },
        ],
      },
      {
        id: 'limites',
        title: 'What is not simulated',
        blocks: [
          {
            type: 'ul',
            items: [
              'The QR Code image: the gateway returns the BR Code (`qr_code`) and the client system draws the image, as with many PSPs.',
              'Refunds (MED and Pix returns).',
              'mTLS and IP allowlists: they belong to your infrastructure.',
              'Real Pix keys and DICT: the BR Code points to a location on this gateway that no real bank will read.',
            ],
          },
        ],
      },
    ],
  },
});
