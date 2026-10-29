# Mocked Payment Gateway

Gateway de pagamento **Pix** mockado, para testar integrações sem usar (nem pagar) um PSP de verdade. Ele se comporta como um provedor real: cria cobranças com BR Code, é a fonte da verdade do status, envia webhooks assinados com retentativas e lista os Pix recebidos. Uma cobrança é sempre paga pelo valor exato (não há pagamento parcial) e não há devoluções. A simulação (marcar um Pix como pago, expirar cobranças, provocar falhas) é gerida só pela central, por cobrança e por cliente.

Feito em **Nuxt 4.6** (Nitro) + **PostgreSQL** + **Drizzle ORM**, com um painel em **shadcn-vue + Tailwind 4**: documentação de integração e uma fila ao vivo para marcar Pix como pagos.

## Subindo

```bash
cp .env.example .env   # ajuste APP_PORT e POSTGRES_PORT
make install           # build, npm install, containers, migrations e seed
```

A seed cria um merchant e mostra a `api_key` e o `webhook_secret` no terminal. Para ter credenciais fixas entre reinstalações, preencha `SEED_MERCHANT_API_KEY` e `SEED_MERCHANT_WEBHOOK_SECRET` no `.env`.

Outros comandos: `make up`, `make down`, `make logs`, `make db-migrate`, `make db-seed`, `make test`, `make in-app`.

Sem Docker: suba um Postgres, use `POSTGRES_HOST=localhost` e rode `npm install && npm run db:migrate && npm run db:seed && npm run dev`.

> **Webhook para um projeto no host:** com o gateway no Docker, cadastre a URL como `http://host.docker.internal:PORTA/...` (o compose já mapeia esse host).

## Painel

Abra `http://localhost:APP_PORT`. É uma central aberta (sem login, ligada por `NUXT_CENTRAL_ENABLED`) que vê todos os clientes:

- **Cobranças ao vivo** (`/`): as cobranças de todos os clientes, com o dono de cada uma, aparecendo assim que são criadas. Cada uma é uma moeda cujo aro é o prazo restante. Um clique em **Marcar como pago** simula o pagamento (sempre pelo valor exato); o detalhe mostra o copia e cola e permite perder, atrasar ou duplicar o webhook, expirar ou cancelar. Filtro por cliente em `?cliente=<id>`.
- **Clientes** (`/clientes`): cria clientes (os sistemas que integram), mostra a API key uma única vez, gera nova API key ou novo segredo de webhook, edita a URL e os modos do webhook e configura os **cenários de simulação** de cada cliente.
- **Documentação** (`/docs`): como funciona, integração passo a passo (curl, Node, Laravel), webhooks, simulação e a referência das rotas de integração. Os exemplos usam a URL do próprio gateway.

Idioma (pt-BR, es-MX, en-US) e tema (claro, escuro, sistema) ficam na barra lateral e são guardados no navegador. Os textos estão em `app/locales/` e o conteúdo da documentação em `app/content/docs/`.

O navegador não recebe webhooks, então o painel ouve `GET /api/central/events` (Server-Sent Events). O domínio publica cada mudança com `pg_notify` dentro da mesma transação do webhook (`server/domain/realtime.ts`), e o plugin `server/plugins/realtime.ts` repassa aos painéis conectados. Funciona com várias instâncias.

## Convenções da API

- Autenticação: `Authorization: Bearer <api_key>` nas rotas de integração. As rotas `/api/central/*` são abertas.
- As rotas de integração respondem só com código, sem mensagens, porque a conversa é entre sistemas:

  ```json
  { "success": false, "code": "charge_not_pending", "data": null }
  ```

  Os códigos estão em `shared/constants/apiCode.ts` (`EApiCode`). As rotas da central acrescentam `message` (`pt-br`, `es-mx`, `en-us`) para o painel.

- Chaves JSON em `snake_case`. Valores monetários em **centavos inteiros** (`5000` = R$ 50,00).
- Listas paginadas: `?page=1&per_page=15` → `data: { items, meta: { page, per_page, total, last_page } }`.
- Erro de validação: HTTP 422, `code: validation_error` e `data.errors: [{ path, code }]` (código do Zod, como `too_small`, ou da regra, como `paid_at_in_future`).

## Rotas

