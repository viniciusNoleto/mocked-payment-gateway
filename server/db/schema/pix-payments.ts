import { pgTable, uuid, varchar, bigint, text, timestamp, index } from 'drizzle-orm/pg-core';
import { merchants } from './merchants';
import { charges } from './charges';

/** Pix recebidos pelo merchant — com ou sem cobrança associada. */
export const pixPayments = pgTable('pix_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchant_id: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  charge_id: uuid('charge_id').references(() => charges.id, { onDelete: 'set null' }),
  e2e_id: varchar('e2e_id', { length: 32 }).notNull().unique(),
  txid: varchar('txid', { length: 35 }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  info_payer: text('info_payer'),
  payer_name: varchar('payer_name', { length: 200 }).notNull(),
  payer_document: varchar('payer_document', { length: 14 }).notNull(),
  payer_ispb: varchar('payer_ispb', { length: 8 }).notNull(),
  payer_bank_name: varchar('payer_bank_name', { length: 100 }).notNull(),
  paid_at: timestamp('paid_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('pix_payments_merchant_paid_idx').on(table.merchant_id, table.paid_at),
]);
