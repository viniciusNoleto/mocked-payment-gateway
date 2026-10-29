import type { SupportedLocale } from '#shared/constants/locale';
import type { DocsPageDefinition, DocsSectionContent } from './types';
import { errorResponseSample, listEnvelopeSample } from './samples';

type Text = Record<SupportedLocale, string>;
type BodyField = { name: string; type: string; required?: boolean; text: Text };
type Route = { method: string; path: string; text: Text; body?: { fields: BodyField[]; example: string } };

const t = (pt: string, es: string, en: string): Text => ({ 'pt-br': pt, 'es-mx': es, 'en-us': en });

const CHARGE_BODY_EXAMPLE = `{
  "amount": 4990,
  "expires_in": 1800,
  "txid": "Pedido1042K7m2Q9w4E8r6T1y5",
  "description": "Pedido 1042",
  "external_reference": "1042",
  "payer": { "name": "Maria Souza", "document": "52998224725" },
  "metadata": { "channel": "checkout" }
}`;

/** Só as rotas que os sistemas dos clientes chamam, como na referência de um PSP real. A central e a simulação ficam fora. */
const GROUPS: { id: string; title: Text; lead?: Text; routes: Route[] }[] = [
  {
    id: 'cobrancas',
    title: t('Cobranças', 'Cobros', 'Charges'),
    lead: t(
      'A cobrança é o que você espera receber: um valor, um prazo e o BR Code que o pagador lê. Ela é identificada pelo `txid`.',
      'El cobro es lo que esperas recibir: un monto, un plazo y el BR Code que lee el pagador. Se identifica por el `txid`.',
      'A charge is what you expect to receive: an amount, a deadline and the BR Code the payer scans. It is identified by its `txid`.',
    ),
    routes: [
      {
        method: 'POST',
        path: '/api/charges',
        text: t('Cria a cobrança. Aceita o header `Idempotency-Key`: repetir a chamada com a mesma chave devolve a cobrança original.', 'Crea el cobro. Acepta el header `Idempotency-Key`: repetir la llamada con la misma clave devuelve el cobro original.', 'Creates the charge. Accepts the `Idempotency-Key` header: repeating the call with the same key returns the original charge.'),
        body: {
          example: CHARGE_BODY_EXAMPLE,
          fields: [
            { name: 'amount', type: 'integer', required: true, text: t('Valor em centavos, maior que zero. `4990` é R$ 49,90.', 'Monto en centavos, mayor que cero. `4990` son R$ 49,90.', 'Amount in cents, greater than zero. `4990` is R$ 49.90.') },
            { name: 'expires_in', type: 'integer', text: t('Segundos até expirar, de 1 a 604800 (7 dias). Padrão: 1800.', 'Segundos hasta expirar, de 1 a 604800 (7 días). Por defecto: 1800.', 'Seconds until it expires, 1 to 604800 (7 days). Default: 1800.') },
            { name: 'txid', type: 'string', text: t('De 26 a 35 letras e números. Sem ele, o gateway gera um.', 'De 26 a 35 letras y números. Sin él, el gateway genera uno.', '26 to 35 letters and digits. If omitted, the gateway generates one.') },
            { name: 'description', type: 'string', text: t('Até 140 caracteres. Aparece para o pagador.', 'Hasta 140 caracteres. Lo ve el pagador.', 'Up to 140 characters. Shown to the payer.') },
            { name: 'external_reference', type: 'string', text: t('Até 100 caracteres. O id do pedido no seu sistema; serve de filtro na listagem.', 'Hasta 100 caracteres. El id del pedido en tu sistema; sirve de filtro en la lista.', 'Up to 100 characters. The order id in your system; usable as a list filter.') },
            { name: 'payer', type: 'object', text: t('Quem deve pagar. Informativo: o Pix pode vir de outra pessoa.', 'Quién debe pagar. Informativo: el Pix puede venir de otra persona.', 'Who is expected to pay. Informational: the Pix may come from someone else.') },
            { name: 'payer.name', type: 'string', text: t('Até 200 caracteres.', 'Hasta 200 caracteres.', 'Up to 200 characters.') },
            { name: 'payer.document', type: 'string', text: t('CPF (11 dígitos) ou CNPJ (14 dígitos), só números.', 'CPF (11 dígitos) o CNPJ (14 dígitos), solo números.', 'CPF (11 digits) or CNPJ (14 digits), digits only.') },
            { name: 'metadata', type: 'object', text: t('Pares chave-valor livres, devolvidos como foram enviados.', 'Pares clave-valor libres, devueltos tal como se enviaron.', 'Free key-value pairs, returned as sent.') },
          ],
        },
      },
      { method: 'GET', path: '/api/charges', text: t('Lista. Filtros: status, external_reference, from, to, page, per_page.', 'Lista. Filtros: status, external_reference, from, to, page, per_page.', 'Lists. Filters: status, external_reference, from, to, page, per_page.') },
      { method: 'GET', path: '/api/charges/:txid', text: t('Fonte da verdade: status, paid_at, e2e_id e qr_code (o BR Code; a imagem é com o seu sistema).', 'Fuente de verdad: status, paid_at, e2e_id y qr_code (el BR Code; la imagen la genera tu sistema).', 'Source of truth: status, paid_at, e2e_id and qr_code (the BR Code; your system renders the image).') },
      { method: 'PATCH', path: '/api/charges/:txid/cancel', text: t('Cancela uma cobrança pendente.', 'Cancela un cobro pendiente.', 'Cancels a pending charge.') },
    ],
  },
  {
    id: 'recebidos',
    title: t('Pix recebidos', 'Pix recibidos', 'Received Pix'),
    lead: t(
      'O Pix é o dinheiro que de fato entrou na conta, identificado pelo `e2e_id` do SPI. Quase todo Pix paga uma cobrança, mas nem todo: quem paga direto na chave gera um Pix sem cobrança (`txid: null`). Por isso as duas coisas têm rotas próprias. Use estas para a reconciliação diária e para conferir um comprovante; para saber se um pedido foi pago, consulte a cobrança.',
      'El Pix es el dinero que de verdad entró en la cuenta, identificado por el `e2e_id` del SPI. Casi todo Pix paga un cobro, pero no todos: quien paga directo a la llave genera un Pix sin cobro (`txid: null`). Por eso cada cosa tiene sus rutas. Usa estas para la conciliación diaria y para verificar un comprobante; para saber si un pedido se pagó, consulta el cobro.',
      'A Pix is money that actually reached the account, identified by its SPI `e2e_id`. Almost every Pix pays a charge, but not all: paying straight to the key creates a Pix without a charge (`txid: null`). That is why each has its own routes. Use these for daily reconciliation and to check a receipt; to know whether an order was paid, look up the charge.',
    ),
    routes: [
      { method: 'GET', path: '/api/received', text: t('Pix recebidos no período (from, to; padrão últimas 24 h). Filtros: txid, with_charge (`false` traz só os sem cobrança).', 'Pix recibidos en el periodo (from, to; últimas 24 h por defecto). Filtros: txid, with_charge (`false` trae solo los sin cobro).', 'Pix received in the period (from, to; default last 24 h). Filters: txid, with_charge (`false` returns only those without a charge).') },
      { method: 'GET', path: '/api/received/:e2e_id', text: t('Um Pix pelo endToEndId, o mesmo do comprovante do pagador.', 'Un Pix por su endToEndId, el mismo del comprobante del pagador.', 'One Pix by its endToEndId, the same as on the payer’s receipt.') },
    ],
  },
  {
    id: 'conta',
    title: t('Conta e tempo real', 'Cuenta y tiempo real', 'Account and real time'),
    routes: [
      { method: 'GET', path: '/api/me', text: t('O cliente dono da API key.', 'El cliente dueño de la API key.', 'The client that owns the API key.') },
      { method: 'GET', path: '/api/events', text: t('Server-Sent Events do cliente: charge.created, charge.paid, charge.expired, charge.cancelled, pix.received.', 'Server-Sent Events del cliente: charge.created, charge.paid, charge.expired, charge.cancelled, pix.received.', 'The client’s Server-Sent Events: charge.created, charge.paid, charge.expired, charge.cancelled, pix.received.') },
    ],
  },
];

