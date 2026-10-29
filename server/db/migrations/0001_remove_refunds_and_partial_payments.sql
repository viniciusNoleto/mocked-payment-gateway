-- Pix de cobrança é sempre do valor cobrado: corrige pagamentos parciais antigos antes de remover paid_amount.
UPDATE "pix_payments" AS p SET "amount" = c."amount" FROM "charges" AS c WHERE p."charge_id" = c."id" AND p."amount" <> c."amount";--> statement-breakpoint
DELETE FROM "webhook_deliveries" WHERE "event" IN ('refund.completed', 'refund.failed');--> statement-breakpoint
DROP TABLE "refunds" CASCADE;--> statement-breakpoint
ALTER TABLE "charges" DROP COLUMN "paid_amount";--> statement-breakpoint
ALTER TABLE "charges" DROP COLUMN "refunded_amount";--> statement-breakpoint
ALTER TABLE "pix_payments" DROP COLUMN "refunded_amount";