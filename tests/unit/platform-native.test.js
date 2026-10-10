const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { transformSync } = require('esbuild');

const source = fs.readFileSync(require.resolve('../../app/platform-native.js'), 'utf8');
const compiled = transformSync(source, { format: 'cjs', platform: 'node', target: 'es2020' }).code;
const copy = value => JSON.parse(JSON.stringify(value));

test('native share URLs use the existing verified v1 tactics viewer', () => {
  assert.equal(harness().platform.publicShareBase, 'https://jaywapp.github.io/squad-maker/');
});

function savedState(overrides = {}) {
  return { ready: true, revision: 4, savedRevision: 4, export: { busy: false }, busy: { mutation: false },
    view: { readOnly: false }, localLibrary: { fileId: 'file-one' }, ...overrides };
}

function harness(options = {}) {
  const calls = [];
  const events = new Map();
  let state = options.state || savedState();
  const document = {
    documentElement: { inert: false },
    querySelector(selector) {
      if (selector === '.dlg [data-r="0"]' && options.dialog)
        return { click: () => calls.push({ method: 'dialog-cancel' }) };
      if (options.modal === selector) return { getClientRects: () => options.hiddenModal ? [] : [{}] };
      return null;
    }
  };
  const window = {
    SquadMakerContract: {
      getState: () => state,
      async run(operation) {
        calls.push({ method: 'run', operation, inert: document.documentElement.inert });
        return options.run ? options.run(operation) : { status: 'success', code: null };
      }
    },
    SquadUi: { closeTopLayer: () => { calls.push({ method: 'ui-close' }); return Boolean(options.uiLayer); } }
  };
  for (const close of ['closeShare', 'closePlayerView', 'closeHelp', 'closeFeedback'])
    window[close] = () => calls.push({ method: close });
  const App = {
    async getInfo() {
      calls.push({ method: 'app-info' });
      if (options.infoError) throw options.infoError;
      return options.info || { name: 'Squad Maker', id: 'com.jaywapp.squadmaker.preview',
        version: '0.1.0.main.150.27a34ca9', build: '1152' };
    },
    addListener(event, listener) { events.set(event, listener); return Promise.resolve({ remove() {} }); },
    async exitApp() {
      calls.push({ method: 'exit', inert: document.documentElement.inert });
      if (options.exitError) throw options.exitError;
    }
  };
  const plugins = {
    SquadStorage: {
      async read(payload) {
        calls.push({ method: 'storage-read', payload: copy(payload) });
        return options.read ? options.read(payload) : { value: null };
      },
      async commit(payload) {
        calls.push({ method: 'storage-commit', payload: copy(payload) });
        return options.commit ? options.commit(payload) : { status: 'success' };
      }
    },
    SquadDocuments: {
      async save(payload) {
        calls.push({ method: 'document-save', payload: copy(payload) });
        return options.save ? options.save(payload) : { status: 'success' };
      },
      async stage(payload) {
        calls.push({ method: 'document-stage', payload: copy(payload) });
        return options.stage ? options.stage(payload) : { uri: 'file:///cache/squad-exports/result.gif' };
      }
    },
    SquadAds: {
      async showTestBanner() { calls.push({ method: 'ads-show' }); return { status: 'loading', testOnly: true }; },
      async getState() { calls.push({ method: 'ads-state' }); return { status: 'loaded', testOnly: true }; }
    }
  };
  const Share = { async share(payload) {
    calls.push({ method: 'share', payload: copy(payload) });
    return options.share ? options.share(payload) : { activityType: 'test.receiver' };
  } };
  const modules = {
    '@capacitor/core': { Capacitor: { isNativePlatform: () => options.native !== false },
      registerPlugin: name => plugins[name] },
    '@capacitor/app': { App }, '@capacitor/share': { Share }
  };
  const context = vm.createContext({ window, document, module: { exports: {} }, exports: {},
    require(name) { assert.ok(modules[name], 'Unexpected dependency: ' + name); return modules[name]; },
    btoa: value => Buffer.from(value, 'binary').toString('base64'), Uint8Array });
  vm.runInContext(compiled, context, { filename: 'app/platform-native.js' });
  return {
    platform: window.SquadPlatform, calls, document, events,
    setState: value => { state = value; },
    back: () => events.get('backButton')(),
    appState: isActive => events.get('appStateChange')({ isActive }),
    count: method => calls.filter(call => call.method === method).length
  };
}

