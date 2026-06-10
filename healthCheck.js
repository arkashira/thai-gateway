// Before
const express = require('express');
const router = express.Router();

// After
const express = require('express');
const router = express.Router();
const providers = require('./provider');
const router = require('./router');

router.get('/health-check', async (req, res) => {
  const congestedProviders = await providers.getCongestedProviders();
  const bestProvider = await router.getBestProvider(congestedProviders);
  res.json({ bestProvider });
});