const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../../api/feedback');

function response() {
  return {
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

let nextClient = 0;

function request(body = {}) {
  return {
    method: 'POST',
    headers: {
      origin: 'https://squad-maker.vercel.app',
      host: 'squad-maker.vercel.app',
      'x-forwarded-proto': 'https',
      'x-forwarded-for': `192.0.2.${++nextClient}`,
      'content-type': 'application/json',
    },
    body: {
      repository: 'jaywapp/squad-maker',
      title: '오류',
      description: '재현 내용',
      appVersion: 'beta 1',
      platform: 'web',
      diagnostics: {},
      turnstileToken: 'valid',
      startedAt: Date.now() - 2000,
      website: '',
      ...body,
    },
  };
}

test('고정 저장소와 제보 라벨로 Issue를 생성한다', async () => {
  process.env.TURNSTILE_SECRET_KEY = 'test-secret';
  process.env.GITHUB_ISSUES_TOKEN = 'test-token';
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('siteverify')) return { ok: true, json: async () => ({ success: true }) };
    return { ok: true, json: async () => ({ number: 42 }) };
  };
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.issueNumber, 42);
  const issue = JSON.parse(calls[1].options.body);
  assert.equal(issue.title, '[제보] 오류');
  assert.deepEqual(issue.labels, ['제보']);
});

test('다른 저장소 요청을 거부한다', async () => {
  const res = response();
  await handler(request({ repository: 'other/repo' }), res);
  assert.equal(res.statusCode, 400);
});

test('허용되지 않은 출처를 거부한다', async () => {
  const req = request();
  req.headers.origin = 'https://evil.example';
  const res = response();
  await handler(req, res);
  assert.equal(res.statusCode, 403);
});

test('Turnstile 실패 시 GitHub를 호출하지 않는다', async () => {
  process.env.TURNSTILE_SECRET_KEY = 'test-secret';
  let calls = 0;
  global.fetch = async () => { calls++; return { ok: true, json: async () => ({ success: false }) }; };
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 400);
  assert.equal(calls, 1);
});

test('rate limiting keeps its sliding window while bounding retained attempts', () => {
  const { withinRateLimit } = handler._test;
  const now = Date.now() + 20 * 60 * 1000;
  const window = 10 * 60 * 1000;
  for (let index = 0; index < 1000; index++) {
    assert.equal(withinRateLimit('limit-test', now + index), index < 3);
  }
  assert.equal(globalThis.__squadMakerFeedbackAttempts.get('limit-test').length, 4);
  assert.equal(withinRateLimit('limit-test', now + window + 998), true);
  assert.equal(withinRateLimit('limit-test', now + window + 998), true);
  assert.equal(withinRateLimit('limit-test', now + window + 998), false);
  withinRateLimit('cleanup-test', now + 3 * window);
  assert.equal(globalThis.__squadMakerFeedbackAttempts.has('limit-test'), false);
});

test('invalid inputs and methods do not contact providers', async (t) => {
  t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected provider call'); });
  const cases = [
    [request({ title: '' }), 400],
    [request({ description: null }), 400],
    [request({ platform: 'other' }), 400],
    [request({ startedAt: 'invalid' }), 400],
    [request({ website: 'bot' }), 400],
    [{ ...request(), body: null }, 400],
    [{ ...request(), method: 'DELETE' }, 405],
  ];
  const wrongType = request();
  wrongType.headers['content-type'] = 'text/plain';
  cases.push([wrongType, 415]);
  for (const [req, expected] of cases) {
    const res = response();
    await handler(req, res);
    assert.equal(res.statusCode, expected);
  }
  assert.equal(global.fetch.mock.callCount(), 0);
});

test('provider failures return safe errors and stage logs without sensitive details', async (t) => {
  const logs = [];
  t.mock.method(console, 'warn', (...args) => logs.push(args.join(' ')));
  process.env.TURNSTILE_SECRET_KEY = 'test-secret';
  process.env.GITHUB_ISSUES_TOKEN = 'test-token';
  let failCaptcha = true;
  t.mock.method(global, 'fetch', async (url) => {
    if (String(url).includes('siteverify') && !failCaptcha) {
      return { ok: true, json: async () => ({ success: true }) };
    }
    throw new Error('private-provider-response');
  });
  const captcha = response();
  await handler(request(), captcha);
  assert.equal(captcha.statusCode, 400);
  failCaptcha = false;
  const github = response();
  await handler(request(), github);
  assert.equal(github.statusCode, 502);
  assert.equal(logs.length, 2);
  assert.match(logs[0], /Turnstile/);
  assert.match(logs[1], /GitHub/);
  assert.doesNotMatch(logs.join(' '), /private-provider-response|test-secret|test-token/);
});
