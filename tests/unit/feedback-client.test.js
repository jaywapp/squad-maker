const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createClient } = require('../../app/feedback-client');

function jsonResponse(body, status = 200) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

for (const native of [false, true]) {
  test((native ? 'Android' : 'web') + ' routes config and submissions to its endpoint with the actual platform', async () => {
    const calls = [];
    const client = createClient({ native, fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return options.method === 'GET' ? jsonResponse({ turnstileSiteKey: 'public-test-key' })
        : jsonResponse({ issueNumber: 42 }, 201);
    } });
    assert.deepEqual(await client.getConfig(), { turnstileSiteKey: 'public-test-key' });
    const payload = { repository: 'jaywapp/squad-maker', title: 'Original title', description: 'Original description',
      appVersion: '0.1.0.main.150.27a34ca9 (1152)', platform: 'untrusted', diagnostics: { summary: 'consented' } };
    const original = JSON.parse(JSON.stringify(payload));
    assert.deepEqual(await client.submit(payload), { issueNumber: 42 });
    const endpoint = native ? 'https://squad-maker.vercel.app/api/feedback' : '/api/feedback';
    assert.equal(client.endpoint, endpoint);
    assert.equal(client.platform, native ? 'android' : 'web');
    assert.deepEqual(calls.map(call => call.url), [endpoint, endpoint]);
    assert.equal(calls[0].options.headers.Accept, 'application/json');
    assert.equal(calls[0].options.cache, 'no-store');
    assert.equal(calls[1].options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(calls[1].options.body), { ...original, platform: native ? 'android' : 'web' });
    assert.deepEqual(payload, original);
    assert.equal(Object.isFrozen(client), true);
  });
}

test('the browser script exposes the client without CommonJS or native dependencies', async () => {
  const context = vm.createContext({ fetch: async () => jsonResponse({ turnstileSiteKey: 'public-test-key' }),
    AbortController, setTimeout, clearTimeout });
  vm.runInContext(fs.readFileSync(require.resolve('../../app/feedback-client'), 'utf8'), context);
  const client = context.SquadFeedbackClient.createClient();
  assert.equal(client.platform, 'web');
  assert.equal((await client.getConfig()).turnstileSiteKey, 'public-test-key');
});

test('a deployed static HTML 404 is reported clearly without trying to parse HTML', async () => {
  let parsed = false;
  const client = createClient({ native: true, fetchImpl: async () => ({ status: 404, ok: false,
    json: async () => { parsed = true; throw new Error('private HTML content'); } }) });
  await assert.rejects(client.getConfig(), error => error.code === 'feedback-not-found'
    && /아직 연결되지/.test(error.message) && /입력 내용은 유지/.test(error.message));
  assert.equal(parsed, false);
});

for (const [label, response] of [
  ['invalid JSON', { status: 200, ok: true, json: async () => { throw new Error('private response'); } }],
  ['missing site key', jsonResponse({})], ['blank site key', jsonResponse({ turnstileSiteKey: ' ' })],
]) test(label + ' cannot make the feedback form ready', async () => {
  const client = createClient({ fetchImpl: async () => response });
  await assert.rejects(client.getConfig(), error => error.code === 'feedback-invalid-response'
    && !/private response/.test(error.message));
});

for (const issueNumber of [undefined, null, '42', 0, -1, 1.5]) {
  test('invalid issue acknowledgement ' + String(issueNumber) + ' cannot clear a submitted form', async () => {
    const client = createClient({ fetchImpl: async () => jsonResponse({ issueNumber }, 201) });
    await assert.rejects(client.submit({ title: 'Keep this title' }), error => error.code === 'feedback-invalid-response');
  });
}

test('network or CORS rejection hides raw details and leaves the input payload intact', async () => {
  const payload = { title: 'Keep this title', description: 'Keep this description' };
  const client = createClient({ native: true, fetchImpl: async () => { throw new Error('private network detail'); } });
  await assert.rejects(client.submit(payload), error => error.code === 'feedback-network'
    && /인터넷 연결/.test(error.message) && !/private network detail/.test(error.message));
  assert.deepEqual(payload, { title: 'Keep this title', description: 'Keep this description' });
});

test('validation, rate limit and provider failures retain the server explanation without claiming success', async () => {
  for (const [status, message] of [[400, '필수 입력을 확인해 주세요.'], [429, '10분 뒤 다시 시도해 주세요.'],
    [502, 'GitHub에 연결하지 못했습니다.'], [503, '제보 창구 설정이 완료되지 않았습니다.']]) {
    const client = createClient({ fetchImpl: async () => jsonResponse({ error: message }, status) });
    await assert.rejects(client.submit({ title: 'Retained' }), error => error.message === message
      && error.code === (status >= 500 ? 'feedback-unavailable' : 'feedback-rejected'));
  }
});

for (const stage of ['fetch', 'body']) {
  test('the deadline covers a stalled ' + stage + ' even when the transport ignores abort', async () => {
    let signal;
    const client = createClient({ timeoutMs: 15, fetchImpl: async (url, options) => {
      signal = options.signal;
      if (stage === 'fetch') return new Promise(() => {});
      return { status: 200, ok: true, json: () => new Promise(() => {}) };
    } });
    await assert.rejects(client.getConfig(), error => error.code === 'feedback-timeout'
      && /입력 내용은 유지/.test(error.message));
    assert.equal(signal.aborted, true);
  });
}

test('successful requests clear the deadline and do not abort their transport later', async () => {
  let signal;
  const client = createClient({ timeoutMs: 15, fetchImpl: async (url, options) => {
    signal = options.signal;
    return jsonResponse({ turnstileSiteKey: 'public-test-key' });
  } });
  await client.getConfig();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(signal.aborted, false);
});

test('a submission timeout leaves receipt uncertain instead of encouraging a duplicate submission', async () => {
  const client = createClient({ timeoutMs: 15, fetchImpl: () => new Promise(() => {}) });
  await assert.rejects(client.submit({ title: 'Retained' }), error => error.code === 'feedback-timeout'
    && /접수 여부를 확인하지 못/.test(error.message) && !/다시 시도/.test(error.message));
});

for (const status of [200, 202]) {
  test('HTTP ' + status + ' cannot claim a newly created issue even if an issue number is present', async () => {
    const client = createClient({ fetchImpl: async () => jsonResponse({ issueNumber: 42 }, status) });
    await assert.rejects(client.submit({ title: 'Retained' }), error => error.code === 'feedback-invalid-response');
  });
}
