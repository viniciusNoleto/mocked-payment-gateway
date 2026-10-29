import type { CodeSample } from './types';

/** Código dos exemplos, igual em todos os idiomas. */

export const envSample = (origin: string) => `PIX_GATEWAY_URL=${origin}
PIX_API_KEY=mpg_test_...
PIX_WEBHOOK_SECRET=whsec_...`;

export const createChargeSamples = (origin: string): CodeSample[] => [
  {
    label: 'curl',
    lang: 'bash',
    code: `curl -X POST ${origin}/api/charges \\
  -H "Authorization: Bearer $PIX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: order-1042" \\
  -d '{
    "amount": 4990,
    "expires_in": 1800,
    "description": "Pedido 1042",
    "external_reference": "1042"
  }'`,
  },
  {
    label: 'Node',
    lang: 'ts',
    code: `import QRCode from 'qrcode';

const response = await fetch(\`\${process.env.PIX_GATEWAY_URL}/api/charges\`, {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.PIX_API_KEY}\`,
    'Content-Type': 'application/json',
    'Idempotency-Key': \`order-\${order.id}\`,
  },
  body: JSON.stringify({
    amount: order.totalCents,
    expires_in: 1800,
    description: \`Pedido \${order.id}\`,
    external_reference: String(order.id),
  }),
});

const { success, code, data: charge } = await response.json();
if (!success) throw new Error(code);

await db.order.update({ where: { id: order.id }, data: { txid: charge.txid } });

const qrImage = await QRCode.toDataURL(charge.qr_code);`,
  },
  {
    label: 'Laravel',
    lang: 'php',
    code: `$response = Http::withToken(config('services.pix.api_key'))
    ->withHeaders(['Idempotency-Key' => "order-{$order->id}"])
    ->post(config('services.pix.url').'/api/charges', [
        'amount' => $order->total_cents,
        'expires_in' => 1800,
        'description' => "Pedido {$order->id}",
        'external_reference' => (string) $order->id,
    ]);

if (! $response->json('success')) {
    throw new PixGatewayException($response->json('code'));
}

$order->update(['txid' => $response->json('data.txid')]);

// QR Code: simplesoftwareio/simple-qrcode
$qr = QrCode::size(240)->generate($response->json('data.qr_code'));`,
  },
];

export const chargeResponseSample = `{
  "success": true,
  "code": "charge_created",
  "data": {
    "txid": "xkhbLAu2Uik29v3TL8d4brubbg09FSxJ",
    "amount": 4990,
    "status": "pending",
    "qr_code": "00020101021226…6304A1B2",
    "expires_at": "2026-10-29T02:30:41.000Z",
    "external_reference": "1042",
    "paid_at": null,
    "e2e_id": null
  }
}`;

export const errorResponseSample = `HTTP/1.1 409
{ "success": false, "code": "charge_not_pending", "data": null }

HTTP/1.1 422
{
  "success": false,
  "code": "validation_error",
  "data": { "errors": [ { "path": "amount", "code": "too_small" } ] }
}`;

export const receiveSamples: CodeSample[] = [
  {
    label: 'Node',
    lang: 'ts',
    code: `import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';

const app = express();

app.post('/webhooks/pix', express.raw({ type: 'application/json' }), async (req, res) => {
  const expected = createHmac('sha256', process.env.PIX_WEBHOOK_SECRET!).update(req.body).digest('hex');
  const received = String(req.headers['x-signature'] ?? '');

  if (received.length !== expected.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
    return res.status(401).end();
  }

  const event = JSON.parse(req.body.toString());

  const firstTime = await db.webhookEvent.createIfAbsent({ id: event.id });
  if (!firstTime) return res.status(200).end();

  if (event.event === 'charge.paid') await queue.add('confirm-payment', { txid: event.data.txid });

  res.status(200).end();
});`,
  },
  {
    label: 'Laravel',
    lang: 'php',
    code: `Route::post('/webhooks/pix', function (Request $request) {
    $expected = hash_hmac('sha256', $request->getContent(), config('services.pix.webhook_secret'));

    if (! hash_equals($expected, (string) $request->header('X-Signature'))) {
        abort(401);
    }

    $event = $request->json()->all();

    if (! WebhookEvent::firstOrCreate(['id' => $event['id']])->wasRecentlyCreated) {
        return response()->noContent();
    }

    if ($event['event'] === 'charge.paid') {
        ConfirmPixPayment::dispatch($event['data']['txid']);
    }

    return response()->noContent();
});`,
  },
];

