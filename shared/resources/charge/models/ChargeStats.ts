import type { EChargeStatus } from '../enums/ChargeStatus';

/** Resumo da central: cobranças por status e o total aguardando pagamento, em centavos. */
export interface IChargeStats {
  counts: Record<EChargeStatus, number>;
  pending_amount: number;
}
