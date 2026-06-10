// tests/proxy/healthCheck.test.js
const request = require('supertest');
const express = require('express');
const healthCheck = require('../../src/proxy/healthCheck');
const metrics = require('../../src/proxy/metrics'); // module that fetches real‑time data

jest.mock('../../src/proxy/metrics');

describe('GET /health', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/', healthCheck);
  });

  afterEach(() => jest.resetAllMocks());

  test('returns 200 with status ok when enabled', async () => {
    process.env.ENABLE_HEALTH_CHECK = 'true';
    metrics.getProviderMetrics.mockResolvedValue([
      { name: 'provA', responseTimeMs: 120, errorRate: 0.01, congestionScore: 0.5 }
    ]);

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.providers).toHaveLength(1);
    expect(res.body.providers[0].name).toBe('provA');
  });

  test('returns 503 when metrics collection fails', async () => {
    process.env.ENABLE_HEALTH_CHECK = 'true';
    metrics.getProviderMetrics.mockRejectedValue(new Error('db fail'));

    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unavailable');
  });

  test('endpoint disabled when env var false', async () => {
    process.env.ENABLE_HEALTH_CHECK = 'false';
    const res = await request(app).get('/health');
    expect(res.status).toBe(404); // route not registered
  });
});