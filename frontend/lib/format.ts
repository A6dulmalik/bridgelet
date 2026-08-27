/**
 * Issue #449 — Currency and amount formatting utilities.
 *
 * Stellar uses 7-decimal stroops (1 XLM = 10,000,000 stroops).
 * These helpers format amounts for display without floating-point drift.
 */

/**
 * Format a stroop amount (string or bigint) to a human-readable XLM string.
 *
 * @example
 * formatStroops('10000000')  // "10.0000000 XLM"
 * formatStroops('1500000')   // "0.1500000 XLM"
 * formatStroops('0')         // "0.0000000 XLM"
 */
export function formatStroops(
  stroops: string | bigint,
  opts?: { showSymbol?: boolean; decimals?: number },
): string {
  const { showSymbol = true, decimals = 7 } = opts ?? {};
  const bigVal = typeof stroops === 'bigint' ? stroops : BigInt(stroops);
  const divisor = BigInt(10 ** decimals);
  const whole = bigVal / divisor;
  const frac = bigVal % divisor;

  const fracStr = String(frac).padStart(decimals, '0');
  const formatted = `${whole}.${fracStr}`;
  return showSymbol ? `${formatted} XLM` : formatted;
}

/**
 * Format a decimal string amount for display with a given currency symbol.
 *
 * @example
 * formatAmount('10.5', '$')   // "$10.50"
 * formatAmount('0.001', '€')  // "€0.00"
 */
export function formatAmount(
  amount: string,
  currencySymbol?: string,
  opts?: { decimals?: number },
): string {
  const decimals = opts?.decimals ?? 2;
  const num = parseFloat(amount);
  if (!Number.isFinite(num)) return '—';

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return currencySymbol ? `${currencySymbol}${formatted}` : formatted;
}

/**
 * Format a Stellar address for display (show first 4 and last 4 chars).
 *
 * @example
 * formatStellarAddress('GBZIG...QWERT') // "GBZI…QWERT"
 */
export function formatStellarAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 1) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

/**
 * Format a relative time string (e.g., "2h ago", "in 5m").
 */
export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const absDiffMs = Math.abs(diffMs);
  const sign = diffMs < 0 ? -1 : 1;

  const seconds = Math.floor(absDiffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let value: string;
  let unit: string;

  if (days > 0) {
    value = String(days);
    unit = 'd';
  } else if (hours > 0) {
    value = String(hours);
    unit = 'h';
  } else if (minutes > 0) {
    value = String(minutes);
    unit = 'm';
  } else {
    value = String(seconds);
    unit = 's';
  }

  return sign < 0 ? `${value}${unit} ago` : `in ${value}${unit}`;
}
