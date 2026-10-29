CREATE TABLE "merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"pix_key" varchar(77) NOT NULL,
	"city" varchar(15) DEFAULT 'SAO PAULO' NOT NULL,
	"api_key_hash" varchar(64) NOT NULL,
	"api_key_prefix" varchar(20) NOT NULL,
	"webhook_url" text,
	"webhook_secret" varchar(100) NOT NULL,
	"webhook_auth_mode" varchar(20) DEFAULT 'hmac' NOT NULL,
	"webhook_payload_mode" varchar(20) DEFAULT 'full' NOT NULL,
	"simulation_settings" jsonb DEFAULT '{"outage":false,"latency_ms":0,"failure_rate":0,"webhook_drop":false,"webhook_delay_seconds":0}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "merchants_api_key_hash_unique" UNIQUE("api_key_hash")
);
--> statement-breakpoint
CREATE TABLE "charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"txid" varchar(35) NOT NULL,
	"location_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"amount" bigint NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"description" varchar(140),
	"external_reference" varchar(100),
	"payer_name" varchar(200),
	"payer_document" varchar(14),
	"metadata" jsonb,
	"qr_code" varchar(512) NOT NULL,
	"expires_in" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"auto_pay_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"paid_amount" bigint,
	"e2e_id" varchar(32),
	"confirmed_by" varchar(20),
	"refunded_amount" bigint DEFAULT 0 NOT NULL,
	"cancelled_at" timestamp with time zone,
	"expired_at" timestamp with time zone,
	"idempotency_key" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "charges_txid_unique" UNIQUE("txid"),
	CONSTRAINT "charges_location_id_unique" UNIQUE("location_id"),
	CONSTRAINT "charges_e2e_id_unique" UNIQUE("e2e_id")
);
--> statement-breakpoint
CREATE TABLE "pix_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"charge_id" uuid,
	"e2e_id" varchar(32) NOT NULL,
	"txid" varchar(35),
	"amount" bigint NOT NULL,
	"refunded_amount" bigint DEFAULT 0 NOT NULL,
	"info_payer" text,
	"payer_name" varchar(200) NOT NULL,
	"payer_document" varchar(14) NOT NULL,
	"payer_ispb" varchar(8) NOT NULL,
	"payer_bank_name" varchar(100) NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pix_payments_e2e_id_unique" UNIQUE("e2e_id")
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"pix_id" uuid NOT NULL,
	"refund_id" varchar(35) NOT NULL,
	"rtr_id" varchar(32) NOT NULL,
	"amount" bigint NOT NULL,
	"reason" text,
	"status" varchar(20) DEFAULT 'processing' NOT NULL,
	"failure_reason" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_rtr_id_unique" UNIQUE("rtr_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" uuid NOT NULL,
	"attempt" integer NOT NULL,
	"url" text NOT NULL,
	"status_code" integer,
	"response_body" text,
	"error" text,
	"duration_ms" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"event" varchar(40) NOT NULL,
	"txid" varchar(35),
	"url" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"last_status_code" integer,
	"last_error" text,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pix_payments" ADD CONSTRAINT "pix_payments_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pix_payments" ADD CONSTRAINT "pix_payments_charge_id_charges_id_fk" FOREIGN KEY ("charge_id") REFERENCES "public"."charges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_pix_id_pix_payments_id_fk" FOREIGN KEY ("pix_id") REFERENCES "public"."pix_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_attempts" ADD CONSTRAINT "webhook_attempts_delivery_id_webhook_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."webhook_deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "charges_merchant_created_idx" ON "charges" USING btree ("merchant_id","created_at");--> statement-breakpoint
CREATE INDEX "charges_status_expires_idx" ON "charges" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "charges_status_auto_pay_idx" ON "charges" USING btree ("status","auto_pay_at");--> statement-breakpoint
CREATE UNIQUE INDEX "charges_merchant_idempotency_key_unique" ON "charges" USING btree ("merchant_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "pix_payments_merchant_paid_idx" ON "pix_payments" USING btree ("merchant_id","paid_at");--> statement-breakpoint
CREATE UNIQUE INDEX "refunds_pix_refund_id_unique" ON "refunds" USING btree ("pix_id","refund_id");--> statement-breakpoint
CREATE INDEX "refunds_status_created_idx" ON "refunds" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "webhook_attempts_delivery_idx" ON "webhook_attempts" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_status_next_idx" ON "webhook_deliveries" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_merchant_created_idx" ON "webhook_deliveries" USING btree ("merchant_id","created_at");