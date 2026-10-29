export type PixBank = {
  ispb: string;
  name: string;
};

/** Instituições usadas para gerar pagadores fictícios. */
export const PIX_BANKS: PixBank[] = [
  { ispb: '00000000', name: 'Banco do Brasil S.A.' },
  { ispb: '00360305', name: 'Caixa Econômica Federal' },
  { ispb: '60701190', name: 'Itaú Unibanco S.A.' },
  { ispb: '60746948', name: 'Banco Bradesco S.A.' },
  { ispb: '90400888', name: 'Banco Santander (Brasil) S.A.' },
  { ispb: '18236120', name: 'Nu Pagamentos S.A.' },
  { ispb: '00416968', name: 'Banco Inter S.A.' },
  { ispb: '10573521', name: 'Mercado Pago IP Ltda.' },
  { ispb: '22896431', name: 'PicPay Instituição de Pagamento S.A.' },
];

export function findBank(ispb: string): PixBank {
  return PIX_BANKS.find(bank => bank.ispb === ispb) ?? { ispb, name: 'Instituição Desconhecida' };
}

export function randomBank(): PixBank {
  return PIX_BANKS[Math.floor(Math.random() * PIX_BANKS.length)]!;
}