const CODES: [string, string, Text][] = [
  ['ok', '200', t('Consulta respondida.', 'Consulta respondida.', 'Lookup answered.')],
  ['charge_created', '201', t('Cobrança criada.', 'Cobro creado.', 'Charge created.')],
  ['charge_replayed', '200', t('Mesma Idempotency-Key: devolve a cobrança original.', 'Misma Idempotency-Key: devuelve el cobro original.', 'Same Idempotency-Key: returns the original charge.')],
  ['charge_cancelled', '200', t('Cobrança cancelada.', 'Cobro cancelado.', 'Charge cancelled.')],
  ['invalid_payload', '400', t('Corpo que não é JSON válido.', 'Cuerpo que no es JSON válido.', 'Body is not valid JSON.')],
  ['unauthorized', '401', t('API key ausente ou inválida.', 'API key ausente o inválida.', 'Missing or invalid API key.')],
  ['not_found', '404', t('Registro não encontrado (ou de outro cliente).', 'Registro no encontrado (o de otro cliente).', 'Record not found (or owned by another client).')],
  ['route_not_found', '404', t('Rota inexistente.', 'Ruta inexistente.', 'No such route.')],
  ['txid_taken', '409', t('Já existe cobrança com este txid.', 'Ya existe un cobro con este txid.', 'A charge with this txid already exists.')],
  ['charge_not_pending', '409', t('Cancelar uma cobrança que não está pendente.', 'Cancelar un cobro que no está pendiente.', 'Cancelling a charge that is not pending.')],
  ['validation_error', '422', t('Campos inválidos em data.errors: [{ path, code }].', 'Campos inválidos en data.errors: [{ path, code }].', 'Invalid fields in data.errors: [{ path, code }].')],
  ['server_error', '500', t('Erro inesperado. Tente de novo.', 'Error inesperado. Inténtalo de nuevo.', 'Unexpected error. Try again.')],
  ['gateway_unavailable', '503', t('PSP temporariamente fora do ar. Tente de novo mais tarde.', 'PSP temporalmente caído. Inténtalo más tarde.', 'PSP temporarily unavailable. Try again later.')],
];

