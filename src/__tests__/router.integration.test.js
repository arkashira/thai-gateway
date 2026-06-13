'use strict';

const request = require('supertest');
const express = require('express');
const { ProviderRouter } = require('../services/router');

// In-memory Redis stub (same as unit test)
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
  { name: 'openai', limit: 10 },
  { name: 'anthropic', limit: 5 },
];

function buildApp(providerRouter) {
  const app = express();
  app.use(providerRouter.middleware());
  app.post('/translate', (req, res) => {
    res.status(200).json({ provider: req.provider, translated: 'สวัสดี' });
  });
  return app;
}

// --- Happy path ---

describe('integration – request routed within quota', () => {
  test('first request uses primary provider and returns 200', async () => {
    const redis = makeRedis();
    const app = buildApp(new ProviderRouter(PROVIDERS, redis, { ttl: 60 }));
    const res = await request(app).post('/translate');
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('openai');
  });

  test('req.provider is set to chosen provider name', async () => {
    const redis = makeRedis();
    const app = buildApp(new ProviderRouter(PROVIDERS, redis, { ttl: 60 }));
    const res = await request(app).post('/translate');
    expect(res.body.provider).toBeDefined();
    expect(PROVIDERS.map((p) => p.name)).toContain(res.body.provider);
  });

  test('quota counter decrements after each successful request', async () => {
    const redis = makeRedis();
    const router = new ProviderRouter(PROVIDERS, redis, { ttl: 60 });
    const app = buildApp(router);
    await request(app).post('/translate');
    await request(app).post('/translate');
    const remaining = await router.getRemaining('openai');
    expect(remaining).toBe(8); // 10 - 2
  });

  test('switches to secondary provider when primary is exhausted', async () => {
    const redis = makeRedis({ 'provider:quota:openai': 0 });
    const app = buildApp(new ProviderRouter(PROVIDERS, redis, { ttl: 60 }));
    const res = await request(app).post('/translate');
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('anthropic');
  });

  test('multiple sequential requests all succeed while quota remains', async () => {
    const redis = makeRedis();
    const app = buildApp(new ProviderRouter([{ name: 'openai', limit: 5 }], redis, { ttl: 60 }));
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/translate');
      expect(res.status).toBe(200);
    }
  });
});

// --- 429 / all-exhausted ---

describe('integration – all providers exhausted', () => {
  test('returns 429 when every provider is at zero', async () => {
    const redis = makeRedis({
      'provider:quota:openai': 0,
      'provider:quota:anthropic': 0,
    });
    const app = buildApp(new ProviderRouter(PROVIDERS, redis, { ttl: 60 }));
    const res = await request(app).post('/translate');
    expect(res.status).toBe(429);
  });

  test('429 response includes Retry-After header', async () => {
    const redis = makeRedis({
      'provider:quota:openai': 0,
      'provider:quota:anthropic': 0,
    });
    redis._ttls['provider:quota:openai'] = 35;
    redis._ttls['provider:quota:anthropic'] = 20;
    const app = buildApp(new ProviderRouter(PROVIDERS, redis, { ttl: 60 }));
    const res = await request(app).post('/translate');
    expect(res.headers['retry-after']).toBe('20');
  });

  test('429 response body contains error and retryAfter fields', async () => {
    const redis = makeRedis({
      'provider:quota:openai': 0,
      'provider:quota:anthropic': 0,
    });
    const app = buildApp(new ProviderRouter(PROVIDERS, redis, { ttl: 60 }));
    const res = await request(app).post('/translate');
    expect(res.body.error).toBeDefined();
    expect(typeof res.body.retryAfter).toBe('number');
    expect(res.body.retryAfter).toBeGreaterThan(0);
  });
});

// --- Edge cases ---

describe('integration – edge cases', () => {
  test('last quota unit consumed triggers provider switch on next request', async () => {
    const redis = makeRedis({ 'provider:quota:openai': 1 });
    const router = new ProviderRouter(PROVIDERS, redis, { ttl: 60 });
    const app = buildApp(router);
    // First request exhausts openai
    const first = await request(app).post('/translate');
    expect(first.body.provider).toBe('openai');
    // Second request should fall through to anthropic
    const second = await request(app).post('/translate');
    expect(second.body.provider).toBe('anthropic');
  });

  test('single-provider config returns 429 immediately when that provider is exhausted', async () => {
    const redis = makeRedis({ 'provider:quota:openai': 0 });
    const app = buildApp(new ProviderRouter([{ name: 'openai', limit: 5 }], redis, { ttl: 60 }));
    const res = await request(app).post('/translate');
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
  });

  test('stored quota value of -1 (over-decrement) is treated as exhausted', async () => {
    const redis = makeRedis({ 'provider:quota:openai': -1, 'provider:quota:anthropic': 0 });
    const app = buildApp(new ProviderRouter(PROVIDERS, redis, { ttl: 60 }));
    const res = await request(app).post('/translate');
    expect(res.status).toBe(429);
  });
});
