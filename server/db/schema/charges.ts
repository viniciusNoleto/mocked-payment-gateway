import { pgTable, uuid, varchar, bigint, integer, jsonb, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { merchants } from './merchants';

export const charges = pgTable('charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchant_id: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  txid: varchar('txid', { length: 35 }).notNull().unique(),
  location_id: uuid('location_id').notNull().unique().defaultRandom(),
  amount: bigint('amount', { mode: 'number' }).notNull(), // em centavos, nunca float
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  description: varchar('description', { length: 140 }),
  external_reference: varchar('external_reference', { length: 100 }),
  payer_name: varchar('payer_name', { length: 200 }),
  payer_document: varchar('payer_document', { length: 14 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  qr_code: varchar('qr_code', { length: 512 }).notNull(),
  expires_in: integer('expires_in').notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  auto_pay_at: timestamp('auto_pay_at', { withTimezone: true }),
  paid_at: timestamp('paid_at', { withTimezone: true }),
  e2e_id: varchar('e2e_id', { length: 32 }).unique(),
  confirmed_by: varchar('confirmed_by', { length: 20 }),
  cancelled_at: timestamp('cancelled_at', { withTimezone: true }),
  expired_at: timestamp('expired_at', { withTimezone: true }),
  idempotency_key: varchar('idempotency_key', { length: 255 }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('charges_merchant_created_idx').on(table.merchant_id, table.created_at),
  index('charges_status_expires_idx').on(table.status, table.expires_at),
  index('charges_status_auto_pay_idx').on(table.status, table.auto_pay_at),
  uniqueIndex('charges_merchant_idempotency_key_unique').on(table.merchant_id, table.idempotency_key),
]);
