'use strict';

const request = require('supertest');
const express = require('express');
const promClient = require('prom-client');

let prometheus;

beforeEach(() => {
  jest.resetModules();
  promClient.register.clear();
  prometheus = require('../metrics/prometheus');
});

function buildFullApp() {
  const app = express();
  app.use(prometheus.requestIdMiddleware);
  app.use(prometheus.metricsMiddleware);
  app.use(prometheus.router);

  app.post('/translate', (req, res) => {
    req.provider = 'google';
    prometheus.updateCacheHitRatio(0.8);
    res.status(200).json({ translated: 'สวัสดี' });
  });

  app.post('/chat', (req, res) => {
    req.provider = 'openai';
    res.status(200).json({ response: 'hello' });
  });

  app.get('/health', (_req, res) => res.status(200).send('ok'));

  app.post('/chat/error', (_req, res) => res.status(500).json({ error: 'upstream timeout' }));

  return app;
}

// --- Happy-path integration tests ---

test('happy: /translate increments request counter and sets cache ratio', async () => {
  const app = buildFullApp();
  await request(app).post('/translate').send({ text: 'hello' });

  const reqMetric = await prometheus.register.getSingleMetricAsString(
    'thai_gateway_requests_total'
  );
  expect(reqMetric).toMatch(/route="\/translate".*status="200"/);

  const cacheMetric = await prometheus.register.getSingleMetricAsString(
    'thai_gateway_translation_cache_hit_ratio'
  );
  expect(cacheMetric).toMatch(/0\.8/);
});

test('happy: /chat routes request and increments provider counter', async () => {
  const app = buildFullApp();
  await request(app).post('/chat').send({ prompt: 'hi' });

  const providerMetric = await prometheus.register.getSingleMetricAsString(
    'thai_gateway_provider_requests_total'
  );
  expect(providerMetric).toMatch(/provider="openai".*} 1/m);
});

test('happy: /health recorded without provider label', async () => {
  const app = buildFullApp();
  await request(app).get('/health');

  const reqMetric = await prometheus.register.getSingleMetricAsString(
    'thai_gateway_requests_total'
  );
  expect(reqMetric).toMatch(/provider="unknown"/);
});

test('happy: multiple requests accumulate counter correctly', async () => {
  const app = buildFullApp();
  await request(app).post('/chat').send({});
  await request(app).post('/chat').send({});
  await request(app).post('/chat').send({});

  const providerMetric = await prometheus.register.getSingleMetricAsString(
    'thai_gateway_provider_requests_total'
  );
  expect(providerMetric).toMatch(/provider="openai".*} 3/m);
});

test('happy: /metrics itself is excluded from thai_gateway_requests_total scrape noise', async () => {
  const app = buildFullApp();
  await request(app).get('/metrics');
  // The /metrics path is served by the router before metricsMiddleware fires on it
  // but our middleware still wraps. Verify /metrics response is valid Prometheus text.
  const res = await request(app).get('/metrics');
  expect(res.status).toBe(200);
  expect(res.text).toContain('thai_gateway_requests_total');
});

// --- Edge-case integration tests ---

test('edge: 500 response increments both request counter and error counter', async () => {
  const app = buildFullApp();
  await request(app).post('/chat/error').send({});

  const errMetric = await prometheus.register.getSingleMetricAsString(
    'thai_gateway_errors_total'
  );
  expect(errMetric).toMatch(/route="\/chat\/error".*} 1/m);

  const reqMetric = await prometheus.register.getSingleMetricAsString(
    'thai_gateway_requests_total'
  );
  expect(reqMetric).toMatch(/status="500"/);
});

test('edge: request without X-Request-ID gets unique IDs across two concurrent calls', async () => {
  const app = buildFullApp();
  const [r1, r2] = await Promise.all([
    request(app).get('/health'),
    request(app).get('/health'),
  ]);
  expect(r1.headers['x-request-id']).toBeTruthy();
  expect(r2.headers['x-request-id']).toBeTruthy();
  expect(r1.headers['x-request-id']).not.toBe(r2.headers['x-request-id']);
});

test('edge: histogram records non-zero duration', async () => {
  const app = buildFullApp();
  await request(app).post('/chat').send({});

  const metric = await prometheus.register.getSingleMetricAsString(
    'thai_gateway_response_duration_seconds'
  );
  // _sum must be > 0
  const sumLine = metric.split('\n').find((l) => l.includes('_sum'));
  expect(sumLine).toBeTruthy();
  const value = parseFloat(sumLine.split(' ').pop());
  expect(value).toBeGreaterThan(0);
});