test('native back cancels confirmation before closing layers or saving', async () => {
  const app = harness({ dialog: true, uiLayer: true }); await app.back();
  assert.equal(app.count('dialog-cancel'), 1); assert.equal(app.count('ui-close'), 0);
  assert.equal(app.count('run'), 0); assert.equal(app.count('exit'), 0);
  assert.equal(app.document.documentElement.inert, false);
});

test('native back closes the UI top layer before saving', async () => {
  const app = harness({ uiLayer: true }); await app.back();
  assert.equal(app.count('ui-close'), 1); assert.equal(app.count('run'), 0); assert.equal(app.count('exit'), 0);
});

for (const [modal, close] of [['#shareModal', 'closeShare'], ['#playerViewModal', 'closePlayerView'],
  ['#helpModal', 'closeHelp'], ['#feedbackModal', 'closeFeedback']]) {
  test('native back closes visible ' + modal + ' without saving or exiting', async () => {
    const app = harness({ modal }); await app.back();
    assert.equal(app.count(close), 1); assert.equal(app.count('run'), 0); assert.equal(app.count('exit'), 0);
  });
}

test('a hidden legacy modal does not intercept native back', async () => {
  const app = harness({ modal: '#shareModal', hiddenModal: true }); await app.back();
  assert.equal(app.count('closeShare'), 0); assert.equal(app.count('run'), 1); assert.equal(app.count('exit'), 1);
});

for (const [label, state] of [
  ['not ready', savedState({ ready: false })],
  ['export busy', savedState({ export: { busy: true } })],
  ['mutation busy', savedState({ busy: { mutation: true } })]
]) test('native back cannot save or exit while ' + label, async () => {
  const app = harness({ state }); await app.back();
  assert.equal(app.count('run'), 0); assert.equal(app.count('exit'), 0);
  assert.equal(app.document.documentElement.inert, false);
});

test('native back locks the document while saving and suppresses repeated back requests', async () => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const app = harness({ run: () => pending }); const first = app.back();
  assert.equal(app.document.documentElement.inert, true); assert.equal(app.count('run'), 1);
  await app.back(); assert.equal(app.count('run'), 1); assert.equal(app.count('exit'), 0);
  finish({ status: 'success', code: null }); await first;
  assert.equal(app.count('exit'), 1); assert.equal(app.calls.find(call => call.method === 'exit').inert, true);
});

test('a successful save of an older revision unlocks without exiting', async () => {
  let app;
  app = harness({ run: async () => { app.setState(savedState({ revision: 5, savedRevision: 4 })); return { status: 'success' }; } });
  await app.back(); assert.equal(app.count('exit'), 0); assert.equal(app.document.documentElement.inert, false);
});

for (const [label, latest] of [
  ['export', savedState({ export: { busy: true } })], ['mutation', savedState({ busy: { mutation: true } })]
]) test('native back rechecks ' + label + ' busy after storage resolves', async () => {
  let app;
  app = harness({ run: async () => { app.setState(latest); return { status: 'success' }; } });
  await app.back(); assert.equal(app.count('exit'), 0); assert.equal(app.document.documentElement.inert, false);
});

test('the latest successfully stored revision permits exit with editing inert', async () => {
  let app;
  app = harness({ state: savedState({ savedRevision: 3 }), run: async () => {
    app.setState(savedState()); return { status: 'success' };
  } });
  await app.back(); assert.equal(app.count('exit'), 1); assert.equal(app.document.documentElement.inert, true);
  assert.equal(app.calls.find(call => call.method === 'run').operation, 'retry-save');
});

