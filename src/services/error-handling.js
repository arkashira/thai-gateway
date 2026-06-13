'use strict';

const UNAVAILABLE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class EndpointHealthTracker {
  /**
   * @param {{ttlMs?: number}} options
   */
  constructor(options = {}) {
    this._unavailable = new Map(); // name -> { at: number, statusCode: number }
    this._ttlMs = options.ttlMs != null ? options.ttlMs : UNAVAILABLE_TTL_MS;
  }

  /**
   * Record an endpoint as unavailable (5xx or timeout).
   * @param {string} name
   * @param {number} statusCode  HTTP status or 0 for timeout
   */
  markUnavailable(name, statusCode) {
    const at = Date.now();
    this._unavailable.set(name, { at, statusCode });
    console.error(
      `[health] Endpoint unavailable: ${name} status=${statusCode} at=${new Date(at).toISOString()}`
    );
  }

  /**
   * Returns true when the endpoint is not in the unavailable window.
   * Expired entries are evicted on read.
   * @param {string} name
   * @returns {boolean}
   */
  isAvailable(name) {
    const entry = this._unavailable.get(name);
    if (!entry) return true;
    if (Date.now() - entry.at >= this._ttlMs) {
      this._unavailable.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Explicitly clear an endpoint's unavailability record (e.g. health-check passed).
   * @param {string} name
   */
  markAvailable(name) {
    this._unavailable.delete(name);
  }

  /**
   * Return a snapshot of currently unavailable endpoints (excludes expired entries).
   * @returns {Record<string, {statusCode: number, remainingMs: number}>}
   */
  snapshot() {
    const now = Date.now();
    const out = {};
    for (const [name, entry] of this._unavailable) {
      const remainingMs = this._ttlMs - (now - entry.at);
      if (remainingMs > 0) {
        out[name] = { statusCode: entry.statusCode, remainingMs };
      }
    }
    return out;
  }
}

module.exports = { EndpointHealthTracker, UNAVAILABLE_TTL_MS };
