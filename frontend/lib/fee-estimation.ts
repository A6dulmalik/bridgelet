/**
 * Fee estimation utilities for Stellar network.
 *
 * Fetches current fee statistics from Horizon and returns a human-readable
 * estimate. Results are cached briefly to avoid hammering the API.
 *
 * The "base fee" (p50 of max_fee) is the most commonly used figure — it
 * represents what most senders offer. One ephemeral-account creation is a
 * single transaction with 1–2 operations, so we multiply by `opCount`.
 */

const HORIZON_BASE_URL =
  process.env['NEXT_PUBLIC_HORIZON_URL'] ?? 'https://horizon-testnet.stellar.org';

const STROOPS_PER_XLM = 10_000_000;
const CACHE_MS = 30_000; // 30-second cache for fee stats

interface HorizonFeeStats {
  last_ledger_base_fee: string;
  fee_charged: { p50: string };
  max_fee: { p50: string };
}

interface FeeEstimate {
  /** Fee in stroops (integer) */
  stroops: number;
  /** Fee in XLM (formatted string, e.g. "0.0000100") */
  xlm: string;
  /** Fee in USD (formatted string, e.g. "≈ $0.000003") or null if rate unavailable */
  fiat: string | null;
  /** Ledger capacity usage 0–1 */
  capacityUsage: number;
}

let feeCache: { data: HorizonFeeStats; at: number } | null = null;

async function fetchFeeStats(): Promise<HorizonFeeStats> {
  if (feeCache && Date.now() - feeCache.at < CACHE_MS) {
    return feeCache.data;
  }
  const res = await fetch(`${HORIZON_BASE_URL}/fee_stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Horizon /fee_stats returned ${res.status}`);
  const data = (await res.json()) as HorizonFeeStats;
  feeCache = { data, at: Date.now() };
  return data;
}

/**
 * Returns a fee estimate for creating one ephemeral account.
 * `xlmRate` — optional XLM/USD exchange rate; pass null to skip fiat display.
 * `opCount` — number of operations in the transaction (default 2: create + fund).
 */
export async function estimateCreateAccountFee(
  xlmRate: number | null = null,
  opCount = 2,
): Promise<FeeEstimate> {
  const stats = await fetchFeeStats();

  // p50 of max_fee is a reasonable "recommended" fee per operation
  const feePerOp = parseInt(stats.max_fee?.p50 ?? stats.last_ledger_base_fee, 10);
  const totalStroops = feePerOp * opCount;
  const totalXlm = totalStroops / STROOPS_PER_XLM;

  const xlmFormatted = totalXlm.toFixed(7);

  let fiat: string | null = null;
  if (xlmRate !== null && xlmRate > 0) {
    const usdValue = totalXlm * xlmRate;
    fiat = `≈ ${usdValue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    })}`;
  }

  const capacityUsage = parseFloat(
    (stats as unknown as Record<string, string>)['ledger_capacity_usage'] ?? '0',
  );

  return { stroops: totalStroops, xlm: xlmFormatted, fiat, capacityUsage };
}

/** Clears the fee cache so the next call forces a fresh fetch. */
export function clearFeeCache(): void {
  feeCache = null;
}
