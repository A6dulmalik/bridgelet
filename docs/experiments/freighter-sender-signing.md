# Experiment: Freighter Sender Signing for Account Creation

## Goal

Evaluate a client-side sender-signing path where the browser asks Freighter to sign an unsigned account-creation transaction XDR, instead of relying only on backend signing keys.

## Implemented Flow

1. Sender connects Freighter in the send flow.
2. On Confirm, frontend attempts `POST /api/accounts/prepare` with the account payload.
3. If `unsignedTxXdr` is returned, frontend signs via Freighter `signTransaction`.
4. Frontend submits `POST /api/accounts` with:
   - the original account-creation payload
   - `signedTxXdr`
   - `signerAddress`
   - `networkPassphrase`
   - `signingMode: "freighter-client"`
5. If prepare/sign is unavailable, frontend falls back to existing backend signing path.

## Why Fallback Exists

This is intentionally experimental. Some environments may not yet implement the `prepare` endpoint or may not expose transaction signing capabilities. Fallback keeps the sender flow operational while the experiment rolls out.

## Security Tradeoffs

Pros:
- Reduces backend custody over sender signing for account creation.
- Sender private key remains in wallet extension; browser receives only signed XDR.
- Improves non-custodial posture for funding authorization.

Cons / Risks:
- Browser-side signing adds wallet/API dependency and extension UX failure modes.
- Unsigned XDR still originates from backend; integrity checks are required server-side.
- Fallback path can hide rollout gaps unless monitored.

## Validation Checklist

- Frontend typecheck passes.
- Frontend tests pass, including wallet signing helper tests.
- Manual send flow test:
  - Freighter installed path attempts prepare/sign/submit.
  - Missing-prepare path falls back and still returns claim URL.
