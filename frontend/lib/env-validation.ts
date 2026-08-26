/**
 * Issue #454 — Environment and config validation on app boot.
 *
 * Validates all required NEXT_PUBLIC_* environment variables at startup
 * and logs warnings for missing or misconfigured values.  Runs once
 * during module initialization so failures are caught before the app
 * renders any UI.
 */

type EnvSchema = {
  name: string;
  required: boolean;
  pattern?: RegExp;
  defaultValue?: string;
  description: string;
};

const ENV_SCHEMA: EnvSchema[] = [
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    pattern: /^https?:\/\/.+/,
    description: 'Base URL of the application (e.g. https://bridgelet.org)',
  },
  {
    name: 'NEXT_PUBLIC_API_BASE_URL',
    required: true,
    pattern: /^https?:\/\/.+/,
    description: 'Base URL of the bridgelet-sdk backend API',
  },
  {
    name: 'NEXT_PUBLIC_CRYPTO_NETWORK',
    required: true,
    pattern: /^(pubnet|testnet|standalone)$/,
    description: 'Stellar network to connect to (pubnet, testnet, standalone)',
  },
  {
    name: 'NEXT_PUBLIC_SUPPORT_EMAIL',
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    defaultValue: 'support@bridgelet.org',
    description: 'Support email address shown in the UI',
  },
];

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all environment variables against the schema.
 * Returns a result object with any errors or warnings.
 */
export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const schema of ENV_SCHEMA) {
    const value = process.env[schema.name];

    if (!value || value.trim().length === 0) {
      if (schema.required) {
        errors.push(
          `Missing required env var: ${schema.name} — ${schema.description}`,
        );
      } else if (schema.defaultValue) {
        warnings.push(
          `Optional env var ${schema.name} not set, using default: ${schema.defaultValue}`,
        );
      }
      continue;
    }

    if (schema.pattern && !schema.pattern.test(value)) {
      errors.push(
        `Invalid value for ${schema.name}: "${value}" — ${schema.description}`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Run validation on module load and log results.
 * In production, missing required vars will throw to prevent the app
 * from starting in a broken state.
 */
let _ran = false;

export function runEnvValidation(): void {
  if (_ran) return;
  _ran = true;

  const result = validateEnv();

  for (const warn of result.warnings) {
    console.warn(`[env-config] ${warn}`);
  }

  if (!result.valid) {
    const msg = `[env-config] Environment validation failed:\n${result.errors.join('\n')}`;

    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    } else {
      console.error(msg);
    }
  }
}
