import { pgTable, uuid, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import type { ISimulationSettings } from '../../../shared/resources/simulation/models/SimulationSettings';

export const DEFAULT_SIMULATION_SETTINGS: ISimulationSettings = {
  outage: false,
  latency_ms: 0,
  failure_rate: 0,
  webhook_drop: false,
  webhook_delay_seconds: 0,
  webhook_duplicates: 0,
  auto_pay_after_seconds: null,
};

export const merchants = pgTable('merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  pix_key: varchar('pix_key', { length: 77 }).notNull(),
  city: varchar('city', { length: 15 }).notNull().default('SAO PAULO'),
  api_key_hash: varchar('api_key_hash', { length: 64 }).notNull().unique(),
  api_key_prefix: varchar('api_key_prefix', { length: 20 }).notNull(),
  webhook_url: text('webhook_url'),
  webhook_secret: varchar('webhook_secret', { length: 100 }).notNull(),
  webhook_auth_mode: varchar('webhook_auth_mode', { length: 20 }).notNull().default('hmac'),
  webhook_payload_mode: varchar('webhook_payload_mode', { length: 20 }).notNull().default('full'),
  simulation_settings: jsonb('simulation_settings').$type<ISimulationSettings>().notNull().default(DEFAULT_SIMULATION_SETTINGS),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
