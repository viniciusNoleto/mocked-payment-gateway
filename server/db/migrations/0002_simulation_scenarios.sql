ALTER TABLE "merchants" ALTER COLUMN "simulation_settings" SET DEFAULT '{"outage":false,"latency_ms":0,"failure_rate":0,"webhook_drop":false,"webhook_delay_seconds":0,"webhook_duplicates":0,"auto_pay_after_seconds":null}'::jsonb;--> statement-breakpoint
-- Cenários novos: clientes existentes ganham os valores padrão sem perder os que já tinham.
UPDATE "merchants" SET "simulation_settings" = '{"webhook_duplicates":0,"auto_pay_after_seconds":null}'::jsonb || "simulation_settings";
