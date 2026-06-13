'use strict';

const express = require('express');
const promClient = require('prom-client');
const { v4: uuidv4 } = require('uuid');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const requestsTotal = new promClient.Counter({
  name: 'thai_gateway_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status', 'provider'],
  registers: [register],
});

const errorsTotal = new promClient.Counter({
  name: 'thai_gateway_errors_total',
  help: 'Total HTTP 5xx errors',
  labelNames: ['route', 'provider'],
  registers: [register],
});

const responseDuration = new promClient.Histogram({
  name: 'thai_gateway_response_duration_seconds',
  help: 'HTTP response latency in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const providerRequestsTotal = new promClient.Counter({
  name: 'thai_gateway_provider_requests_total',
  help: 'Requests routed per AI provider',
  labelNames: ['provider'],
  registers: [register],
});

const translationCacheHitRatio = new promClient.Gauge({
  name: 'thai_gateway_translation_cache_hit_ratio',
  help: 'Translation cache hit ratio (0–1)',
  registers: [register],
});

function requestIdMiddleware(req, res, next) {
  const id = req.headers['x-request-id'] || uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}

function metricsMiddleware(req, res, next) {
  const startNs = process.hrtime.bigint();

  res.on('finish', () => {
    const durationSec = Number(process.hrtime.bigint() - startNs) / 1e9;
    const route = (req.route && req.route.path) || req.path;
    const provider = req.provider || 'unknown';
    const status = String(res.statusCode);

    requestsTotal.inc({ method: req.method, route, status, provider });
    responseDuration.observe({ method: req.method, route, status }, durationSec);

    if (res.statusCode >= 500) {
      errorsTotal.inc({ route, provider });
    }

    if (req.provider) {
      providerRequestsTotal.inc({ provider: req.provider });
    }
  });

  next();
}

function updateCacheHitRatio(ratio) {
  translationCacheHitRatio.set(ratio);
}

const router = express.Router();

router.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

module.exports = {
  router,
  requestIdMiddleware,
  metricsMiddleware,
  updateCacheHitRatio,
  register,
  _metrics: {
    requestsTotal,
    errorsTotal,
    responseDuration,
    providerRequestsTotal,
    translationCacheHitRatio,
  },
};
