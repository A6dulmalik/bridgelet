import { describe, it, expect, vi, beforeEach } from 'vitest';
import { estimateCreateAccountFee, clearFeeCache } from '@/lib/fee-estimation';

const feeStatsJson = {
  last_ledger_base_fee: '100',
  ledger_capacity_usage: '0.42',
  fee_charged: { p50: '100' },
  max_fee: { p50: '500' },
};

describe('estimateCreateAccountFee', () => {
  beforeEach(() => {
    clearFeeCache();
    vi.restoreAllMocks();
  });

  it('returns fee in XLM and fiat when a rate is provided', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => feeStatsJson,
      }),
    );

    const result = await estimateCreateAccountFee(0.1, 2);

    // 500 stroops/op × 2 ops = 1000 stroops = 0.0001000 XLM
    // 0.0001 XLM × $0.1/XLM = $0.00001
    expect(result.stroops).toBe(1000);
    expect(result.xlm).toBe('0.0001000');
    expect(result.fiat).toMatch(/\$0\.000010/);
  });

  it('returns null fiat when no rate is provided', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => feeStatsJson,
      }),
    );

    const result = await estimateCreateAccountFee(null, 2);

    expect(result.fiat).toBeNull();
  });

  it('respects the opCount parameter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => feeStatsJson,
      }),
    );

    const result1 = await estimateCreateAccountFee(null, 1);
    clearFeeCache();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => feeStatsJson,
      }),
    );
    const result2 = await estimateCreateAccountFee(null, 4);

    expect(result2.stroops).toBe(result1.stroops * 4);
  });

  it('throws when the Horizon request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    await expect(estimateCreateAccountFee()).rejects.toThrow('503');
  });

  it('caches fee stats and does not fetch again within cache window', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => feeStatsJson,
    });
    vi.stubGlobal('fetch', fetchMock);

    await estimateCreateAccountFee();
    await estimateCreateAccountFee();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns correct capacity usage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...feeStatsJson, ledger_capacity_usage: '0.85' }),
      }),
    );

    const result = await estimateCreateAccountFee();
    expect(result.capacityUsage).toBeCloseTo(0.85);
  });
});
