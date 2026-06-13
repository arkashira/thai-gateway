'use strict';

const { translate, _validatePrompt, _getApiKey, TARGET_LANG, MAX_PROMPT_BYTES } = require('../translation/translator');

// ── helpers ──────────────────────────────────────────────────────────────────

function makeLogger() {
  return { error: jest.fn(), info: jest.fn() };
}

// Capture the https.request mock at module level so individual tests can control it
let mockRequest;
jest.mock('https', () => ({
  request: (...args) => mockRequest(...args),
}));

function mockHttpSuccess(responseBody, statusCode = 200) {
  mockRequest = jest.fn((options, callback) => {
    const res = Object.assign(require('events').EventEmitter.prototype, {
      statusCode,
    });
    // Emit the response asynchronously
    setImmediate(() => {
      callback(res);
      res.emit('data', JSON.stringify(responseBody));
      res.emit('end');
    });
    return { setTimeout: jest.fn(), on: jest.fn(), write: jest.fn(), end: jest.fn() };
  });
}

function mockHttpError(code = 'ECONNREFUSED') {
  mockRequest = jest.fn((options, callback) => {
    const req = require('events').EventEmitter.prototype;
    const fakeReq = Object.assign({}, req, {
      setTimeout: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
    });
    setImmediate(() => {
      const err = new Error('Network error');
      err.code = code;
      fakeReq.emit('error', err);
    });
    return fakeReq;
  });
}

// ── _validatePrompt ───────────────────────────────────────────────────────────

describe('_validatePrompt', () => {
  test('accepts valid string', () => {
    expect(() => _validatePrompt('hello')).not.toThrow();
  });

  test('throws TypeError for non-string input', () => {
    expect(() => _validatePrompt(42)).toThrow(TypeError);
    expect(() => _validatePrompt(null)).toThrow(TypeError);
    expect(() => _validatePrompt(undefined)).toThrow(TypeError);
  });

  test('throws RangeError for empty string', () => {
    expect(() => _validatePrompt('')).toThrow(RangeError);
  });

  test('throws RangeError when prompt exceeds MAX_PROMPT_BYTES', () => {
    const oversized = 'a'.repeat(MAX_PROMPT_BYTES + 1);
    expect(() => _validatePrompt(oversized)).toThrow(RangeError);
  });

  test('accepts prompt at exactly MAX_PROMPT_BYTES boundary', () => {
    const atLimit = 'a'.repeat(MAX_PROMPT_BYTES);
    expect(() => _validatePrompt(atLimit)).not.toThrow();
  });
});

// ── _getApiKey ────────────────────────────────────────────────────────────────

describe('_getApiKey', () => {
  const ORIG = process.env.GOOGLE_TRANSLATE_API_KEY;
  afterEach(() => {
    if (ORIG === undefined) delete process.env.GOOGLE_TRANSLATE_API_KEY;
    else process.env.GOOGLE_TRANSLATE_API_KEY = ORIG;
  });

  test('returns key when env var is set', () => {
    process.env.GOOGLE_TRANSLATE_API_KEY = 'test-key-123';
    expect(_getApiKey()).toBe('test-key-123');
  });

  test('throws when env var is missing', () => {
    delete process.env.GOOGLE_TRANSLATE_API_KEY;
    expect(() => _getApiKey()).toThrow('GOOGLE_TRANSLATE_API_KEY env var is not set');
  });
});

// ── translate — unit (mocked HTTP) ───────────────────────────────────────────

describe('translate()', () => {
  beforeEach(() => {
    process.env.GOOGLE_TRANSLATE_API_KEY = 'unit-test-key';
  });

  afterEach(() => {
    delete process.env.GOOGLE_TRANSLATE_API_KEY;
    jest.clearAllMocks();
  });

  test('returns translated Thai text on success', async () => {
    mockHttpSuccess({
      data: { translations: [{ translatedText: 'สวัสดี' }] },
    });
    const logger = makeLogger();
    const result = await translate('Hello', { logger });
    expect(result).toEqual({ text: 'สวัสดี', translated: true });
    expect(logger.error).not.toHaveBeenCalled();
  });

  test('fallback: returns raw prompt when API returns HTTP 500', async () => {
    mockHttpSuccess({}, 500);
    const logger = makeLogger();
    const result = await translate('raw prompt', { logger });
    expect(result).toEqual({ text: 'raw prompt', translated: false });
    expect(logger.error).toHaveBeenCalledWith('Translation API error', expect.any(Object));
  });

  test('fallback: returns raw prompt on network error', async () => {
    mockHttpError('ECONNREFUSED');
    const logger = makeLogger();
    const result = await translate('network fail', { logger });
    expect(result.translated).toBe(false);
    expect(result.text).toBe('network fail');
    expect(logger.error).toHaveBeenCalled();
  });

  test('fallback: returns raw prompt when API key is missing', async () => {
    delete process.env.GOOGLE_TRANSLATE_API_KEY;
    const logger = makeLogger();
    const result = await translate('no key', { logger });
    expect(result).toEqual({ text: 'no key', translated: false });
    expect(logger.error).toHaveBeenCalledWith('Translation config error', expect.any(Object));
  });

  test('fallback: returns raw prompt on empty input, logs validation error', async () => {
    const logger = makeLogger();
    const result = await translate('', { logger });
    expect(result).toEqual({ text: '', translated: false });
    expect(logger.error).toHaveBeenCalledWith('Translation validation error', expect.any(Object));
  });

  test('error message does NOT leak API key', async () => {
    mockHttpError('ETIMEDOUT');
    const logger = makeLogger();
    await translate('prompt', { logger });
    const errArg = logger.error.mock.calls[0][1];
    expect(JSON.stringify(errArg)).not.toContain('unit-test-key');
  });

  test('preserves product names and special characters in returned text', async () => {
    const thaiProduct = 'สินค้า iPhone 15 Pro Max ราคา 10,000 บาท';
    mockHttpSuccess({
      data: { translations: [{ translatedText: thaiProduct }] },
    });
    const result = await translate('iPhone 15 Pro Max price 10000 baht', {});
    expect(result.text).toBe(thaiProduct);
  });

  test('target language is Thai (th)', () => {
    expect(TARGET_LANG).toBe('th');
  });
});