const COPY = {
  'pt-br': {
    title: 'Referência da API',
    lead: 'As rotas que os sistemas dos clientes chamam. Clientes, chaves, webhook e a fila ao vivo são geridos pela central, que não faz parte da integração.',
    conventions: 'Convenções',
    conventionsItems: [
      'Autenticação: `Authorization: Bearer <api_key>`, a chave gerada em [Clientes](/clientes).',
      'Respostas em `{ success, code, data }`, sem mensagens de texto. Decida pelo HTTP status e pelo `code`.',
      'Chaves JSON em `snake_case`, valores em centavos inteiros, datas em ISO 8601.',
      'Listas paginadas com `?page=1&per_page=15` (máximo 100).',
    ],
    list: 'Lista paginada',
    codes: 'Códigos',
    codesLead: 'Todo envelope traz um `code`. Os de erro vêm com `success: false`.',
    codesHead: ['code', 'HTTP', 'Quando'],
    errors: 'Exemplos de erro',
    head: ['Método', 'Rota', 'Para quê'] as [string, string, string],
    body: { body: 'Corpo (JSON)', required: 'obrigatório', more: 'Ver mais sobre o corpo', less: 'Ver menos', head: ['Campo', 'Tipo', 'Descrição'] as [string, string, string] },
  },
  'es-mx': {
    title: 'Referencia de la API',
    lead: 'Las rutas que llaman los sistemas de los clientes. Clientes, claves, webhook y la fila en vivo se gestionan en la central, que no forma parte de la integración.',
    conventions: 'Convenciones',
    conventionsItems: [
      'Autenticación: `Authorization: Bearer <api_key>`, la clave generada en [Clientes](/clientes).',
      'Respuestas en `{ success, code, data }`, sin mensajes de texto. Decide por el estado HTTP y el `code`.',
      'Claves JSON en `snake_case`, montos en centavos enteros, fechas en ISO 8601.',
      'Listas paginadas con `?page=1&per_page=15` (máximo 100).',
    ],
    list: 'Lista paginada',
    codes: 'Códigos',
    codesLead: 'Todo sobre trae un `code`. Los de error vienen con `success: false`.',
    codesHead: ['code', 'HTTP', 'Cuándo'],
    errors: 'Ejemplos de error',
    head: ['Método', 'Ruta', 'Para qué'] as [string, string, string],
    body: { body: 'Cuerpo (JSON)', required: 'obligatorio', more: 'Ver más sobre el cuerpo', less: 'Ver menos', head: ['Campo', 'Tipo', 'Descripción'] as [string, string, string] },
  },
  'en-us': {
    title: 'API reference',
    lead: 'The routes client systems call. Clients, keys, the webhook and the live queue are managed in the center, which is not part of the integration.',
    conventions: 'Conventions',
    conventionsItems: [
      'Authentication: `Authorization: Bearer <api_key>`, the key generated in [Clients](/clientes).',
      'Responses are `{ success, code, data }`, with no text messages. Decide on the HTTP status and the `code`.',
      'JSON keys in `snake_case`, amounts in integer cents, dates in ISO 8601.',
      'Paginated lists with `?page=1&per_page=15` (max 100).',
    ],
    list: 'Paginated list',
    codes: 'Codes',
    codesLead: 'Every envelope carries a `code`. Error codes come with `success: false`.',
    codesHead: ['code', 'HTTP', 'When'],
    errors: 'Error examples',
    head: ['Method', 'Route', 'What for'] as [string, string, string],
    body: { body: 'Body (JSON)', required: 'required', more: 'See more about the body', less: 'See less', head: ['Field', 'Type', 'Description'] as [string, string, string] },
  },
};

