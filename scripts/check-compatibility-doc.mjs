#!/usr/bin/env node
/**
 * Blocks `release-it` from tagging a release until docs/compatibility.md
 * and compatibility.json have been updated for the version being released.
 *
 * Wired up as release-it's `hooks.before:git:release` in .release-it.json.
 * See docs/compatibility.md#updating-the-matrix for the process this
 * enforces.
 *
 * Checks:
 *   1. compatibility.json's `frontend.version` matches the version about
 *      to be tagged (release-it bumps package.json before this hook runs).
 *   2. docs/compatibility.md's matrix table has a row for that version.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  console.error('See docs/compatibility.md#updating-the-matrix — update compatibility.json');
  console.error('and add a matrix row in docs/compatibility.md before tagging this release.\n');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));
const releaseVersion = pkg.version;

if (!releaseVersion) {
  fail('package.json has no "version" field — cannot check compatibility docs against it.');
}

const compat = JSON.parse(readFileSync(resolve(repoRoot, 'compatibility.json'), 'utf8'));

if (compat.frontend?.version !== releaseVersion) {
  fail(
    `compatibility.json's frontend.version ("${compat.frontend?.version}") does not match ` +
      `the version being released ("${releaseVersion}").`,
  );
}

if (compat.status !== 'verified') {
  fail(
    `compatibility.json's status is "${compat.status}", not "verified". ` +
      `.github/workflows/compatibility.yml must have a passing run against the pinned ` +
      `bridgelet-sdk/bridgelet-core commits before this version can be tagged.`,
  );
}

const doc = readFileSync(resolve(repoRoot, 'docs/compatibility.md'), 'utf8');

if (!doc.includes(releaseVersion)) {
  fail(
    `docs/compatibility.md does not mention version "${releaseVersion}" — add a matrix row ` +
      `for this release before tagging.`,
  );
}

console.log(`✓ docs/compatibility.md and compatibility.json are up to date for v${releaseVersion}.`);
