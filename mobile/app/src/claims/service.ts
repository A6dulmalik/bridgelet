import {
  ClaimTokenError,
  ClaimTokenPayload,
  decodeClaimTokenPayload,
  validateClaimToken,
} from "./token";

export type ClaimLookupResult = {
  accountId: string;
  amount: string;
  asset: string;
  expiresAt?: string;
};

const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const fromPayload = (payload: ClaimTokenPayload): ClaimLookupResult => {
  return {
    accountId: payload.accountId ?? "unknown-account",
    amount: payload.amount ?? "0",
    asset: payload.asset ?? "XLM:native",
    expiresAt: payload.expiresAt,
  };
};

export const lookupClaimByToken = async (
  token: string,
): Promise<ClaimLookupResult> => {
  validateClaimToken(token);

  // Simulate network verification while backend endpoint is being integrated.
  await wait(900);

  try {
    const payload = decodeClaimTokenPayload(token);
    return fromPayload(payload);
  } catch {
    throw new ClaimTokenError(
      "INVALID_TOKEN_FORMAT",
      "Invalid claim link format.",
    );
  }
};
