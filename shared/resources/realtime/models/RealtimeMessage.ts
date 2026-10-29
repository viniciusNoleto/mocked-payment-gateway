import type { ERealtimeEvent } from '../enums/RealtimeEvent';
import type { ICharge } from '../../charge/models/Charge';
import type { IPix } from '../../pix/models/Pix';
import type { IChargeMerchant } from '../../charge/models/Charge';

export interface IRealtimeData {
  txid: string | null;
  /** Ausente quando o objeto não cabe no limite do NOTIFY do Postgres: consulte `GET /api/charges/:txid`. */
  charge?: ICharge;
  pix?: IPix;
}

export interface IRealtimeMessage {
  id: string;
  event: ERealtimeEvent;
  created_at: string;
  /** O cliente dono do evento. */
  merchant: IChargeMerchant;
  data: IRealtimeData;
}
