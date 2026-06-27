// #121 – Claim link shortener utility for SMS-friendly URLs
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function encodeShortToken(token: string): string {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
  }
  let result = '';
  let n = hash || 1;
  while (n > 0) {
    result = (BASE62[n % 62] ?? '0') + result;
    n = Math.floor(n / 62);
  }
  return result.slice(0, 8).padStart(6, '0');
}

export function buildShortClaimUrl(appUrl: string, token: string): string {
  return `${appUrl}/c/${encodeShortToken(token)}`;
}
