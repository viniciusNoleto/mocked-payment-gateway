import type { DocsPageDefinition } from './types';

export const simulationDocs: DocsPageDefinition = () => ({
  'pt-br': {
    title: 'Simulação',
    lead: 'O lado do pagador e do imprevisto, para testar o sistema do cliente. A simulação é gerida só pela central: o sistema do cliente não tem rota para ela, ele apenas sente os efeitos, como sentiria num PSP de verdade.',
    next: { to: '/docs/api', label: 'Referência da API' },
    sections: [
      {
        id: 'onde',
        title: 'Onde fica',
        blocks: [
          {
            type: 'ul',
            items: [
              '**Por cobrança**, na fila de [Cobranças ao vivo](/): abra uma cobrança para marcá-la como paga (entregando o webhook na hora, atrasado, duplicado ou perdendo-o), expirar ou cancelar. O Pix chega sempre com o valor exato.',
              '**Por cliente**, em [Clientes](/clientes) → **Simulação**: cenários que valem para tudo o que aquele cliente faz até serem desligados, e o envio de um Pix sem cobrança.',
            ],
          },
        ],
      },
      {
        id: 'cobranca',
        title: 'Cenários de uma cobrança',
        blocks: [
          { type: 'p', text: 'Cada linha é um teste que o sistema do cliente deveria passar antes de ir para produção.' },
          {
            type: 'table',
            head: ['Cenário', 'Na central', 'O que o sistema deve fazer'],
            rows: [
              ['Pagamento normal', 'Marcar como pago, entregar na hora', 'O pedido vira pago pelo webhook e pela consulta.'],
              ['Webhook perdido', 'Marcar como pago, perder o webhook', 'Só a reconciliação (GET /api/received) acha o pagamento.'],
              ['Webhook atrasado', 'Marcar como pago, entregar atrasado', 'O webhook chega depois da reconciliação e não paga duas vezes.'],
              ['Webhook duplicado', 'Marcar como pago, entregar duplicado', 'O mesmo X-Webhook-Id chega várias vezes; o efeito é um só.'],
              ['Expiração', 'Expirar agora', 'O pedido volta a aceitar nova tentativa de pagamento.'],
              ['Cancelamento', 'Cancelar cobrança', 'O pedido recebe charge.cancelled e não espera mais o Pix.'],
            ],
          },
        ],
      },
      {
        id: 'cliente',
        title: 'Cenários do cliente',
        blocks: [
          { type: 'p', text: 'Ficam ligados até alguém desligar na central e afetam a API de integração e os webhooks daquele cliente. Os outros clientes não são afetados.' },
          {
            type: 'table',
            head: ['Cenário', 'Efeito', 'O que o sistema deve fazer'],
            rows: [
              ['PSP fora do ar', 'Toda a API responde 503 com gateway_unavailable.', 'Falhar com elegância e tentar de novo depois.'],
              ['Latência', 'Atraso em cada resposta, em milissegundos.', 'Respeitar o próprio timeout sem travar o checkout.'],
              ['Falhas aleatórias', 'Uma porcentagem das requisições falha com 500 e simulated_failure.', 'Repetir com a mesma Idempotency-Key, sem duplicar cobrança.'],
              ['Perder os webhooks', 'Nenhum webhook é entregue.', 'Achar os pagamentos pela consulta e pela reconciliação.'],
              ['Atrasar os webhooks', 'Espera antes da primeira tentativa de cada webhook.', 'Não depender do webhook para mostrar o status.'],
              ['Duplicar os webhooks', 'Cópias extras de cada evento, com o mesmo X-Webhook-Id.', 'Processar cada evento uma vez só.'],
              ['Pagar sozinho', 'Toda cobrança nova é paga após alguns segundos.', 'Rodar o fluxo inteiro sem ninguém clicar.'],
              ['Pix sem cobrança', 'Um Pix direto na chave, que chega como pix.received com txid null.', 'Mandar o Pix para análise na conferência diária.'],
            ],
          },
        ],
      },
    ],
  },
  'es-mx': {
    title: 'Simulación',
    lead: 'El lado del pagador y de lo imprevisto, para probar el sistema del cliente. La simulación se gestiona solo desde la central: el sistema del cliente no tiene ruta para ella, solo siente los efectos, como los sentiría en un PSP de verdad.',
    next: { to: '/docs/api', label: 'Referencia de la API' },
    sections: [
      {
        id: 'onde',
        title: 'Dónde está',
        blocks: [
          {
            type: 'ul',
            items: [
              '**Por cobro**, en la fila de [Cobros en vivo](/): abre un cobro para marcarlo como pagado (entregando el webhook al instante, con retraso, duplicado o perdiéndolo), expirarlo o cancelarlo. El Pix siempre llega con el monto exacto.',
              '**Por cliente**, en [Clientes](/clientes) → **Simulación**: escenarios que valen para todo lo que hace ese cliente hasta que se apaguen, y el envío de un Pix sin cobro.',
            ],
          },
        ],
      },
      {
        id: 'cobranca',
        title: 'Escenarios de un cobro',
        blocks: [
          { type: 'p', text: 'Cada fila es una prueba que el sistema del cliente debería pasar antes de ir a producción.' },
          {
            type: 'table',
            head: ['Escenario', 'En la central', 'Qué debe hacer el sistema'],
            rows: [
              ['Pago normal', 'Marcar como pagado, entregar al instante', 'El pedido pasa a pagado por el webhook y por la consulta.'],
              ['Webhook perdido', 'Marcar como pagado, perder el webhook', 'Solo la conciliación (GET /api/received) encuentra el pago.'],
              ['Webhook tardío', 'Marcar como pagado, entregar con retraso', 'El webhook llega después de la conciliación y no paga dos veces.'],
              ['Webhook duplicado', 'Marcar como pagado, entregar duplicado', 'El mismo X-Webhook-Id llega varias veces; el efecto es uno solo.'],
              ['Expiración', 'Expirar ahora', 'El pedido vuelve a aceptar otro intento de pago.'],
              ['Cancelación', 'Cancelar cobro', 'El pedido recibe charge.cancelled y ya no espera el Pix.'],
            ],
          },
        ],
      },
      {
        id: 'cliente',
        title: 'Escenarios del cliente',
        blocks: [
          { type: 'p', text: 'Quedan activos hasta que alguien los apague en la central y afectan la API de integración y los webhooks de ese cliente. Los demás clientes no se ven afectados.' },
          {
            type: 'table',
            head: ['Escenario', 'Efecto', 'Qué debe hacer el sistema'],
            rows: [
              ['PSP caído', 'Toda la API responde 503 con gateway_unavailable.', 'Fallar con elegancia y reintentar después.'],
              ['Latencia', 'Retraso en cada respuesta, en milisegundos.', 'Respetar su propio timeout sin trabar el checkout.'],
              ['Fallas aleatorias', 'Un porcentaje de las solicitudes falla con 500 y simulated_failure.', 'Reintentar con la misma Idempotency-Key, sin duplicar el cobro.'],
              ['Perder los webhooks', 'No se entrega ningún webhook.', 'Encontrar los pagos por la consulta y la conciliación.'],
              ['Retrasar los webhooks', 'Espera antes del primer intento de cada webhook.', 'No depender del webhook para mostrar el estado.'],
              ['Duplicar los webhooks', 'Copias extra de cada evento, con el mismo X-Webhook-Id.', 'Procesar cada evento una sola vez.'],
              ['Pagar solo', 'Cada cobro nuevo se paga tras unos segundos.', 'Correr todo el flujo sin que nadie haga clic.'],
              ['Pix sin cobro', 'Un Pix directo a la llave, que llega como pix.received con txid null.', 'Mandar el Pix a revisión en la conciliación diaria.'],
            ],
          },
        ],
      },
    ],
  },
  'en-us': {
    title: 'Simulation',
    lead: 'The payer’s side and the unexpected, to test the client system. Simulation is managed only from the center: the client system has no route for it, it just feels the effects, as it would with a real PSP.',
    next: { to: '/docs/api', label: 'API reference' },
    sections: [
      {
        id: 'onde',
        title: 'Where it lives',
        blocks: [
          {
            type: 'ul',
            items: [
              '**Per charge**, in the [Live charges](/) queue: open a charge to mark it as paid (delivering the webhook right away, late, duplicated or losing it), expire or cancel it. The Pix always arrives with the exact amount.',
              '**Per client**, in [Clients](/clientes) → **Simulation**: scenarios that apply to everything that client does until they are turned off, and sending a Pix without a charge.',
            ],
          },
        ],
      },
      {
        id: 'cobranca',
        title: 'Charge scenarios',
        blocks: [
          { type: 'p', text: 'Each row is a test the client system should pass before production.' },
          {
            type: 'table',
            head: ['Scenario', 'In the center', 'What the system should do'],
            rows: [
              ['Normal payment', 'Mark as paid, deliver right away', 'The order becomes paid through the webhook and the lookup.'],
              ['Lost webhook', 'Mark as paid, lose the webhook', 'Only reconciliation (GET /api/received) finds the payment.'],
              ['Late webhook', 'Mark as paid, deliver late', 'The webhook arrives after reconciliation and does not pay twice.'],
              ['Duplicated webhook', 'Mark as paid, deliver duplicated', 'The same X-Webhook-Id arrives several times; the effect happens once.'],
              ['Expiration', 'Expire now', 'The order accepts a new payment attempt again.'],
              ['Cancellation', 'Cancel charge', 'The order gets charge.cancelled and stops waiting for the Pix.'],
            ],
          },
        ],
      },
      {
        id: 'cliente',
        title: 'Client scenarios',
        blocks: [
          { type: 'p', text: 'They stay on until someone turns them off in the center and affect that client’s integration API and webhooks. Other clients are not affected.' },
          {
            type: 'table',
            head: ['Scenario', 'Effect', 'What the system should do'],
            rows: [
              ['PSP down', 'The whole API answers 503 with gateway_unavailable.', 'Fail gracefully and retry later.'],
              ['Latency', 'Delay on every response, in milliseconds.', 'Honor its own timeout without freezing the checkout.'],
              ['Random failures', 'A percentage of requests fail with 500 and simulated_failure.', 'Retry with the same Idempotency-Key, without duplicating the charge.'],
              ['Lose webhooks', 'No webhook is delivered.', 'Find payments through the lookup and reconciliation.'],
              ['Delay webhooks', 'Wait before the first attempt of each webhook.', 'Not rely on the webhook to show the status.'],
              ['Duplicate webhooks', 'Extra copies of each event, with the same X-Webhook-Id.', 'Process each event only once.'],
              ['Pay by itself', 'Every new charge is paid after a few seconds.', 'Run the whole flow with nobody clicking.'],
              ['Pix without charge', 'A Pix sent straight to the key, arriving as pix.received with a null txid.', 'Send the Pix to review in the daily reconciliation.'],
            ],
          },
        ],
      },
    ],
  },
});
