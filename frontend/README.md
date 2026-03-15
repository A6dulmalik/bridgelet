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

## Quality checks

- Type-check only:

  ```bash
  npm run typecheck
  ```

- Production build:

  ```bash
  npm run build
  ```
