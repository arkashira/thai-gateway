'use strict';

const QUOTA_KEY_PREFIX = 'provider:quota:';
const DEFAULT_TTL_SECONDS = 60;

class ProviderRouter {
  /**
   * @param {Array<{name: string, limit: number}>} providers - priority-ordered list
   * @param {object} redisClient - ioredis-compatible (get/set/exists/decr/ttl)
   * @param {{ttl?: number}} options
   */
  constructor(providers, redisClient, options = {}) {
    if (!providers || providers.length === 0) {
      throw new Error('providers must be a non-empty array');
    }
    this.providers = providers;
    this.redis = redisClient;
    this.ttl = options.ttl || DEFAULT_TTL_SECONDS;
  }

  _key(name) {
    return `${QUOTA_KEY_PREFIX}${name}`;
  }

  async getRemaining(name) {
    const val = await this.redis.get(this._key(name));
    if (val === null) {
      const provider = this.providers.find((p) => p.name === name);
      return provider ? provider.limit : 0;
    }
    return Math.max(0, parseInt(val, 10));
  }

  async consumeQuota(name) {
    const key = this._key(name);
    const exists = await this.redis.exists(key);
    if (!exists) {
      const provider = this.providers.find((p) => p.name === name);
      const limit = provider ? provider.limit : 0;
      await this.redis.set(key, limit - 1, 'EX', this.ttl);
      return limit - 1;
    }
    return this.redis.decr(key);
  }

  /**
   * @param {import('./error-handling').EndpointHealthTracker|null} healthTracker
   * @returns {Promise<string|null>}
   */
  async selectProvider(healthTracker = null) {
    for (const p of this.providers) {
      if (healthTracker && !healthTracker.isAvailable(p.name)) continue;
      const remaining = await this.getRemaining(p.name);
      if (remaining > 0) return p.name;
    }
    return null;
  }

  async retryAfterSeconds() {
    let min = this.ttl;
    for (const p of this.providers) {
      const ttl = await this.redis.ttl(this._key(p.name));
      if (ttl > 0 && ttl < min) min = ttl;
    }
    return min;
  }

  /**
   * @param {import('./error-handling').EndpointHealthTracker|null} healthTracker
   */
  middleware(healthTracker = null) {
    return async (req, res, next) => {
      try {
        const provider = await this.selectProvider(healthTracker);
        if (!provider) {
          const allUnavailable =
            healthTracker &&
            this.providers.every((p) => !healthTracker.isAvailable(p.name));
          if (allUnavailable) {
            return res.status(503).json({ error: 'All endpoints unavailable' });
          }
          const retryAfter = await this.retryAfterSeconds();
          res.set('Retry-After', String(retryAfter));
          return res.status(429).json({ error: 'All providers exhausted', retryAfter });
        }
        req.provider = provider;
        await this.consumeQuota(provider);
        next();
      } catch (err) {
        next(err);
      }
    };
  }
}

module.exports = { ProviderRouter, QUOTA_KEY_PREFIX, DEFAULT_TTL_SECONDS };