export const apiDocs: DocsPageDefinition = () => {
  const build = (locale: SupportedLocale) => {
    const copy = COPY[locale];
    const sections: DocsSectionContent[] = [
      {
        id: 'convencoes',
        title: copy.conventions,
        blocks: [
          { type: 'ul', items: copy.conventionsItems },
          { type: 'code', lang: 'json', title: copy.list, code: listEnvelopeSample },
        ],
      },
      ...GROUPS.map((group): DocsSectionContent => ({
        id: group.id,
        title: group.title[locale],
        blocks: [
          ...(group.lead ? [{ type: 'p' as const, text: group.lead[locale] }] : []),
          {
            type: 'endpoints',
            head: copy.head,
            bodyLabels: copy.body,
            rows: group.routes.map(route => ({
              method: route.method,
              path: route.path,
              description: route.text[locale],
              body: route.body && {
                example: route.body.example,
                fields: route.body.fields.map(field => ({ name: field.name, type: field.type, required: field.required, text: field.text[locale] })),
              },
            })),
          },
        ],
      })),
      {
        id: 'codigos',
        title: copy.codes,
        blocks: [
          { type: 'p', text: copy.codesLead },
          { type: 'table', head: copy.codesHead, code: [0], numeric: [1], rows: CODES.map(([code, status, text]) => [code, status, text[locale]]) },
          { type: 'code', lang: 'http', title: copy.errors, code: errorResponseSample },
        ],
      },
    ];

    return { title: copy.title, lead: copy.lead, sections };
  };

  return { 'pt-br': build('pt-br'), 'es-mx': build('es-mx'), 'en-us': build('en-us') };
};