### Cobranças

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/charges` | Cria a cobrança. Aceita header `Idempotency-Key`. Corpo: `amount`, `expires_in` (s, padrão 1800), `txid?`, `description?`, `external_reference?`, `payer?`, `metadata?` |
| GET | `/api/charges` | Lista. Filtros: `status`, `external_reference`, `from`, `to` |
| GET | `/api/charges/:txid` | **Fonte da verdade**: status, `paid_at`, `e2e_id` e `qr_code` (o BR Code copia e cola; a imagem do QR Code é gerada pelo sistema do cliente) |
| PATCH | `/api/charges/:txid/cancel` | Cancela uma cobrança pendente |
| GET | `/api/qr/:location_id` | Location pública do BR Code (o que o app do banco lê ao escanear) |

Status: `pending` → `paid` · `expired` · `cancelled`. A expiração é feita pelo próprio gateway quando `expires_at` vence.

### Pix recebidos

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/received` | Pix recebidos no período (`from`, `to`; padrão últimas 24h). Filtros: `txid`, `with_charge` |
| GET | `/api/received/:e2e_id` | Um Pix |

### Tempo real

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/events` | Server-Sent Events do merchant: `charge.created`, `charge.paid`, `charge.expired`, `charge.cancelled`, `pix.received`. Mesmo formato do webhook. Autentica por `Authorization`, então use `fetch` com stream (o `EventSource` não envia headers) |

### Conta

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/me` | Merchant dono da API key (sem os cenários de simulação) |
| GET | `/api/health` | Saúde do serviço e do banco |

### Central (interna, usada pelo painel)

Sem autenticação, ligadas por `NUXT_CENTRAL_ENABLED`. Não fazem parte da integração e ficam fora da referência da API no painel.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET/POST | `/api/central/merchants` | Lista (com `pending_charges` e `charges_total`) / cria (a resposta traz a `api_key` uma única vez) |
| GET/PUT/DELETE | `/api/central/merchants/:id` | Consulta (inclui o `webhook_secret`) / atualiza / remove |
| PATCH | `/api/central/merchants/:id/rotate-api-key` | Gera nova API key e invalida a anterior |
| PATCH | `/api/central/merchants/:id/rotate-webhook-secret` | Gera novo segredo do webhook |
| PUT | `/api/central/merchants/:id/simulation` | Cenários de simulação do cliente (campos parciais) |
| GET/POST | `/api/central/charges` | Cobranças de todos os clientes (`status`, `merchant_id`) / cria uma cobrança de teste para um cliente (`auto_pay_after_seconds?`) |
| GET | `/api/central/charges/stats` | Contagem por status e total aguardando (`merchant_id?`) |
| GET | `/api/central/charges/:txid` | Uma cobrança, com o cliente dono |
| POST | `/api/central/charges/:txid/pay` · `/expire` · `/cancel` | Paga (pelo valor exato, com `webhook.mode`, `delay_seconds`, `duplicates`), expira ou cancela |
| POST | `/api/central/pix` | Pix sem cobrança para um cliente (`merchant_id`, `amount`) |
| GET | `/api/central/events` | Server-Sent Events de todos os clientes |

## Webhooks

Eventos: `charge.paid`, `charge.expired`, `charge.cancelled` e `pix.received` (Pix sem cobrança).

```json
{
  "id": "evento-uuid",
  "event": "charge.paid",
  "created_at": "2026-10-29T01:39:41.000Z",
  "data": { "txid": "…", "charge": { }, "pix": [ { "e2e_id": "E…", "amount": 5000 } ] }
}
```

No modo `minimal`, `data` traz só `{ "txid": "…" }` e o merchant precisa consultar `GET /api/charges/:txid`, como em alguns PSPs reais.

Headers: `X-Webhook-Id` (id do evento, igual entre duplicatas e retentativas), `X-Webhook-Delivery-Id`, `X-Webhook-Event`, `X-Webhook-Attempt`, `X-Webhook-Timestamp` e:

- `auth_mode = hmac`: `X-Signature` = HMAC-SHA256 em hex do **corpo cru**, com o `webhook_secret`.
- `auth_mode = token`: `X-Webhook-Token` = o próprio `webhook_secret`.

Verificação no merchant (Node):

```ts
const expected = createHmac('sha256', process.env.PIX_WEBHOOK_SECRET!).update(rawBody).digest('hex');
if (!timingSafeEqual(Buffer.from(expected), Buffer.from(req.headers['x-signature'] ?? ''))) return res.status(401).end();
```

Qualquer resposta `2xx` conta como entregue. Fora disso (ou timeout de `NUXT_WEBHOOK_TIMEOUT_MS`), o gateway tenta de novo seguindo `NUXT_WEBHOOK_RETRY_SCHEDULE` (padrão: 10s, 30s, 1min, 5min, 15min, 30min, 1h, 2h, 4h, 8h). Esgotadas as tentativas, a entrega fica `failed` e o pagamento só é achado pela reconciliação.

