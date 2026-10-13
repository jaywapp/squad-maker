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

test('Android origin can retrieve config and preflight JSON POST without relaxing other origins', async (t) => {
  t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected provider call'); });
  process.env.TURNSTILE_SITE_KEY = 'public-test-key';
  const req = request();
  req.headers.origin = 'https://localhost';
  req.method = 'GET';
  const config = response();
  await handler(req, config);
  assert.equal(config.statusCode, 200);
  assert.deepEqual(config.body, { turnstileSiteKey: 'public-test-key' });
  assert.equal(config.headers['Access-Control-Allow-Origin'], 'https://localhost');
  assert.equal(config.headers.Vary, 'Origin');
  assert.equal(config.headers['Cache-Control'], 'no-store');
  req.method = 'OPTIONS';
  const preflight = response();
  await handler(req, preflight);
  assert.equal(preflight.statusCode, 204);
  assert.equal(preflight.headers['Access-Control-Allow-Origin'], 'https://localhost');
  assert.equal(preflight.headers['Access-Control-Allow-Methods'], 'GET, POST, OPTIONS');
  assert.equal(preflight.headers['Access-Control-Allow-Headers'], 'Content-Type');
  for (const origin of ['http://localhost', 'https://localhost:443', 'https://127.0.0.1',
    'https://localhost.evil.example', 'capacitor://localhost', 'null']) {
    req.headers.origin = origin;
    const denied = response();
    await handler(req, denied);
    assert.equal(denied.statusCode, 403, origin);
    assert.equal(denied.headers['Access-Control-Allow-Origin'], undefined);
  }
  assert.equal(global.fetch.mock.callCount(), 0);
});

test('configured custom origins and forwarded same-origin requests keep their existing contract', () => {
  process.env.FEEDBACK_ALLOWED_ORIGINS = ' https://custom.example , https://other.example ';
  try {
    const req = request();
    req.headers.origin = 'https://custom.example';
    assert.equal(handler._test.requestOrigin(req), 'https://custom.example');
    req.headers.origin = 'https://custom.example.evil.example';
    assert.equal(handler._test.requestOrigin(req), '');
    req.headers.origin = 'https://forwarded.example';
    req.headers['x-forwarded-host'] = 'forwarded.example, proxy.example';
    assert.equal(handler._test.requestOrigin(req), 'https://forwarded.example');
  } finally { delete process.env.FEEDBACK_ALLOWED_ORIGINS; }
});

test('missing public CAPTCHA configuration is unavailable and cannot contact providers', async (t) => {
  delete process.env.TURNSTILE_SITE_KEY;
  t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected provider call'); });
  const req = request();
  req.method = 'GET';
  const result = response();
  await handler(req, result);
  assert.equal(result.statusCode, 503);
  assert.equal(global.fetch.mock.callCount(), 0);
});

test('POST without an origin remains denied even though config GET can be public', async (t) => {
  t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected provider call'); });
  const req = request();
  delete req.headers.origin;
  const result = response();
  await handler(req, result);
  assert.equal(result.statusCode, 403);
  assert.equal(global.fetch.mock.callCount(), 0);
});

test('Android feedback records the installed version and actual platform after CAPTCHA validation', async (t) => {
  process.env.TURNSTILE_SECRET_KEY = 'test-secret';
  process.env.GITHUB_ISSUES_TOKEN = 'test-token';
  const calls = [];
  t.mock.method(global, 'fetch', async (url, options) => {
    calls.push({ url: String(url), options });
    assert.ok(options.signal instanceof AbortSignal);
    if (String(url).includes('siteverify')) return { ok: true, json: async () => ({ success: true }) };
    return { ok: true, json: async () => ({ number: 43 }) };
  });
  const req = request({ platform: 'android', appVersion: '0.1.0.main.150.27a34ca9 (1152)' });
  req.headers.origin = 'https://localhost';
  const result = response();
  await handler(req, result);
  assert.equal(result.statusCode, 201);
  assert.equal(result.body.issueNumber, 43);
  assert.equal(result.headers['Access-Control-Allow-Origin'], 'https://localhost');
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /siteverify$/);
  assert.equal(calls[1].url, 'https://api.github.com/repos/jaywapp/squad-maker/issues');
  const issue = JSON.parse(calls[1].options.body);
  assert.match(issue.body, /앱 버전: 0\.1\.0\.main\.150\.27a34ca9 \(1152\)/);
  assert.match(issue.body, /플랫폼: android/);
  assert.deepEqual(issue.labels, ['제보']);
});

test('Android validation rejects unknown platform, missing version and honeypot before providers', async (t) => {
  t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected provider call'); });
  for (const body of [{ platform: 'ios' }, { platform: 'ANDROID' }, { platform: '' },
    { platform: 'android', appVersion: '' }, { platform: 'android', website: 'spam' }]) {
    const req = request(body);
    req.headers.origin = 'https://localhost';
    const result = response();
    await handler(req, result);
    assert.equal(result.statusCode, 400);
  }
  assert.equal(global.fetch.mock.callCount(), 0);
});

for (const stage of ['captcha', 'github']) {
  test(stage + ' provider timeout returns a safe failure before the platform function deadline', async (t) => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
    process.env.GITHUB_ISSUES_TOKEN = 'test-token';
    const deadlines = [];
    t.mock.method(AbortSignal, 'timeout', milliseconds => {
      deadlines.push(milliseconds);
      return AbortSignal.abort();
    });
    t.mock.method(console, 'warn', () => {});
    t.mock.method(global, 'fetch', async (url, options) => {
      assert.equal(options.signal.aborted, true);
      if (stage === 'github' && String(url).includes('siteverify')) {
        return { ok: true, json: async () => ({ success: true }) };
      }
      throw Object.assign(new Error('private provider timeout'), { name: 'AbortError' });
    });
    const result = response();
    await handler(request({ platform: 'android' }), result);
    assert.equal(result.statusCode, stage === 'captcha' ? 400 : 502);
    assert.doesNotMatch(JSON.stringify(result.body), /private|test-secret|test-token/);
    assert.equal(deadlines.length, stage === 'captcha' ? 1 : 2);
    assert.ok(deadlines.every(milliseconds => milliseconds > 0 && milliseconds < 5000));
  });
}
