import { pgTable, uuid, varchar, integer, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { merchants } from './merchants';

/** Outbox de webhooks: a linha é gravada na mesma transação do evento e entregue pelo worker. */
export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchant_id: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  event: varchar('event', { length: 40 }).notNull(),
  txid: varchar('txid', { length: 35 }),
  url: text('url').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  max_attempts: integer('max_attempts').notNull(),
  next_attempt_at: timestamp('next_attempt_at', { withTimezone: true }),
  last_status_code: integer('last_status_code'),
  last_error: text('last_error'),
  delivered_at: timestamp('delivered_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('webhook_deliveries_status_next_idx').on(table.status, table.next_attempt_at),
  index('webhook_deliveries_merchant_created_idx').on(table.merchant_id, table.created_at),
]);

export const webhookAttempts = pgTable('webhook_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  delivery_id: uuid('delivery_id').notNull().references(() => webhookDeliveries.id, { onDelete: 'cascade' }),
  attempt: integer('attempt').notNull(),
  url: text('url').notNull(),
  status_code: integer('status_code'),
  response_body: text('response_body'),
  error: text('error'),
  duration_ms: integer('duration_ms').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('webhook_attempts_delivery_idx').on(table.delivery_id),
]);
