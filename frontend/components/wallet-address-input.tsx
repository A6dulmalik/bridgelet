'use client';

import { useState } from 'react';

type WalletAddressInputProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
};

/** Basic Stellar public key validator (G... 56 chars) */
function isValidStellarAddress(value: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(value);
}

export function WalletAddressInput({
  value,
  onChange,
  label = 'Stellar Wallet Address',
  placeholder = 'G…',
  error,
  disabled = false,
}: WalletAddressInputProps) {
  const [touched, setTouched] = useState(false);

  const validationError =
    touched && value.length > 0 && !isValidStellarAddress(value)
      ? 'Enter a valid Stellar public key (starts with G, 56 characters).'
      : null;

  const displayError = error ?? validationError;
  const inputId = 'wallet-address-input';

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!displayError}
        aria-describedby={displayError ? `${inputId}-error` : undefined}
        className={`w-full rounded-lg border px-3 py-2 font-mono text-sm text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-2 disabled:opacity-50 ${
          displayError
            ? 'border-red-400 focus:ring-red-300'
            : 'border-slate-300 focus:ring-slate-400'
        }`}
      />
      {displayError && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">
          {displayError}
        </p>
      )}
    </div>
  );
}
