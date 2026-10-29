import type { ICharge } from '../../charge/models/Charge';
import type { IPix } from '../../pix/models/Pix';

export interface ISimulationPayment {
  charge: ICharge;
  pix: IPix;
}