## Simulação

Gerida **só pela central**: o sistema do cliente não tem rota de simulação, só sente os efeitos. Nada disso aparece na referência da API do painel.

- **Por cobrança** (fila ao vivo ou `POST /api/central/charges/:txid/pay`): pagar entregando o webhook na hora, atrasado (`delay_seconds`), duplicado (`duplicates`) ou perdido (`mode: skip`, fica `dropped`); expirar; cancelar. O Pix chega sempre com o valor da cobrança.
- **Por cliente** (`/clientes` → Simulação, ou `PUT /api/central/merchants/:id/simulation`), em `merchants.simulation_settings`:

| Campo | Efeito |
| --- | --- |
| `outage` | Toda a API de integração do cliente responde 503 (PSP fora do ar) |
| `latency_ms` | Atraso em cada resposta |
| `failure_rate` | % de requisições que falham com 500 |
| `webhook_drop` | Todos os webhooks são perdidos |
| `webhook_delay_seconds` | Atraso antes da primeira tentativa de cada webhook |
| `webhook_duplicates` | Cópias extras de cada webhook, com o mesmo `X-Webhook-Id` |
| `auto_pay_after_seconds` | Toda cobrança nova é paga pelo gateway após N segundos (`null` desliga) |

- **Pix sem cobrança** (`POST /api/central/pix`): chega como `pix.received` com `txid` null, para a conferência diária.

## Do guia Laravel para o Nuxt

O guia de referência descreve o lado do merchant. Aqui está o lado do PSP, com as mesmas garantias:

| No guia (Laravel) | Aqui (Nuxt/Nitro) |
| --- | --- |
| Tabela `payments` com `txid` e `e2e_id` únicos, valores em centavos | `charges` e `pix_payments` com as mesmas restrições (`server/db/schema`) |
| Job idempotente com `lockForUpdate` e checagem de status | `confirmChargePayment` com `SELECT … FOR UPDATE` numa transação (`server/domain/payments.ts`) |
| Evento só após o commit | Outbox: o webhook é gravado na mesma transação e enviado pelo worker |
| Fila + `queue:work` + `schedule:run` | Plugin Nitro com worker em processo; reserva com `FOR UPDATE SKIP LOCKED`, seguro com várias instâncias |
| PSP reenvia webhook sem 2xx | Retentativas com intervalos crescentes e histórico de tentativas |
| Assinatura HMAC / token | `auth_mode` `hmac` ou `token` |
| `$gateway->find($txid)` | `GET /api/charges/:txid` |
| `listReceived(from, to)` | `GET /api/received?from&to` |
| Webhook perdido, atrasado, duplicado, PSP fora do ar | Cenários de simulação na central |

O mTLS e a allowlist de IP do guia ficam a cargo da infraestrutura (Nginx) e não são simulados.

## Testes

```bash
npm test                                                     # unitários (BR Code/CRC16, ids, CPF, HMAC, services do front)
E2E_BASE_URL=http://localhost:3010 npm test                  # inclui o fluxo e2e contra o gateway rodando
```

Com o gateway no Docker, adicione `E2E_WEBHOOK_HOST=host.docker.internal`.

## Estrutura

```
server/
├── api/          # rotas (uma por arquivo, sufixo do método HTTP)
├── domain/       # regras: cobranças, pagamentos, Pix, webhooks, tempo real, worker
├── schemas/      # schemas Zod compartilhados entre rotas
├── utils/        # envelope de resposta, auth, validação, cripto, utilidades Pix (BR Code, ids)
├── plugins/      # worker em processo
└── db/           # schema Drizzle, migrations e seed
shared/
├── types/        # envelope, paginação, payloads
└── resources/    # models (I{Recurso}) e enums (E{Nome}) usados pelo back e pelo front
app/
├── pages/        # / (cobranças ao vivo), /clientes e /docs/*
├── locales/      # textos do painel em pt-br, es-mx e en-us
├── content/docs/ # conteúdo da documentação nos três idiomas
├── components/   # ui/ (shadcn-vue), app/ (casca, moeda, preferências), charges/, clients/, docs/
├── composables/  # idioma, stream ao vivo, ações de cobrança, formatação
├── utils/        # appClient (fetch das rotas da central), gatewayStream (SSE)
├── plugins/      # TanStack Vue Query, token do appClient
└── resources/    # services por recurso, um arquivo por endpoint
```
