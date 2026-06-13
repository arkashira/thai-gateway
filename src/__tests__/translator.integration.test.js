'use strict';

/**
 * Integration tests: hit a real HTTP endpoint (nock-intercepted).
 * Run with: GOOGLE_TRANSLATE_API_KEY=test jest translator.integration
 */

const nock = require('nock');
const { translate } = require('../translation/translator');

const API_HOST = 'https://translation.googleapis.com';
const API_PATH = '/language/translate/v2';

beforeEach(() => {
  process.env.GOOGLE_TRANSLATE_API_KEY = 'integration-test-key';
  nock.cleanAll();
});

afterEach(() => {
  delete process.env.GOOGLE_TRANSLATE_API_KEY;
  nock.cleanAll();
});

// ── Happy paths ───────────────────────────────────────────────────────────────

test('INT-01: translates a plain English query to Thai', async () => {
  nock(API_HOST)
    .post(new RegExp(API_PATH))
    .reply(200, {
      data: { translations: [{ translatedText: 'คุณต้องการสั่งซื้ออะไร?' }] },
    });

  const result = await translate('What would you like to order?');
  expect(result.translated).toBe(true);
  expect(result.text).toBe('คุณต้องการสั่งซื้ออะไร?');
});

test('INT-02: preserves product name in translated output', async () => {
  nock(API_HOST)
    .post(new RegExp(API_PATH))
    .reply(200, {
      data: { translations: [{ translatedText: 'ราคา Samsung Galaxy S24 คือเท่าไหร่?' }] },
    });

  const result = await translate('What is the price of Samsung Galaxy S24?');
  expect(result.translated).toBe(true);
  expect(result.text).toContain('Samsung Galaxy S24');
});

test('INT-03: translates prompt with numeric values intact', async () => {
  nock(API_HOST)
    .post(new RegExp(API_PATH))
    .reply(200, {
      data: { translations: [{ translatedText: 'รหัสสินค้า 123-456 มีในสต็อกหรือไม่?' }] },
    });

  const result = await translate('Is product code 123-456 in stock?');
  expect(result.translated).toBe(true);
  expect(result.text).toContain('123-456');
});

test('INT-04: translates prompt containing Thai mixed with English', async () => {
  nock(API_HOST)
    .post(new RegExp(API_PATH))
    .reply(200, {
      data: { translations: [{ translatedText: 'โปรโมชั่น Flash Sale ใช้งานได้ถึงเมื่อไหร่?' }] },
    });

  const result = await translate('When does the Flash Sale promotion end?');
  expect(result.translated).toBe(true);
  expect(result.text).toContain('Flash Sale');
});

test('INT-05: translates a long prompt (multi-sentence)', async () => {
  const input = 'I am looking for a gift for my mother. She likes cooking and baking. Budget is around 500 baht.';
  nock(API_HOST)
    .post(new RegExp(API_PATH))
    .reply(200, {
      data: { translations: [{ translatedText: 'ฉันกำลังหาของขวัญให้แม่ เธอชอบทำอาหารและอบขนม งบประมาณอยู่ที่ประมาณ 500 บาท' }] },
    });

  const result = await translate(input);
  expect(result.translated).toBe(true);
  expect(typeof result.text).toBe('string');
  expect(result.text.length).toBeGreaterThan(0);
});

// ── Edge / failure cases ───────────────────────────────────────────────────────

test('INT-06: falls back to raw prompt when API returns 403 (invalid key)', async () => {
  nock(API_HOST)
    .post(new RegExp(API_PATH))
    .reply(403, { error: { message: 'API key invalid' } });

  const logger = { error: jest.fn() };
  const result = await translate('some prompt', { logger });
  expect(result.translated).toBe(false);
  expect(result.text).toBe('some prompt');
  expect(logger.error).toHaveBeenCalledWith('Translation API error', expect.any(Object));
});

test('INT-07: falls back to raw prompt on network timeout', async () => {
  nock(API_HOST)
    .post(new RegExp(API_PATH))
    .delayConnection(5000) // longer than our 4 s timeout
    .reply(200, {});

  const logger = { error: jest.fn() };
  const result = await translate('timeout test', { logger, timeoutMs: 100 });
  expect(result.translated).toBe(false);
  expect(result.text).toBe('timeout test');
  expect(logger.error).toHaveBeenCalled();
}, 10000);

test('INT-08: falls back to raw prompt on malformed JSON response', async () => {
  nock(API_HOST)
    .post(new RegExp(API_PATH))
    .reply(200, 'not-json');

  const logger = { error: jest.fn() };
  const result = await translate('bad json', { logger });
  expect(result.translated).toBe(false);
  expect(result.text).toBe('bad json');
});
