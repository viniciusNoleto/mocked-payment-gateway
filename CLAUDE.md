# Mocked Payment Gateway

Gateway Pix mockado em Nuxt 4 (Nitro + h3 v1), Postgres e Drizzle. Visão geral, rotas e simulação: `README.md`.

## Padrões de API (vindos do white-label-utility-list)

- Todo handler usa `defineApiHandler`, `defineMerchantHandler` ou `defineCentralHandler` (`server/utils/`), e responde com `apiOk(event, data, EApiCode.X, status)`. Os SSE usam `defineMerchantStreamHandler` (`/api/events`) e `defineCentralStreamHandler` (`/api/central/events`).
- Erros: `throw new ApiError(status, EApiCode.X, data?)`. Nunca `createError` do h3: ele sai do envelope.
- Rotas de integração (merchant, QR) respondem `{ success, code, data }`, **sem `message`**: é conversa entre sistemas. Só as rotas da central (`/api/central/*`, usadas pelo painel) acrescentam `message` i18n, tirada de `API_CODE_MESSAGES` (`server/utils/api.ts`). Código novo → entrada em `EApiCode` (`shared/constants/apiCode.ts`) e em `API_CODE_MESSAGES`.
- A central é aberta (sem login, ligada por `NUXT_CENTRAL_ENABLED`) e vê todos os merchants. Não documente as rotas dela na referência da API do painel, que é só de integração.
- Simulação é só da central: pagar/expirar por cobrança e cenários por cliente (`merchants.simulation_settings`, tela Clientes → Simulação). Nunca crie rota de simulação autenticada por API key nem exponha os cenários na API de integração.
- Chaves JSON em snake_case. No Drizzle, a propriedade JS é igual ao nome da coluna (`created_at`, não `createdAt`).
- Valores em centavos inteiros. Datas em ISO 8601.
- Respostas montadas por serializers em `server/domain/serializers.ts`, tipados pelas interfaces de `shared/resources`.
- Validação com Zod via `readValidatedJson` / `readValidatedQuery` (422, `validation_error`, `data.errors: [{ path, code }]`). Sem mensagens nos schemas: regra própria usa o código como mensagem (`refine(…, 'paid_at_in_future')`). Parâmetro de rota uuid passa por `assertUuid`.
- Arquivos em `server/api/` viram rotas: schemas e helpers ficam em `server/schemas/` ou `server/domain/`.

## Domínio

- Mudança de estado + webhook na mesma transação (`enqueueWebhook(tx, …)`), com a linha travada por `.for('update')`. Na mesma transação, `publishRealtimeEvent(tx, …)` avisa o painel (pg_notify, entregue só no commit).
- Operações repetíveis precisam ser idempotentes (pagamento, Idempotency-Key).
- Pix de cobrança é sempre do valor cobrado: não existe pagamento parcial nem devolução. O gateway não gera imagem de QR Code; devolve só o BR Code (`qr_code`).
- O worker (`server/plugins/worker.ts` → `server/domain/worker.ts`) é o único lugar que entrega webhooks, expira cobranças e faz auto-pagamentos.

## Front (`app/`)

- Models (`I{Recurso}`) e enums (`E{Nome}`, string enum, um por arquivo) ficam em `shared/resources/{recurso}/` porque servem ao back e ao front. Importe com `#shared/...`.
- Services em `app/resources/{recurso}/services/{verbo}{Recurso}.ts`: um arquivo por endpoint, função `{verbo}{Recurso}Service`, só a chamada HTTP via `appClient`. O front fala só com `/api/central/*`.
- GET exporta a query key (`GET_{RECURSO}S_KEY` para lista, `GET_{RECURSO}_KEY = (id) => [...]` para item) e recebe `signal` (`QueryFnCtx`). Mutações não têm key.
- Query string montada com `URLSearchParams`, um `if` por parâmetro.
- `appClient` resolve com o envelope quando `success` é true e rejeita com o envelope de erro. Erros viram texto com `useApiErrorText()` (usa `message[locale]`).
- Novo service → adicionar o caso em `tests/unit/app/services.test.ts`.
- UI com shadcn-vue (`app/components/ui`, gerados pelo CLI 2.8.x; o CLI erra o import de `cn`, corrija para `~/lib/utils`) e Tailwind 4 (tokens em `app/assets/css/main.css`). Dourado de moeda (`--primary`, `--gold-*`) na ação principal e nas moedas; o resto do chrome é neutro.
- O canal ao vivo é `useGatewayStream()` (`/api/central/events`): ele invalida/atualiza o cache do TanStack Query. Sem stream, as telas consultam a cada 5 s.
- Todo texto do painel passa por `useI18n()` (`m.secao.chave`), com o dicionário em `app/locales/` (pt-br é o tipo; es-mx e en-us precisam ter as mesmas chaves). A documentação é dado em `app/content/docs/*.ts`, nos três idiomas, renderizada por `DocsRenderer`.
- Cores só por tokens (`app/assets/css/main.css`), com valor para claro e `.dark`. Nada de hex solto em componente.

## Comandos

`npm run typecheck`, `npm test`, `npm run db:generate` (após mudar o schema), `npm run db:migrate`.
