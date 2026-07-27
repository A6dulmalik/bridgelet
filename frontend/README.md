# Bridgelet Frontend

Reference Next.js UI for initiating and claiming crypto payments.

## Tech stack

- Next.js 16 (App Router)
- TypeScript 5 in strict mode
- Tailwind CSS 4

## Local setup

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` homepage placeholder
- `/send` sender flow placeholder
- `/claim/[token]` recipient claim placeholder

## Send flow

The send form (`components/send-form/`) is a three-step wizard: **Connect** → **Details** → **Confirm**.

The details step (`steps/details-step.tsx`) collects the payment details:

- **Recipient name** and **recipient email** — both optional; the email format is validated when provided.
- **Amount** — required, must be greater than 0.
- **Asset** — `XLM` or `USDC` (defaults to `XLM`).
- A live **XLM → USD conversion** is shown under the amount field, using the CoinGecko rate from `lib/xlm-price.ts` (cached for 60 seconds, hidden if the rate is unavailable).

Validation runs on submit and then re-runs on every change so errors clear as soon as the input becomes valid. Errors are announced to assistive technology via `role="alert"` and linked to their fields with `aria-describedby`/`aria-invalid`.

## Quality checks

- Type-check only:

  ```bash
  npm run typecheck
  ```

- Unit tests:

  ```bash
  npm test
  ```

- E2E tests (Playwright → `http://localhost:3000`):

  ```bash
  npx playwright install chromium   # one-time
  npm run test:e2e
  ```

- Production build:

  ```bash
  npm run build
  ```
