#!/usr/bin/env node
/**
 * Cross-repo compatibility check: verifies that a running bridgelet-sdk
 * instance still exposes the endpoints, request fields, and response
 * fields that this frontend's hand-written API client depends on
 * (frontend/lib/create-bridgelet-client.ts, frontend/lib/bridgelet.ts).
 *
 * This intentionally does NOT diff frontend/lib/bridgelet.ts against
 * generated output — that file predates/diverged from
 * frontend/scripts/generate-types.mjs's openapi-typescript output shape,
 * so a full-file diff would always show a rewrite regardless of real
 * compatibility. Field-name presence in the live OpenAPI spec is the
 * signal that actually catches "frontend assumes a response shape or
 * endpoint a different SDK version doesn't provide" (the failure mode
 * from bridgelet issue #395) without false positives.
 *
 * Scope: endpoint existence + top-level request/response field-name
 * presence. It does NOT check field types or enum values — e.g. it would
 * not catch the SDK's AccountStatus enum (pending_payment/pending_claim/
 * claimed/expired/failed) differing from the frontend's AccountStatus
 * type (pending/claimed/expired). That's a real, pre-existing drift this
 * script does not cover; see docs/compatibility.md.
 *
 * Usage:
 *   BRIDGELET_API_URL=http://localhost:4000 node scripts/check-sdk-contract.mjs
 */

const apiUrl = process.env.BRIDGELET_API_URL ?? 'http://localhost:4000';
const specUrl = `${apiUrl}/api/docs-json`;

/** @type {{method: string, path: string, requestFields?: string[], responseStatus: string, responseFields?: string[]}[]} */
const CONTRACT = [
  {
    method: 'post',
    path: '/accounts',
    requestFields: ['fundingSource', 'recovery_address', 'amount', 'expiresIn'],
    responseStatus: '201',
    responseFields: [
      'accountId',
      'publicKey',
      'claimUrl',
      'amount',
      'asset',
      'status',
      'expiresAt',
      'createdAt',
    ],
  },
  {
    method: 'get',
    path: '/accounts/{id}',
    responseStatus: '200',
    responseFields: ['accountId', 'publicKey', 'claimUrl', 'amount', 'asset', 'status', 'expiresAt'],
  },
  {
    method: 'post',
    path: '/claims/verify',
    requestFields: ['claimToken'],
    responseStatus: '200',
  },
  {
    method: 'post',
    path: '/claims/redeem',
    requestFields: ['claimToken', 'destinationAddress'],
    responseStatus: '200',
    responseFields: ['success', 'amountSwept', 'asset', 'destination'],
  },
];

function resolveSchema(spec, schema) {
  if (!schema) return undefined;
  if (schema.$ref) {
    const name = schema.$ref.replace('#/components/schemas/', '');
    return resolveSchema(spec, spec.components?.schemas?.[name]);
  }
  if (Array.isArray(schema.allOf)) {
    const properties = {};
    for (const part of schema.allOf) {
      Object.assign(properties, resolveSchema(spec, part)?.properties ?? {});
    }
    return { ...schema, properties };
  }
  return schema;
}

function fieldNames(spec, schema) {
  return Object.keys(resolveSchema(spec, schema)?.properties ?? {});
}

async function main() {
  console.log(`Fetching OpenAPI spec from: ${specUrl}`);
  const res = await fetch(specUrl);
  if (!res.ok) {
    console.error(`::error::Could not fetch OpenAPI spec: HTTP ${res.status}`);
    process.exit(1);
  }
  const spec = await res.json();

  const errors = [];

  for (const check of CONTRACT) {
    const label = `${check.method.toUpperCase()} ${check.path}`;
    const operation = spec.paths?.[check.path]?.[check.method];

    if (!operation) {
      errors.push(`${label}: endpoint not found in the SDK's OpenAPI spec.`);
      continue;
    }

    if (check.requestFields) {
      const bodySchema = operation.requestBody?.content?.['application/json']?.schema;
      const actual = fieldNames(spec, bodySchema);
      const missing = check.requestFields.filter((f) => !actual.includes(f));
      if (missing.length > 0) {
        errors.push(
          `${label}: request body is missing field(s) the frontend sends: ${missing.join(', ')} ` +
            `(spec has: ${actual.join(', ') || '(none)'}).`,
        );
      }
    }

    if (check.responseFields) {
      const responseSchema =
        operation.responses?.[check.responseStatus]?.content?.['application/json']?.schema;
      const actual = fieldNames(spec, responseSchema);
      const missing = check.responseFields.filter((f) => !actual.includes(f));
      if (missing.length > 0) {
        errors.push(
          `${label} -> ${check.responseStatus}: response is missing field(s) the frontend reads: ` +
            `${missing.join(', ')} (spec has: ${actual.join(', ') || '(none)'}).`,
        );
      }
    }

    console.log(`  ✓ ${label}`);
  }

  if (errors.length > 0) {
    console.error('\nCross-repo contract check failed:\n');
    for (const err of errors) console.error(`::error::${err}`);
    console.error(
      '\nThis bridgelet-sdk commit no longer matches what frontend/lib/create-bridgelet-client.ts ' +
        'and frontend/lib/bridgelet.ts expect. Update the frontend to match, or point ' +
        'compatibility.json at a different bridgelet-sdk commit.',
    );
    process.exit(1);
  }

  console.log('\nAll checked endpoints and fields are present.');
}

main().catch((err) => {
  console.error('::error::check-sdk-contract.mjs failed:', err);
  process.exit(1);
});
