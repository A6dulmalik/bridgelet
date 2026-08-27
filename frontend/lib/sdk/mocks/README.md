# Mock SDK server (`frontend/lib/sdk/mocks/`)

Local dev and CI default to this mock instead of a live bridgelet-sdk /
Stellar testnet instance. It's started automatically by
`frontend/instrumentation.ts` whenever the Next.js server process boots,
unless `E2E_USE_MOCKS=false` is set in the environment.

## What it covers

Exactly the endpoints in `scripts/check-sdk-contract.mjs`'s `CONTRACT`
array — that script is the single source of truth for which endpoints and
fields the frontend depends on:

- `POST /accounts` — create an ephemeral account
- `GET /accounts/:id` — check status
- `POST /claims/verify` — verify a claim token
- `POST /claims/redeem` — trigger the sweep

State lives in an in-memory `Map` (`./handlers.ts`) for the lifetime of the
process — good enough for one dev session or one CI job, not persisted
across restarts, and not shared across parallel workers.

## How this differs from `frontend/mocks/`

`frontend/mocks/` (`msw/browser`) intercepts requests made **from the
browser** — it's what `DevToolbar` and manual local browsing use. It does
NOT intercept the server-side `fetch()` calls inside
`app/api/accounts/*.ts` Route Handlers, because those run in Node, not the
browser, and the browser-side worker never sees them.

This directory (`msw/node`) intercepts requests made **by the Next.js
server process itself** — exactly those Route Handler calls, plus any
other server-side code that calls `BRIDGELET_SDK_URL` directly. The two
are complementary: a full local dev session with DevToolbar open uses
both at once.

`e2e/` tests use neither of these directly for browser-originated
requests — Playwright's own `page.route()` interceptors in
`e2e/fixtures/bridgelet.ts` take priority at the browser-context level.
This mock still matters there wherever a spec lets a request pass through
to a real Route Handler instead of stubbing it at the fixture level.

## Why `E2E_USE_MOCKS` and not a new env var

`.github/workflows/compatibility.yml` boots a **real** bridgelet-sdk and
sets `E2E_USE_MOCKS: 'false'` for its integration step — but that step
still runs `next dev` (same `webServer` command as every other Playwright
run, from `e2e/playwright.config.ts`), which would trigger this mock's
startup hook too. Reusing `E2E_USE_MOCKS` — the toggle this repo already
sets to `'false'` in exactly that job — means this mock automatically
gets out of the way of the real backend `compatibility.yml` deliberately
provisions, with no changes needed to that workflow. `e2e.yml` and plain
local `npm run dev` never set it to `'false'`, so the mock stays on by
default everywhere else.

## Keeping mock responses in sync with the real contract

`scripts/check-sdk-contract.mjs` already asserts, against a **live**
bridgelet-sdk, that the endpoints/fields this frontend depends on still
exist. Point that same script at this mock's own `GET /api/docs-json`
handler to self-check that the mock hasn't drifted from what the script
declares:

```bash
# 1. Start the app — instrumentation.ts starts the mock automatically
npm run dev --prefix frontend

# 2. In another terminal, run the contract check against the mock's own
#    /api/docs-json handler instead of a real backend
BRIDGELET_API_URL=http://localhost:3000 node scripts/check-sdk-contract.mjs
```

When `compatibility.json`'s pinned bridgelet-sdk commit changes (see
`docs/compatibility.md`), update in this order:

1. Run `check-sdk-contract.mjs` against the **real**, newly-pinned
   bridgelet-sdk (`BRIDGELET_API_URL=http://localhost:4000`, with a real
   instance running) and read what it reports as changed.
2. Update `frontend/lib/bridgelet.ts` / `frontend/lib/create-bridgelet-client.ts`
   types to match.
3. Update `./handlers.ts` in this directory to match — both the response
   bodies AND the `/api/docs-json` stub's `properties` lists. They're
   independent of each other; the stub doesn't introspect the TypeScript
   types, so both need editing by hand.
4. Re-run `check-sdk-contract.mjs` against the mock (step above) to
   confirm step 3 is actually complete.

## Known limitation (inherited from `check-sdk-contract.mjs`)

Like the script it mirrors, this mock checks/mocks **endpoint existence
and top-level field presence only** — not field types or enum values. In
particular, `AccountResponse.status` here uses the frontend client's
existing `'pending' | 'claimed' | 'expired'` type
(`frontend/lib/bridgelet.ts`), not bridgelet-sdk's actual, wider enum
(`pending_payment` / `pending_claim` / `claimed` / `expired` / `failed` —
see the comment at the top of `check-sdk-contract.mjs`, and
`frontend/mocks/handlers/accounts.ts`, which already uses the wider,
correct enum from `@/lib/api/types`). This mock intentionally matches
what the **client code currently expects** rather than silently "fixing"
that drift — flagging it here so it isn't mistaken for a bug this mock
introduced.

## Opting out (point at a real environment)

```bash
E2E_USE_MOCKS=false BRIDGELET_SDK_URL=http://localhost:4000 npm run dev --prefix frontend
```

With a real bridgelet-sdk instance running at that URL, server-side calls
will hit it for real instead of being intercepted.