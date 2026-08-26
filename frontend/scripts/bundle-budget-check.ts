#!/usr/bin/env tsx
/**
 * scripts/bundle-budget-check.ts
 *
 * Issue #473: Bundle size budget enforcement.
 *
 * Reads the Next.js build manifest (.next/build-manifest.json and
 * .next/app-build-manifest.json) and measures the first-load JS per route
 * against defined budgets. Exits non-zero on violations so CI fails the build.
 *
 * Budgets (gzip-compressed estimate — actual JS is ~2.5× raw):
 *   /send                — 200 kB  (critical payment path)
 *   /claim/[token]       — 200 kB  (critical claim path)
 *   /                    — 250 kB
 *   all other routes     — 300 kB
 *
 * Usage:
 *   npx tsx scripts/bundle-budget-check.ts
 *   npx tsx scripts/bundle-budget-check.ts --json   (outputs JSON for CI comments)
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { resolve, join } from 'path';

const ROOT = resolve(__dirname, '..');
const NEXT_DIR = join(ROOT, '.next');
const ARGS = process.argv.slice(2);
const JSON_OUTPUT = ARGS.includes('--json');

// ─── Budget definitions ───────────────────────────────────────────────────────
// Values in bytes (uncompressed). Gzip is typically ~40% of raw size.
// We set budgets at ~2.5× the gzip target.

const ROUTE_BUDGETS: Record<string, number> = {
  '/send':           200 * 1024,   // 200 kB — critical path
  '/claim/[token]':  200 * 1024,   // 200 kB — critical path
  '/':               250 * 1024,   // 250 kB — homepage
  '__DEFAULT__':     300 * 1024,   // 300 kB — all other routes
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface BudgetResult {
  route: string;
  sizeBytes: number;
  budgetBytes: number;
  passed: boolean;
  overageBytes: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function fileSize(path: string): number {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return null;
  }
}

// ─── Build manifest parsing ───────────────────────────────────────────────────

interface BuildManifest {
  pages?: Record<string, string[]>;
}

interface AppBuildManifest {
  pages?: Record<string, string[]>;
}

function collectRouteChunks(): Map<string, string[]> {
  const result = new Map<string, string[]>();

  // Pages router
  const buildManifest = readJson<BuildManifest>(join(NEXT_DIR, 'build-manifest.json'));
  if (buildManifest?.pages) {
    for (const [route, chunks] of Object.entries(buildManifest.pages)) {
      result.set(route, chunks);
    }
  }

  // App router
  const appManifest = readJson<AppBuildManifest>(join(NEXT_DIR, 'app-build-manifest.json'));
  if (appManifest?.pages) {
    for (const [route, chunks] of Object.entries(appManifest.pages)) {
      // Normalise app router routes: strip trailing /page
      const normalized = route.replace(/\/page$/, '') || '/';
      const existing = result.get(normalized) ?? [];
      result.set(normalized, [...new Set([...existing, ...chunks])]);
    }
  }

  return result;
}

function measureRoute(chunks: string[]): number {
  return chunks.reduce((total, chunk) => {
    const path = join(NEXT_DIR, chunk.startsWith('/') ? chunk.slice(1) : chunk);
    return total + fileSize(path);
  }, 0);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function getBudget(route: string): number {
  return ROUTE_BUDGETS[route] ?? ROUTE_BUDGETS['__DEFAULT__']!;
}

function main(): void {
  if (!existsSync(NEXT_DIR)) {
    console.error('❌  .next/ directory not found. Run `next build` first.');
    process.exit(1);
  }

  const routeChunks = collectRouteChunks();
  if (routeChunks.size === 0) {
    console.error('❌  No routes found in build manifest. Was the build successful?');
    process.exit(1);
  }

  const results: BudgetResult[] = [];

  for (const [route, chunks] of routeChunks) {
    const sizeBytes = measureRoute(chunks);
    const budgetBytes = getBudget(route);
    const passed = sizeBytes <= budgetBytes;
    results.push({
      route,
      sizeBytes,
      budgetBytes,
      passed,
      overageBytes: Math.max(0, sizeBytes - budgetBytes),
    });
  }

  if (JSON_OUTPUT) {
    console.log(JSON.stringify(results, null, 2));
    const anyFailed = results.some((r) => !r.passed);
    process.exit(anyFailed ? 1 : 0);
    return;
  }

  // ── Human-readable table ──────────────────────────────────────────────────

  console.log('\n📦  Bundle Size Budget Report\n');
  console.log(
    '  Route'.padEnd(35) +
    'Size'.padStart(10) +
    'Budget'.padStart(10) +
    'Status'.padStart(10),
  );
  console.log('  ' + '─'.repeat(63));

  let anyFailed = false;
  for (const r of results.sort((a, b) => b.sizeBytes - a.sizeBytes)) {
    const status = r.passed ? '✅ OK' : `❌ +${formatBytes(r.overageBytes)}`;
    if (!r.passed) anyFailed = true;
    console.log(
      `  ${r.route.padEnd(33)}` +
      formatBytes(r.sizeBytes).padStart(10) +
      formatBytes(r.budgetBytes).padStart(10) +
      status.padStart(14),
    );
  }

  console.log('');

  if (anyFailed) {
    console.error(
      '❌  Bundle budget exceeded on one or more routes.\n' +
      '    Review the output above and reduce first-load JS.\n' +
      '    Tips: code-split heavy dependencies, defer non-critical imports,\n' +
      '    move Stellar SDK usage server-side where possible.\n',
    );
    process.exit(1);
  } else {
    console.log('✅  All routes are within budget.\n');
    process.exit(0);
  }
}

main();
