const test = require('node:test');
const assert = require('node:assert/strict');
const { createController } = require('../../app/update-controller');
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

function harness(options = {}) {
  const calls = [], notifications = [];
  let listener, state = { supported: true, status: 'downloaded', availableVersionCode: 2, shouldNotify: true };
  const receipt = 'verified-storage-receipt';
  const platform = { native: true,
    getUpdateState: async () => { calls.push('state'); return state; },
    checkForUpdate: async () => { calls.push('check'); return state; },
    startFlexibleUpdate: async () => { calls.push('start'); return { ...state, status: 'downloading' }; },
    dismissUpdate: async () => { calls.push('dismiss'); return state; },
    beginUpdateCompletion: async () => { calls.push('gate'); return { challenge: 'single-use' }; },
    completeUpdate: async value => { calls.push({ complete: value }); return { ...state, status: 'installing' }; },
    getStorageReceipt: async () => receipt,
    onUpdateState: callback => { listener = callback; return () => calls.push('unsubscribe'); },
    ...options.platform,
  };
  const controller = createController({ platform, eligible: options.eligible !== false,
    prepareRestart: async () => { calls.push('prepare'); return { ok: true, receipt }; },
    releaseRestart: async () => calls.push('unlock'), onState: value => notifications.push(value), ...options, platform });
  return { controller, calls, notifications, receipt,
    emit: value => listener?.(value), setState: value => { state = value; } };
}

for (const channel of ['web', 'preview']) test(channel + ' cannot call any native update method', async () => {
  const app = harness(channel === 'web' ? { platform: { native: false } } : { eligible: false });
  await app.controller.check({ manual: true }); await app.controller.start(); await app.controller.complete(); await app.controller.dismiss();
  assert.deepEqual(app.calls, []);
  assert.equal(app.controller.getState().status, 'unsupported');
});

test('check and resume notifications never start or complete an update', async () => {
  const app = harness();
  await app.controller.check({ manual: false });
  app.emit({ supported: true, status: 'downloaded', shouldNotify: true });
  assert.deepEqual(app.calls, ['check']);
});

test('download starts only from an explicitly available state', async () => {
  const app = harness(); await app.controller.start();
  assert.deepEqual(app.calls, ['state']);
  app.setState({ supported: true, status: 'available' }); await app.controller.start();
  assert.equal(app.calls.filter(value => value === 'start').length, 1);
});

test('completion validates the saved receipt, challenge and refreshed download before a single native complete', async () => {
  const app = harness(); const result = await app.controller.complete();
  assert.equal(result.status, 'installing');
  assert.deepEqual(app.calls, ['state', 'prepare', 'gate', 'state', { complete: { challenge: 'single-use', receipt: app.receipt } }, 'unlock']);
});

for (const reason of ['dirty-drag', 'export-busy', 'transient', 'storage-verification']) test(reason + ' barrier failure prevents native completion', async () => {
  const app = harness({ prepareRestart: async () => ({ ok: false, reason }) });
  const result = await app.controller.complete();
  assert.equal(result.status, 'blocked'); assert.equal(result.reason, reason);
  assert.deepEqual(app.calls, ['state', 'unlock']);
});

test('double complete shares the same pending promise', async () => {
  const save = deferred(); const app = harness({ prepareRestart: () => save.promise });
  const first = app.controller.complete(), second = app.controller.complete();
  assert.equal(first, second);
  save.resolve({ ok: true, receipt: app.receipt }); await first;
  assert.equal(app.calls.filter(value => typeof value === 'object').length, 1);
});

test('a changed editor after saving blocks completion even when the receipt is unchanged', async () => {
  const app = harness({ validateRestart: () => false });
  const result = await app.controller.complete();
  assert.equal(result.reason, 'save-changed');
  assert.equal(app.calls.some(value => typeof value === 'object'), false);
  assert.equal(app.calls.includes('unlock'), true);
});