for (const [label, run] of [
  ['storage error', async () => ({ status: 'error', code: 'storage-unavailable' })],
  ['rejected save', async () => { throw new Error('native unavailable'); }]
]) test('native back unlocks editing and permits retry after ' + label, async () => {
  const app = harness({ run }); await app.back();
  assert.equal(app.count('exit'), 0); assert.equal(app.document.documentElement.inert, false);
  await app.back(); assert.equal(app.count('run'), 2);
});

test('an exit rejection unlocks editing for another attempt', async () => {
  const app = harness({ exitError: new Error('Activity unavailable') }); await app.back();
  assert.equal(app.count('exit'), 1); assert.equal(app.document.documentElement.inert, false);
  await app.back(); assert.equal(app.count('run'), 2);
});

test('no-active-file permits exit only when the latest library is actually empty', async () => {
  const empty = harness({ state: savedState({ localLibrary: { fileId: null } }),
    run: async () => ({ status: 'error', code: 'no-active-file' }) });
  await empty.back(); assert.equal(empty.count('exit'), 1);
  const occupied = harness({ run: async () => ({ status: 'error', code: 'no-active-file' }) });
  await occupied.back(); assert.equal(occupied.count('exit'), 0); assert.equal(occupied.document.documentElement.inert, false);
});

test('app resume unlocks an exiting document and background requests a save', async () => {
  const app = harness(); await app.back(); assert.equal(app.document.documentElement.inert, true);
  app.appState(true); assert.equal(app.document.documentElement.inert, false);
  await app.back(); assert.equal(app.count('exit'), 2);
  app.appState(false); assert.equal(app.count('run'), 3);
});

test('read-only native back exits without requesting a write', async () => {
  const app = harness({ state: savedState({ view: { readOnly: true } }) }); await app.back();
  assert.equal(app.count('exit'), 1); assert.equal(app.count('run'), 0);
});

