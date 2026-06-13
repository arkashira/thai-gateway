'use strict';

const request = require('supertest');
const express = require('express');
const promClient = require('prom-client');

// Re-require fresh module per test suite by clearing the module cache
let prometheus;

beforeEach(() => {
  jest.resetModules();
  promClient.register.clear();
  prometheus = require('../metrics/prometheus');
});

function buildApp(provider) {
  const app = express();
  app.use((req, _res, next) => {
    if (provider) req.provider = provider;
    next();
  });
  app.use(prometheus.requestIdMiddleware);
  app.use(prometheus.metricsMiddleware);
  app.use(prometheus.router);
  app.get('/ok', (_req, res) => res.status(200).send('ok'));
  app.get('/fail', (_req, res) => res.status(500).send('boom'));
  return app;
}

describe('requestIdMiddleware', () => {
  test('generates X-Request-ID when header is absent', async () => {
    const res = await request(buildApp()).get('/ok');
    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  test('echoes X-Request-ID when caller supplies one', async () => {
    const id = 'my-trace-id-001';
    const res = await request(buildApp()).get('/ok').set('X-Request-ID', id);
    expect(res.headers['x-request-id']).toBe(id);
  });
});

describe('GET /metrics', () => {
  test('returns 200 with correct Content-Type', async () => {
    const res = await request(buildApp()).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain.*version=0\.0\.4/);
  });

  test('body contains default Go-style process metrics', async () => {
    const res = await request(buildApp()).get('/metrics');
    expect(res.text).toMatch(/process_cpu_seconds_total|nodejs_eventloop/);
  });
});

describe('metricsMiddleware – request counter', () => {
  test('increments thai_gateway_requests_total after a 200', async () => {
    const app = buildApp('openai');
    await request(app).get('/ok');
    const metric = await prometheus.register.getSingleMetricAsString(
      'thai_gateway_requests_total'
    );
    expect(metric).toMatch(/method="GET".*route="\/ok".*status="200".*provider="openai"/);
    expect(metric).toMatch(/} 1$/m);
  });

  test('labels unknown provider when req.provider is unset', async () => {
    const app = buildApp(null);
    await request(app).get('/ok');
    const metric = await prometheus.register.getSingleMetricAsString(
      'thai_gateway_requests_total'
    );
    expect(metric).toMatch(/provider="unknown"/);
  });
});

describe('metricsMiddleware – error counter', () => {
  test('increments thai_gateway_errors_total only on 5xx', async () => {
    const app = buildApp('anthropic');
    await request(app).get('/fail');
    const metric = await prometheus.register.getSingleMetricAsString(
      'thai_gateway_errors_total'
    );
    expect(metric).toMatch(/route="\/fail".*provider="anthropic"/);
    expect(metric).toMatch(/} 1$/m);
  });

  test('does NOT increment thai_gateway_errors_total on 200', async () => {
    const app = buildApp('anthropic');
    await request(app).get('/ok');
    const metric = await prometheus.register.getSingleMetricAsString(
      'thai_gateway_errors_total'
    );
    // Counter exists but value should still be 0 (no observations)
    expect(metric).not.toMatch(/} [^0]/m);
  });
});

describe('metricsMiddleware – response histogram', () => {
  test('records an observation in thai_gateway_response_duration_seconds', async () => {
    const app = buildApp();
    await request(app).get('/ok');
    const metric = await prometheus.register.getSingleMetricAsString(
      'thai_gateway_response_duration_seconds'
    );
    expect(metric).toMatch(/thai_gateway_response_duration_seconds_count/);
    expect(metric).toMatch(/} [1-9]/m);
  });
});

describe('metricsMiddleware – provider counter', () => {
  test('increments thai_gateway_provider_requests_total when provider is set', async () => {
    const app = buildApp('mistral');
    await request(app).get('/ok');
    const metric = await prometheus.register.getSingleMetricAsString(
      'thai_gateway_provider_requests_total'
    );
    expect(metric).toMatch(/provider="mistral"/);
    expect(metric).toMatch(/} 1$/m);
  });

  test('does NOT increment provider counter when provider is absent', async () => {
    const app = buildApp(null);
    await request(app).get('/ok');
    const metric = await prometheus.register.getSingleMetricAsString(
      'thai_gateway_provider_requests_total'
    );
    expect(metric).not.toMatch(/} [^0]/m);
  });
});

describe('updateCacheHitRatio', () => {
  test('sets thai_gateway_translation_cache_hit_ratio gauge', async () => {
    prometheus.updateCacheHitRatio(0.75);
    const metric = await prometheus.register.getSingleMetricAsString(
      'thai_gateway_translation_cache_hit_ratio'
    );
    expect(metric).toMatch(/0\.75/);
  });
});
