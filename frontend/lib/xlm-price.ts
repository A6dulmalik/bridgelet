// #120 – Fetch XLM/USD rate and display claim amount in XLM + fiat
const STROOPS_PER_XLM = 10_000_000;
const CACHE_MS = 60_000;

let cached: { rate: number; at: number } | null = null;

export async function getXlmUsdRate(): Promise<number> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.rate;

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd',
      { next: { revalidate: 60 } },
    );
    const data = (await res.json()) as { stellar?: { usd?: number } };
    const rate = data.stellar?.usd ?? 0;
    cached = { rate, at: Date.now() };
    return rate;
  } catch {
    return cached?.rate ?? 0;
  }
}

export function stroopsToXlm(stroops: string): number {
  return parseInt(stroops, 10) / STROOPS_PER_XLM;
}

export function formatFiat(xlm: number, rate: number): string {
  return (xlm * rate).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
