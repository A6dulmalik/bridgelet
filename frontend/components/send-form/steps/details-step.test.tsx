import { describe, it, expect } from 'vitest';
import { validateDetails } from './details-step';
import type { SendFormState } from '../index';

// Issue #420 — amount validation on the send form's details step.

function baseState(overrides: Partial<SendFormState> = {}): SendFormState {
  return {
    publicKey: 'G' + 'A'.repeat(55),
    recipientName: '',
    recipientEmail: '',
    amountXlm: '10',
    assetCode: 'XLM',
    memo: '',
    expiresIn: 7 * 24 * 60 * 60,
    ...overrides,
  };
}

describe('validateDetails — amount', () => {
  it('accepts a plain positive amount', () => {
    expect(validateDetails(baseState({ amountXlm: '10' }))).toEqual({});
  });

  it('rejects an empty amount', () => {
    expect(validateDetails(baseState({ amountXlm: '' })).amountXlm).toMatch(/enter an amount/i);
  });

  it('rejects a zero or negative amount', () => {
    expect(validateDetails(baseState({ amountXlm: '0' })).amountXlm).toMatch(/greater than 0/i);
    expect(validateDetails(baseState({ amountXlm: '-5' })).amountXlm).toMatch(/greater than 0/i);
  });

  it('rejects an amount below the 1-stroop minimum', () => {
    expect(validateDetails(baseState({ amountXlm: '0.00000001' })).amountXlm).toMatch(
      /below the minimum/i,
    );
  });

  it('accepts an amount exactly at the 1-stroop minimum', () => {
    expect(validateDetails(baseState({ amountXlm: '0.0000001' })).amountXlm).toBeUndefined();
  });

  it('rejects an amount with more than 7 decimal places', () => {
    expect(validateDetails(baseState({ amountXlm: '1.123456789' })).amountXlm).toMatch(
      /more than 7 decimal places/i,
    );
  });

  it('accepts an amount with exactly 7 decimal places', () => {
    expect(validateDetails(baseState({ amountXlm: '1.1234567' })).amountXlm).toBeUndefined();
  });

  it('rejects a non-numeric amount', () => {
    expect(validateDetails(baseState({ amountXlm: 'abc' })).amountXlm).toMatch(/enter an amount/i);
  });
});

describe('validateDetails — other fields', () => {
  it('rejects a malformed recipient email but allows an empty one', () => {
    expect(validateDetails(baseState({ recipientEmail: 'not-an-email' })).recipientEmail).toMatch(
      /valid email/i,
    );
    expect(validateDetails(baseState({ recipientEmail: '' })).recipientEmail).toBeUndefined();
  });

  it('rejects an unsupported asset code', () => {
    expect(validateDetails(baseState({ assetCode: 'BTC' })).assetCode).toMatch(/select an asset/i);
  });
});
