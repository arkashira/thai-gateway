'use strict';

const https = require('https');

const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';
const TARGET_LANG = 'th';
const TRANSLATION_TIMEOUT_MS = 4000;
const MAX_PROMPT_BYTES = 30720; // Google Translate hard limit is 30 KB per request

function _getApiKey() {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) throw new Error('GOOGLE_TRANSLATE_API_KEY env var is not set');
  return key;
}

function _validatePrompt(prompt) {
  if (typeof prompt !== 'string') throw new TypeError('prompt must be a string');
  if (prompt.length === 0) throw new RangeError('prompt must not be empty');
  if (Buffer.byteLength(prompt, 'utf8') > MAX_PROMPT_BYTES) {
    throw new RangeError(`prompt exceeds max size of ${MAX_PROMPT_BYTES} bytes`);
  }
}

function _httpsPost(urlStr, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error('Failed to parse translation API response'));
          }
        } else {
          // Avoid leaking full API error body to callers — log it internally
          reject(new Error(`Translation API returned HTTP ${res.statusCode}`));
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Translation API timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err) => reject(new Error(`Translation API network error: ${err.code}`)));
    req.write(payload);
    req.end();
  });
}

/**
 * Translate `prompt` to Thai using the Google Cloud Translation REST API.
 * Returns the translated string, or the original prompt on failure (with error logged).
 *
 * @param {string} prompt
 * @param {object} [opts]
 * @param {object} [opts.logger]  - object with .error(msg, meta); defaults to console
 * @param {number} [opts.timeoutMs] - HTTP timeout override for tests
 * @returns {Promise<{text: string, translated: boolean}>}
 */
async function translate(prompt, opts = {}) {
  const logger = opts.logger || console;
  const timeoutMs = opts.timeoutMs !== undefined ? opts.timeoutMs : TRANSLATION_TIMEOUT_MS;

  try {
    _validatePrompt(prompt);
  } catch (err) {
    logger.error('Translation validation error', { message: err.message });
    return { text: prompt, translated: false };
  }

  let apiKey;
  try {
    apiKey = _getApiKey();
  } catch (err) {
    logger.error('Translation config error', { message: err.message });
    return { text: prompt, translated: false };
  }

  const url = `${GOOGLE_TRANSLATE_URL}?key=${apiKey}`;

  let body;
  try {
    const response = await _httpsPost(url, { q: prompt, target: TARGET_LANG, format: 'text' }, timeoutMs);
    const translatedText = response.data.translations[0].translatedText;
    return { text: translatedText, translated: true };
  } catch (err) {
    logger.error('Translation API error', { message: err.message });
    return { text: prompt, translated: false };
  }
}

module.exports = { translate, _validatePrompt, _getApiKey, TARGET_LANG, MAX_PROMPT_BYTES };