test('dismiss during a delayed save invalidates the old callback and unlocks without completion', async () => {
  const save = deferred(); const app = harness({ prepareRestart: () => save.promise });
  const pending = app.controller.complete(); await new Promise(resolve => setImmediate(resolve));
  await app.controller.dismiss(); save.resolve({ ok: true, receipt: app.receipt }); await pending;
  assert.equal(app.calls.includes('gate'), false);
  assert.equal(app.calls.includes('unlock'), true);
  assert.equal(app.calls.some(value => typeof value === 'object'), false);
});

test('a changed receipt or changed downloaded status blocks restart', async () => {
  const changed = harness({ platform: { getStorageReceipt: async () => 'new-storage-receipt' } });
  assert.equal((await changed.controller.complete()).reason, 'storage-changed');
  let reads = 0;
  const stale = harness({ platform: { getUpdateState: async () => ({ status: ++reads === 1 ? 'downloaded' : 'cancelled' }) } });
  assert.equal((await stale.controller.complete()).status, 'cancelled');
  for (const app of [changed, stale]) assert.equal(app.calls.some(value => typeof value === 'object'), false);
});

test('offline and rejected operations are recoverable and do not expose private errors', async () => {
  const app = harness({ platform: { checkForUpdate: async () => { throw new Error('private provider detail'); } } });
  const result = await app.controller.check({ manual: true });
  assert.equal(result.reason, 'update-unavailable'); assert.equal(app.controller.getState().busy, false);
  assert.equal(JSON.stringify(result).includes('private'), false);
});

test('an unsupported native result cannot trigger start or completion', async () => {
  const app = harness();
  app.setState({ supported: false, status: 'available' }); await app.controller.start();
  app.setState({ supported: false, status: 'downloaded' }); await app.controller.complete();
  assert.deepEqual(app.calls, ['state', 'state']);
});

test('a different downloaded version after the challenge cannot complete', async () => {
  let reads = 0;
  const app = harness({ platform: { getUpdateState: async () => ({ supported: true, status: 'downloaded', availableVersionCode: ++reads }) } });
  assert.equal((await app.controller.complete()).reason, 'update-version-changed');
  assert.equal(app.calls.some(value => typeof value === 'object'), false);
});

test('the bridge must return the same verified receipt string instead of an unverified envelope', async () => {
  const valid = harness({ platform: { getStorageReceipt: async () => 'verified-storage-receipt' } });
  assert.equal((await valid.controller.complete()).status, 'installing');
  const invalid = harness({ platform: { getStorageReceipt: async () => null } });
  assert.equal((await invalid.controller.complete()).reason, 'storage-changed');
  assert.equal(invalid.calls.some(value => typeof value === 'object'), false);
});

test('dismiss suppresses the same version notification until a manual check', async () => {
  const app = harness(); await app.controller.check({}); await app.controller.dismiss();
  app.emit({ supported: true, status: 'available', availableVersionCode: 2, shouldNotify: true });
  assert.equal(app.controller.getState().shouldNotify, false);
  await app.controller.check({ manual: true }); assert.equal(app.controller.getState().shouldNotify, true);
});

test('dispose ignores late listeners and delayed check results', async () => {
  const check = deferred(); const app = harness({ platform: { checkForUpdate: () => check.promise } });
  const pending = app.controller.check({}); await new Promise(resolve => setImmediate(resolve));
  const count = app.notifications.length; app.controller.dispose(); app.emit({ status: 'downloaded' });
  check.resolve({ status: 'available' }); await pending;
  assert.equal(app.notifications.length, count);
  assert.equal(app.calls.includes('unsubscribe'), true);
});

test('immediate teardown cancels a queued check before it calls the native bridge', async () => {
  const app = harness(); const pending = app.controller.check({});
  app.controller.dispose(); await pending;
  assert.deepEqual(app.calls, ['unsubscribe']);
});
