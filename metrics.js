// /opt/axentx/thai-gateway/src/metrics.js
const promClient = require('prom-client');

// Initialize Prometheus metrics
const register = new promClient.Registry();
register.setDefaultLabels({ app: 'thai-gateway' });

const rateLimitMetric = new promClient.Gauge({
    name: 'gateway_rate_limit',
    help: 'Current rate limit status',
    labelNames: ['provider']
});

const errorMetric = new promClient.Counter({
    name: 'gateway_errors_total',
    help: 'Total number of errors',
    labelNames: ['provider']
});

const latencyMetric = new promClient.Histogram({
    name: 'gateway_request_latency_seconds',
    help: 'Request latency in seconds',
    labelNames: ['provider'],
    buckets: [0.1, 0.5, 1, 2, 5]
});

module.exports = {
    register,
    rateLimitMetric,
    errorMetric,
    latencyMetric
};