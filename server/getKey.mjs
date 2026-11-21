import { env } from 'node:process';

let cached;
let pending;

async function lookupKey(previousKey, rejectedKey) {
  const { KEYGEN_URL: baseUrl, KEYGEN_TOKEN: token } = env;
  if (!baseUrl || !token || baseUrl === 'paste-here' || token === 'paste-here') {
    throw new Error('Set KEYGEN_URL and KEYGEN_TOKEN in .env.');
  }

  let response;
  try {
    const url = new URL(`${baseUrl.replace(/\/+$/, '')}/api/lookup-key`);
    response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error('Could not reach MindDo to get an AI key.');
  }

  const result = await response.json().catch(() => null);
  if (!response.ok || result?.error) {
    const redact = (value, fallback) => {
      if (typeof value !== 'string' || !value) return fallback;
      for (const secret of [token, previousKey, rejectedKey, result?.apiKey]) {
        if (typeof secret === 'string' && secret) {
          value = value.replaceAll(secret, '[redacted]');
        }
      }
      return value;
    };
    const fix = redact(result?.error?.fix, '');
    if (fix) console.error('MindDo lookup fix:', fix);
    throw new Error(redact(result?.error?.message, 'MindDo could not provide an AI key.'));
  }

  const { apiKey, expiresAt } = result ?? {};
  const expiry = typeof expiresAt === 'number' ? expiresAt : Date.parse(expiresAt);
  if (typeof apiKey !== 'string' || !apiKey.trim() || !Number.isFinite(expiry) ||
      expiry <= Date.now()) {
    throw new Error('MindDo returned an invalid or expired AI key.');
  }
  cached = { apiKey, expiry };
  return apiKey;
}

export async function getKey({ invalidKey } = {}) {
  const previousKey = cached?.apiKey;
  if (cached && (cached.apiKey === invalidKey || cached.expiry <= Date.now())) {
    cached = undefined;
  }
  if (cached) return cached.apiKey;
  pending ??= lookupKey(previousKey, invalidKey).finally(() => {
    pending = undefined;
  });
  return pending;
}