export const confirmSamples: CodeSample[] = [
  {
    label: 'Node',
    lang: 'ts',
    code: `const response = await fetch(\`\${process.env.PIX_GATEWAY_URL}/api/charges/\${txid}\`, {
  headers: { Authorization: \`Bearer \${process.env.PIX_API_KEY}\` },
});
const { data: charge } = await response.json();

await db.$transaction(async (tx) => {
  const order = await tx.order.findUniqueOrThrow({ where: { txid } }); // + SELECT … FOR UPDATE
  if (order.status === 'paid' || charge.status !== 'paid') return;

  await tx.order.update({ where: { txid }, data: { status: 'paid', e2eId: charge.e2e_id, paidAt: charge.paid_at } });
});`,
  },
  {
    label: 'Laravel',
    lang: 'php',
    code: `public function handle(): void
{
    $charge = Http::withToken(config('services.pix.api_key'))
        ->get(config('services.pix.url')."/api/charges/{$this->txid}")
        ->throw()
        ->json('data');

    DB::transaction(function () use ($charge) {
        $order = Order::where('txid', $this->txid)->lockForUpdate()->firstOrFail();

        if ($order->status === 'paid' || $charge['status'] !== 'paid') {
            return;
        }

        $order->update(['status' => 'paid', 'e2e_id' => $charge['e2e_id'], 'paid_at' => $charge['paid_at']]);
    });
}`,
  },
];

export const reconcileSample = (origin: string) => `curl "${origin}/api/received?from=2026-10-28T00:00:00Z&to=2026-10-29T00:00:00Z&per_page=100" \\
  -H "Authorization: Bearer $PIX_API_KEY"`;

export const webhookFullSample = `{
  "id": "1f0c7a52-0d44-4a3e-9d7b-3c1b8f8e2a10",
  "event": "charge.paid",
  "created_at": "2026-10-29T01:39:41.000Z",
  "data": {
    "txid": "xkhbLAu2Uik29v3TL8d4brubbg09FSxJ",
    "charge": { "txid": "xkhbLAu2…", "amount": 4990, "status": "paid", "e2e_id": "E18236120…" },
    "pix": [
      {
        "e2e_id": "E18236120202610290139s0a1b2c3d4e",
        "amount": 4990,
        "payer": { "name": "Maria Souza", "document": "52998224725", "ispb": "18236120", "bank_name": "Nu Pagamentos S.A." },
        "paid_at": "2026-10-29T01:39:40.000Z"
      }
    ]
  }
}`;

export const webhookMinimalSample = `{
  "id": "1f0c7a52-0d44-4a3e-9d7b-3c1b8f8e2a10",
  "event": "charge.paid",
  "created_at": "2026-10-29T01:39:41.000Z",
  "data": { "txid": "xkhbLAu2Uik29v3TL8d4brubbg09FSxJ" }
}`;

export const streamSample = (origin: string) => `curl -N ${origin}/api/events -H "Authorization: Bearer $PIX_API_KEY"

event: charge.created
data: {"id":"…","event":"charge.created","merchant":{…},"data":{"txid":"…","charge":{…}}}

event: charge.paid
data: {"id":"…","event":"charge.paid","merchant":{…},"data":{"txid":"…","charge":{…},"pix":{…}}}`;

export const listEnvelopeSample = `{
  "success": true,
  "code": "ok",
  "data": {
    "items": [ … ],
    "meta": { "page": 1, "per_page": 15, "total": 42, "last_page": 3 }
  }
}`;
