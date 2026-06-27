// #108 – Stellar wallet address input with G... format validation
'use client';
import { useState } from 'react';

const STELLAR_ADDRESS = /^G[A-Z2-7]{55}$/;

type Props = { onValid: (address: string) => void };

export function WalletAddressInput({ onValid }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.trim();
    setValue(v);
    setError(null);
    if (v && STELLAR_ADDRESS.test(v)) onValid(v);
  }

  function handleBlur() {
    if (value && !STELLAR_ADDRESS.test(value)) {
      setError('Enter a valid Stellar address (starts with G, 56 characters).');
    }
  }

  return (
    <div className="space-y-1">
      <label htmlFor="wallet-address" className="block text-sm font-medium text-slate-700">
        Your Stellar wallet address
      </label>
      <input id="wallet-address" type="text" value={value} autoComplete="off"
        onChange={handleChange} onBlur={handleBlur}
        placeholder="G..."
        className="w-full rounded-lg border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-describedby={error ? 'wallet-error' : undefined}
      />
      {error && <p id="wallet-error" role="alert" className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-slate-500">
        Don&apos;t have a wallet?{' '}
        <a href="https://lobstr.co" target="_blank" rel="noopener noreferrer"
          className="underline hover:text-slate-800">Get Lobstr</a>
        {' or '}
        <a href="https://freighter.app" target="_blank" rel="noopener noreferrer"
          className="underline hover:text-slate-800">Freighter</a>.
      </p>
    </div>
  );
}
