export type OrderStatus = 'pending_payment' | 'confirmed' | 'preparing' | 'in_transit' | 'delivered';
export const ORDER_STATUS_FLOW: OrderStatus[] = ['pending_payment','confirmed','preparing','in_transit','delivered'];

export function isValidCpf(input: string): boolean {
  const cpf = input.replace(/\D/g, '');
  if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
  const digit = (length: number) => { let sum = 0; for (let i=0;i<length;i++) sum += Number(cpf[i]) * (length + 1 - i); const remainder = (sum * 10) % 11; return remainder === 10 ? 0 : remainder; };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}
export function calculatePlatformFeeCents(grossCents: number, percent: number): number { if (grossCents < 0 || percent < 0 || percent > 100) throw new Error('Invalid pricing input'); return Math.round(grossCents * percent / 100); }
export function isBeforeCutoff(now: Date, deliveryAt: Date, cutoffHours: number): boolean { return deliveryAt.getTime() - now.getTime() >= cutoffHours * 3600000; }
export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean { return ORDER_STATUS_FLOW.indexOf(to) === ORDER_STATUS_FLOW.indexOf(from) + 1; }
