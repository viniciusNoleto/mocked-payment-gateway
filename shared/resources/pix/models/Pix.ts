export interface IPixPayer {
  name: string;
  document: string;
  ispb: string;
  bank_name: string;
}

export interface IPix {
  id: string;
  e2e_id: string;
  txid: string | null;
  charge_id: string | null;
  amount: number;
  info_payer: string | null;
  payer: IPixPayer;
  paid_at: string;
  created_at: string;
}
