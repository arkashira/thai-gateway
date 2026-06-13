'use strict';

const { ProviderRouter, QUOTA_KEY_PREFIX, DEFAULT_TTL_SECONDS } = require('../services/router');

// In-memory Redis stub
function makeRedis(seed = {}) {
  const store = { ...seed };
  const ttls = {};
  return {
    async get(key) { return key in store ? String(store[key]) : null; },
    async set(key, val, _ex, ttl) { store[key] = val; ttls[key] = ttl; },
    async exists(key) { return key in store ? 1 : 0; },
    async decr(key) { store[key] = (store[key] || 0) - 1; return store[key]; },
    async ttl(key) { return ttls[key] || -2; },
    _store: store,
    _ttls: ttls,
  };
}

const PROVIDERS = [
  { name: 'openai', limit: 100 },
  { name: 'anthropic', limit: 50 },
];

describe('ProviderRouter – constructor', () => {
  test('throws when providers array is empty', () => {
    expect(() => new ProviderRouter([], makeRedis())).toThrow('providers must be a non-empty array');
  });

  test('defaults ttl to DEFAULT_TTL_SECONDS', () => {
    const router = new ProviderRouter(PROVIDERS, makeRedis());
    expect(router.ttl).toBe(DEFAULT_TTL_SECONDS);
  });

  test('accepts custom ttl option', () => {
    const router = new ProviderRouter(PROVIDERS, makeRedis(), { ttl: 120 });
    expect(router.ttl).toBe(120);
  });
});

describe('ProviderRouter – getRemaining', () => {
  test('returns full provider limit when no Redis key exists', async () => {
    const router = new ProviderRouter(PROVIDERS, makeRedis());
    expect(await router.getRemaining('openai')).toBe(100);
  });

  test('returns stored value when Redis key exists', async () => {
    const redis = makeRedis({ [`${QUOTA_KEY_PREFIX}openai`]: 42 });
    const router = new ProviderRouter(PROVIDERS, redis);
    expect(await router.getRemaining('openai')).toBe(42);
  });

  test('clamps negative stored value to 0', async () => {
    const redis = makeRedis({ [`${QUOTA_KEY_PREFIX}openai`]: -5 });
    const router = new ProviderRouter(PROVIDERS, redis);
    expect(await router.getRemaining('openai')).toBe(0);
  });

  test('returns 0 for unknown provider name', async () => {
    const router = new ProviderRouter(PROVIDERS, makeRedis());
    expect(await router.getRemaining('unknown-provider')).toBe(0);
  });
});

describe('ProviderRouter – consumeQuota', () => {
  test('initialises key at limit-1 with TTL on first consume', async () => {
    const redis = makeRedis();
    const router = new ProviderRouter(PROVIDERS, redis, { ttl: 30 });
    const result = await router.consumeQuota('openai');
    expect(result).toBe(99);
    expect(redis._store[`${QUOTA_KEY_PREFIX}openai`]).toBe(99);
    expect(redis._ttls[`${QUOTA_KEY_PREFIX}openai`]).toBe(30);
  });

  test('decrements existing key without resetting TTL', async () => {
    const key = `${QUOTA_KEY_PREFIX}openai`;
    const redis = makeRedis({ [key]: 10 });
    const router = new ProviderRouter(PROVIDERS, redis);
    const result = await router.consumeQuota('openai');
    expect(result).toBe(9);
  });
});

describe('ProviderRouter – selectProvider', () => {
  test('returns first provider when all have capacity', async () => {
    const router = new ProviderRouter(PROVIDERS, makeRedis());
    expect(await router.selectProvider()).toBe('openai');
  });

  test('skips exhausted first provider and returns second', async () => {
    const redis = makeRedis({ [`${QUOTA_KEY_PREFIX}openai`]: 0 });
    const router = new ProviderRouter(PROVIDERS, redis);
    expect(await router.selectProvider()).toBe('anthropic');
  });

  test('returns null when all providers are exhausted', async () => {
    const redis = makeRedis({
      [`${QUOTA_KEY_PREFIX}openai`]: 0,
      [`${QUOTA_KEY_PREFIX}anthropic`]: 0,
    });
    const router = new ProviderRouter(PROVIDERS, redis);
    expect(await router.selectProvider()).toBeNull();
  });
});

describe('ProviderRouter – retryAfterSeconds', () => {
  test('returns minimum TTL across providers', async () => {
    const redis = makeRedis();
    redis._ttls[`${QUOTA_KEY_PREFIX}openai`] = 45;
    redis._ttls[`${QUOTA_KEY_PREFIX}anthropic`] = 20;
    const router = new ProviderRouter(PROVIDERS, redis, { ttl: 60 });
    expect(await router.retryAfterSeconds()).toBe(20);
  });

  test('falls back to configured ttl when no keys have a positive TTL', async () => {
    const router = new ProviderRouter(PROVIDERS, makeRedis(), { ttl: 60 });
    expect(await router.retryAfterSeconds()).toBe(60);
  });
});