for (const [filename, mimeType, bytes] of [
  ['backup.sq', 'application/json', Buffer.from(JSON.stringify({ v: 1, team: '한글 FC' }), 'utf8')],
  ['pitch.png', 'image/png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.from([0, 128, 255])])],
  ['pattern.gif', 'image/gif', Buffer.concat([Buffer.from('GIF89a'), Buffer.from(Array.from({ length: 70000 }, (_, index) => index % 256))])]
]) test('SAF forwards exact ' + filename + ' bytes, filename and allowed MIME metadata', async () => {
  const app = harness(); const result = await app.platform.exportFile(new Blob([bytes]), filename, mimeType);
  assert.deepEqual(copy(result), { status: 'success', code: null, completion: 'file-saved' });
  const payload = app.calls.find(call => call.method === 'document-save').payload;
  assert.equal(payload.filename, filename); assert.equal(payload.mimeType, mimeType);
  assert.deepEqual(Buffer.from(payload.data, 'base64'), bytes);
  assert.equal(app.count('document-stage'), 0); assert.equal(app.count('share'), 0);
});

test('SAF cancellation is distinct from failure and does not claim file completion', async () => {
  const app = harness({ save: async () => ({ status: 'cancelled' }) });
  const result = await app.platform.exportFile(new Blob(['original']), 'backup.sq', 'application/json');
  assert.deepEqual(copy(result), { status: 'cancelled', code: null, completion: null });
});

test('SAF rejection reports export failure without reporting success', async () => {
  const app = harness({ save: async () => { throw { code: 'file-write-failed', message: 'Document write failed' }; } });
  const result = await app.platform.exportFile(new Blob(['original']), 'backup.sq', 'application/json');
  assert.deepEqual(copy(result), { status: 'error', code: 'export-failed', completion: null });
});

test('share stages exact bytes and forwards only the returned file URI to the OS adapter', async () => {
  const bytes = Buffer.from([0, 10, 127, 128, 255]); const app = harness();
  const result = await app.platform.exportFile(new Blob([bytes]), 'pattern.gif', 'image/gif', 'share');
  const payload = app.calls.find(call => call.method === 'document-stage').payload;
  assert.deepEqual(Buffer.from(payload.data, 'base64'), bytes); assert.equal(payload.mimeType, 'image/gif');
  assert.equal(payload.filename, 'pattern.gif');
  assert.deepEqual(app.calls.find(call => call.method === 'share').payload,
    { title: 'pattern.gif', files: ['file:///cache/squad-exports/result.gif'] });
  assert.deepEqual(copy(result), { status: 'success', code: null, completion: 'share-sheet-finished' });
  assert.equal(app.count('document-save'), 0);
});

test('Share cancellation is a neutral cancelled result', async () => {
  const app = harness({ share: async () => { throw new Error('Share canceled'); } });
  const result = await app.platform.exportFile(new Blob(['GIF89a']), 'pattern.gif', 'image/gif', 'share');
  assert.deepEqual(copy(result), { status: 'cancelled', code: null, completion: null });
});

test('a stage failure prevents any Share invocation', async () => {
  const app = harness({ stage: async () => { throw new Error('Cache unavailable'); } });
  const result = await app.platform.exportFile(new Blob(['GIF89a']), 'pattern.gif', 'image/gif', 'share');
  assert.equal(result.status, 'error'); assert.equal(result.code, 'export-failed'); assert.equal(app.count('share'), 0);
});

test('a Share receiver failure differs from cancellation', async () => {
  const app = harness({ share: async () => { throw new Error('Receiver unavailable'); } });
  const result = await app.platform.exportFile(new Blob(['GIF89a']), 'pattern.gif', 'image/gif', 'share');
  assert.deepEqual(copy(result), { status: 'error', code: 'export-failed', completion: null });
});

test('blob read failures cannot reach a document or share plugin', async () => {
  const app = harness(); const result = await app.platform.exportFile({ arrayBuffer: async () => { throw new Error('Blob lost'); } },
    'pitch.png', 'image/png');
  assert.equal(result.status, 'error'); assert.equal(app.count('document-save'), 0); assert.equal(app.count('document-stage'), 0);
});

test('storage forwards expected CAS originals and null removals in one batch', async () => {
  const app = harness(); const values = { 'squad-maker-library-v1': '{"version":1}', 'squad-maker-v1': null };
  const expected = { 'squad-maker-library-v1': 'previous library', 'squad-maker-v1': '{"v":1}' };
  await app.platform.storage.commitBatch(values, expected);
  assert.deepEqual(app.calls.find(call => call.method === 'storage-commit').payload, { values, expected });
  assert.deepEqual(values, { 'squad-maker-library-v1': '{"version":1}', 'squad-maker-v1': null });
});

test('storage single-key writes and removals preserve raw string and null semantics', async () => {
  const app = harness({ read: async () => ({ value: '{"v":1}' }) });
  assert.equal(await app.platform.storage.getItem('squad-maker-v1'), '{"v":1}');
  await app.platform.storage.setItem('squad-maker-v1', '{"v":1}'); await app.platform.storage.removeItem('squad-maker-v1');
  const commits = app.calls.filter(call => call.method === 'storage-commit');
  assert.deepEqual(commits[0].payload, { values: { 'squad-maker-v1': '{"v":1}' }, expected: {} });
  assert.deepEqual(commits[1].payload, { values: { 'squad-maker-v1': null }, expected: {} });
  assert.equal(await harness({ read: async () => ({}) }).platform.storage.getItem('missing'), null);
});

test('storage exposes only allowed string error codes and sanitizes numeric DOMException codes', async () => {
  for (const code of ['storage-conflict', 'storage-quota', 'storage-verification', 'invalid-input', 'file-write-failed', 18, 22, 'untrusted-detail']) {
    const expected = typeof code === 'string' && code !== 'untrusted-detail' ? code : 'storage-unavailable';
    const app = harness({ read: async () => { throw { code, name: 'SecurityError', message: 'private diagnostic' }; },
      commit: async () => { throw { code, message: 'private diagnostic' }; } });
    for (const action of [() => app.platform.storage.getItem('squad-maker-v1'),
      () => app.platform.storage.commitBatch({ 'squad-maker-v1': null }, { 'squad-maker-v1': 'old' }),
      () => app.platform.storage.setItem('squad-maker-v1', 'new'), () => app.platform.storage.removeItem('squad-maker-v1')]) {
      await assert.rejects(action, error => error.code === expected && typeof error.code === 'string' && error.message === 'Native operation failed');
    }
  }
});

test('test advertisement facade returns plugin states without storage writes', async () => {
  const app = harness(); assert.deepEqual(copy(await app.platform.showTestAd()), { status: 'loading', testOnly: true });
  assert.deepEqual(copy(await app.platform.getAdState()), { status: 'loaded', testOnly: true });
  assert.equal(app.count('storage-commit'), 0); assert.equal(app.count('document-save'), 0);
});

test('web evaluation registers no native listeners and cannot access native storage or export', async () => {
  const app = harness({ native: false }); assert.equal(app.events.size, 0); assert.equal(app.platform.storage, null);
  assert.deepEqual(copy(await app.platform.exportFile(new Blob(['data']), 'backup.sq', 'application/json')),
    { status: 'unsupported', code: 'native-unavailable' });
  assert.deepEqual(copy(await app.platform.showTestAd()), { status: 'unsupported' });
  assert.deepEqual(copy(await app.platform.getAdState()), { status: 'unsupported' });
  assert.equal(app.calls.length, 0); assert.equal(Object.isFrozen(app.platform), true);
});

for (const destination of ['save', 'share']) {
  test('native ' + destination + ' bounds long filename metadata without truncating file bytes', async () => {
    const app = harness();
    const bytes = Buffer.from('original snapshot content');
    const result = await app.platform.exportFile(new Blob([bytes]), '../' + 'x'.repeat(1200000) + '.sq', 'application/json', destination);
    assert.equal(result.status, 'success');
    const staged = app.calls.find(call => call.method === (destination === 'save' ? 'document-save' : 'document-stage')).payload;
    assert.ok(staged.filename.length <= 160);
    assert.equal(staged.filename.includes('/'), false);
    assert.deepEqual(Buffer.from(staged.data, 'base64'), bytes);
    if (destination === 'share') assert.ok(app.calls.find(call => call.method === 'share').payload.title.length <= 160);
  });
}


test('native app metadata comes from the installed APK through Capacitor App', async () => {
  const app = harness();
  const info = await app.platform.getAppInfo();
  assert.deepEqual(copy(info), { name: 'Squad Maker', id: 'com.jaywapp.squadmaker.preview',
    version: '0.1.0.main.150.27a34ca9', build: '1152' });
  assert.equal(app.count('app-info'), 1);
  assert.equal(Object.isFrozen(info), true);
  assert.equal(app.count('storage-commit'), 0);
});

test('missing APK metadata and plugin failures return a safe error rather than a stale beta version', async () => {
  for (const options of [{ info: { name: 'Squad Maker', id: 'com.jaywapp.squadmaker.preview', version: '', build: '1152' } },
    { info: { name: 'Squad Maker', id: 'com.jaywapp.squadmaker.preview', version: '0.1.0', build: 1152 } },
    { infoError: new Error('private plugin error') }]) {
    const app = harness(options);
    await assert.rejects(app.platform.getAppInfo(), error => error.code === 'app-info-unavailable'
      && error.message === 'App metadata unavailable');
  }
});

test('web app metadata does not invoke a native plugin', async () => {
  const app = harness({ native: false });
  assert.equal(await app.platform.getAppInfo(), null);
  assert.equal(app.count('app-info'), 0);
});
