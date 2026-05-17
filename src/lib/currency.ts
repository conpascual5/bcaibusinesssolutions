export const CURRENCY_SYMBOL = '₱';
export const CURRENCY_CODE = 'PHP';

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toFixed(2)}`;
}
