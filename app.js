// /opt/axentx/thai-gateway/src/app.js
const express = require('express');
const { register } = require('./metrics');
const logger = require('./logger');

const app = express();

// Middleware to collect metrics
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        register.getSingleMetric('gateway_request_latency_seconds').labels(req.provider).observe(duration);
    });
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});