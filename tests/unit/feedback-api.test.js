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

function request(body = {}) {
  return {
    method: 'POST',
    headers: {
      origin: 'https://squad-maker.vercel.app',
      host: 'squad-maker.vercel.app',
      'x-forwarded-proto': 'https',
      'x-forwarded-for': `192.0.2.${Math.floor(Math.random() * 200) + 1}`,
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
