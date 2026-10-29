import { eq } from 'drizzle-orm';
import { db } from '../utils/db';
import { charges, merchants, pixPayments } from '../db/schema';
import { generateEndToEndId } from '../utils/pix/ids';
import { resolvePayer, type PayerInput } from '../utils/pix/payer';
import { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';
import type { EChargeConfirmationSource } from '#shared/resources/charge/enums/ChargeConfirmationSource';
import { EWebhookEvent } from '#shared/resources/webhook/enums/WebhookEvent';
import { ERealtimeEvent } from '#shared/resources/realtime/enums/RealtimeEvent';
import { enqueueWebhook } from './webhooks';
import { publishRealtimeEvent } from './realtime';
import { serializeCharge, serializePix, type ChargeRow, type MerchantRow, type PixRow } from './serializers';

export type WebhookSimulationOptions = {
  skip?: boolean;
  delaySeconds?: number;
  duplicates?: number;
};

export type ConfirmPaymentOptions = {
  source: EChargeConfirmationSource;
  payer?: PayerInput;
  infoPayer?: string;
  /** Horário do pagamento no SPI. Padrão: agora. */
  paidAt?: Date;
  webhook?: WebhookSimulationOptions;
};

export type ConfirmPaymentResult =
  | { outcome: 'paid'; charge: ChargeRow; pix: PixRow }
  | { outcome: 'already_paid'; charge: ChargeRow }
  | { outcome: 'not_payable'; charge: ChargeRow }
  | { outcome: 'not_found' };

/**
 * Liquida a cobrança: cria o Pix recebido (com endToEndId), marca a cobrança como paga
 * e grava o webhook `charge.paid` — tudo numa transação, com a linha da cobrança travada.
 * Rodar duas vezes tem o mesmo efeito que rodar uma: a segunda encontra `paid` e não faz nada.
 */
export async function confirmChargePayment(chargeId: string, options: ConfirmPaymentOptions): Promise<ConfirmPaymentResult> {
  return db.transaction(async (tx) => {
    const [charge] = await tx.select().from(charges).where(eq(charges.id, chargeId)).for('update').limit(1);
    if (!charge) return { outcome: 'not_found' } as const;

    if (charge.status === EChargeStatus.PAID) return { outcome: 'already_paid', charge } as const;

    const paidAt = options.paidAt ?? new Date();
    const payable = charge.status === EChargeStatus.PENDING && paidAt <= charge.expires_at;
    if (!payable) return { outcome: 'not_payable', charge } as const;

    const [merchant] = await tx.select().from(merchants).where(eq(merchants.id, charge.merchant_id)).limit(1);
    const payer = resolvePayer({
      name: options.payer?.name ?? charge.payer_name ?? undefined,
      document: options.payer?.document ?? charge.payer_document ?? undefined,
      ispb: options.payer?.ispb,
    });

    const [pix] = await tx.insert(pixPayments).values({
      merchant_id: charge.merchant_id,
      charge_id: charge.id,
      e2e_id: generateEndToEndId(payer.ispb, paidAt),
      txid: charge.txid,
      // Pix de cobrança é sempre do valor cobrado: não existe pagamento parcial.
      amount: charge.amount,
      info_payer: options.infoPayer ?? null,
      payer_name: payer.name,
      payer_document: payer.document,
      payer_ispb: payer.ispb,
      payer_bank_name: payer.bank_name,
      paid_at: paidAt,
    }).returning();

    const [paid] = await tx.update(charges).set({
      status: EChargeStatus.PAID,
      paid_at: paidAt,
      e2e_id: pix!.e2e_id,
      confirmed_by: options.source,
      updated_at: new Date(),
    }).where(eq(charges.id, charge.id)).returning();

    await enqueueWebhook(tx, merchant!, EWebhookEvent.CHARGE_PAID, {
      txid: paid!.txid,
      fullData: { txid: paid!.txid, charge: serializeCharge(paid!), pix: [serializePix(pix!)] },
      minimalData: { txid: paid!.txid },
      ...options.webhook,
    });

    await publishRealtimeEvent(tx, merchant!, ERealtimeEvent.CHARGE_PAID, {
      txid: paid!.txid,
      charge: serializeCharge(paid!),
      pix: serializePix(pix!),
    });

    return { outcome: 'paid', charge: paid!, pix: pix! } as const;
  });
}

export type UnsolicitedPixInput = {
  amount: number;
  payer?: PayerInput;
  infoPayer?: string;
  webhook?: WebhookSimulationOptions;
};

/** Pix recebido sem cobrança (ex.: transferência direta para a chave). Não existe cobrança local para ele. */
export async function receiveUnsolicitedPix(merchant: MerchantRow, input: UnsolicitedPixInput): Promise<PixRow> {
  return db.transaction(async (tx) => {
    const payer = resolvePayer(input.payer);
    const paidAt = new Date();

    const [pix] = await tx.insert(pixPayments).values({
      merchant_id: merchant.id,
      e2e_id: generateEndToEndId(payer.ispb, paidAt),
      amount: input.amount,
      info_payer: input.infoPayer ?? null,
      payer_name: payer.name,
      payer_document: payer.document,
      payer_ispb: payer.ispb,
      payer_bank_name: payer.bank_name,
      paid_at: paidAt,
    }).returning();

    await enqueueWebhook(tx, merchant, EWebhookEvent.PIX_RECEIVED, {
      fullData: { txid: null, pix: [serializePix(pix!)] },
      minimalData: { e2e_id: pix!.e2e_id },
      ...input.webhook,
    });

    await publishRealtimeEvent(tx, merchant, ERealtimeEvent.PIX_RECEIVED, { txid: null, pix: serializePix(pix!) });

    return pix!;
  });
}
