import { randomBank, findBank } from './banks';

const FIRST_NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João'];
const LAST_NAMES = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Lima', 'Pereira', 'Costa', 'Almeida', 'Ferreira', 'Rodrigues'];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/** CPF com dígitos verificadores válidos (fictício). */
export function generateCpf(): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));

  for (const length of [9, 10]) {
    const sum = digits.slice(0, length).reduce((acc, digit, index) => acc + digit * (length + 1 - index), 0);
    const rest = (sum * 10) % 11;
    digits.push(rest === 10 ? 0 : rest);
  }

  return digits.join('');
}

export function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split('').map(Number);

  return [9, 10].every(length => {
    const sum = digits.slice(0, length).reduce((acc, digit, index) => acc + digit * (length + 1 - index), 0);
    const rest = (sum * 10) % 11;
    return (rest === 10 ? 0 : rest) === digits[length];
  });
}

export type PayerInput = {
  name?: string;
  document?: string;
  ispb?: string;
};

export type ResolvedPayer = {
  name: string;
  document: string;
  ispb: string;
  bank_name: string;
};

/** Completa os dados do pagador com valores fictícios onde não foram informados. */
export function resolvePayer(input: PayerInput = {}): ResolvedPayer {
  const bank = input.ispb ? findBank(input.ispb) : randomBank();

  return {
    name: input.name ?? `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    document: input.document ?? generateCpf(),
    ispb: bank.ispb,
    bank_name: bank.name,
  };
}
