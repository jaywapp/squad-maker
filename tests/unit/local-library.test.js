const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createLibrary } = require('../../app/local-library');
const fixture = require('../fixtures/snapshot-v1.json');

const KEY = 'squad-maker-library-v1';
const LEGACY = 'squad-maker-v1';
const copy = value => JSON.parse(JSON.stringify(value));
function snapshot(team = 'First') { return { ...copy(fixture), team }; }
function validate(value) {
  assert.equal(value.v, 1);
  assert.ok(Array.isArray(value.roster));
  assert.ok(value.squads && value.pat);
  return value;
}
function store(seed = {}, asyncMode = false) {
  const values = new Map(Object.entries(seed));
  const writes = [];
  const storage = {
    values, writes,
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => { writes.push([key, value]); values.set(key, value); },
    removeItem: key => { writes.push([key, null]); values.delete(key); }
  };
  if (asyncMode) for (const method of ['getItem', 'setItem', 'removeItem']) {
    const original = storage[method]; storage[method] = async (...args) => original(...args);
  }
  return storage;
}
function library(storage, extra = {}) {
  let counter = 0;
  return createLibrary({ storage, validateSnapshot: validate, idFactory: kind => kind + '-' + ++counter,
    now: () => 1700000000000, ...extra });
}
async function initialized(extra = {}) {
  const storage = store(); const instance = library(storage, extra);
  assert.equal((await instance.initialize({ initialSnapshot: snapshot() })).status, 'success');
  return { storage, instance };
}
function raw(storage) { return [...storage.values]; }
function data(instance) { const state = instance.getState(); delete state.storage; return state; }

test('UMD exposes the browser API without CommonJS', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(require.resolve('../../app/local-library'), 'utf8'), context);
  assert.equal(typeof context.SquadLibrary.createLibrary, 'function');
});

test('first initialization migrates valid legacy and retains its key', async () => {
  const legacy = JSON.stringify(snapshot('Legacy'));
  const storage = store({ [LEGACY]: legacy }); const instance = library(storage);
  const result = await instance.initialize({ initialSnapshot: snapshot('Default') });
  assert.equal(result.status, 'success'); assert.equal(result.value.snapshot.team, 'Legacy');
  assert.equal(storage.values.get(LEGACY), legacy);
  assert.equal(instance.getState().teams.length, 1); assert.equal(instance.getState().files.length, 1);
  assert.equal(instance.getState().slots.policy, 'preview-unlimited');
  assert.equal(instance.getState().slots.limit, null);
});

test('reinitialization preserves teams, files, active selection and edits', async () => {
  const { storage, instance } = await initialized();
  const first = instance.getState().files[0].id;
  const team = (await instance.createTeam('Second team')).value.team;
  const added = (await instance.createFile({ teamId: team.id, name: 'Second file', snapshot: snapshot('Second') })).value.file;
  await instance.saveActive(snapshot('Edited')); await instance.openFile(first);
  const restored = library(storage);
  assert.equal((await restored.initialize()).status, 'success');
  assert.equal(restored.getState().teams.length, 2); assert.equal(restored.getState().files.length, 2);
  assert.equal(restored.getState().activeFileId, first);
  assert.equal(restored.getState().files.find(file => file.id === added.id).snapshot.team, 'Edited');
});

test('saving and renaming do not consume slots and synchronize the active mirror', async () => {
  const { storage, instance } = await initialized({ policy: { limit: 1 } });
  const file = instance.getState().files[0]; const team = instance.getState().teams[0];
  assert.equal((await instance.saveActive(snapshot('Updated'))).status, 'success');
  await instance.renameFile(file.id, 'Renamed'); await instance.renameTeam(team.id, 'Coaches');
  assert.equal(instance.getState().files.length, 1); assert.equal(instance.getState().files[0].revision, 2);
  assert.equal(instance.getState().teams[0].name, 'Coaches');
  assert.equal(JSON.parse(storage.values.get(LEGACY)).team, 'Updated');
  assert.equal(instance.getState().slots.policy, 'test-only');
});

test('explicit test limit enforces new files and deletion immediately frees capacity', async () => {
  const { instance } = await initialized({ policy: { limit: 2 } });
  const teamId = instance.getState().teams[0].id;
  const second = await instance.createFile({ teamId, name: 'Two', snapshot: snapshot('Two') });
  const before = data(instance);
  assert.equal((await instance.createFile({ teamId, name: 'Three', snapshot: snapshot() })).code, 'slots-full');
  assert.deepEqual(data(instance), before);
  await instance.deleteFile(second.value.file.id);
  assert.equal(instance.getState().slots.status, 'available');
  assert.equal((await instance.createFile({ teamId, name: 'Three', snapshot: snapshot() })).status, 'success');
  assert.equal(instance.getState().slots.used, 2);
});

test('undo deletion retains files created later and only restores removed files', async () => {
  const { instance } = await initialized();
  const first = instance.getState().files[0];
  await instance.deleteFile(first.id);
  const second = (await instance.createFile({ teamId: first.teamId, name: 'Later', snapshot: snapshot('Later') })).value.file;
  assert.equal((await instance.undoDelete()).status, 'success');
  assert.equal(instance.getState().files.length, 2); assert.equal(instance.getState().activeFileId, second.id);
  assert.equal(instance.getState().files.find(file => file.id === first.id).snapshot.team, 'First');
  assert.equal((await instance.undoDelete()).code, 'undo-unavailable');
});

test('full undo fails without removing a newly created file or losing recovery', async () => {
  const { instance, storage } = await initialized({ policy: { limit: 1 } });
  const first = instance.getState().files[0]; await instance.deleteFile(first.id);
  assert.equal(instance.getState().undoDeleteAvailable, true);
  const later = (await instance.createFile({ teamId: first.teamId, name: 'Later', snapshot: snapshot() })).value.file;
  const before = data(instance); const beforeRaw = raw(storage);
  assert.equal((await instance.undoDelete()).code, 'slots-full');
  assert.equal(instance.getState().undoDeleteAvailable, true);
  assert.deepEqual(data(instance), before); assert.deepEqual(raw(storage), beforeRaw);
  await instance.deleteFile(later.id);
  assert.equal((await instance.undoDelete()).status, 'success');
  assert.equal(instance.getState().undoDeleteAvailable, false);
  assert.equal(instance.getState().files[0].id, later.id);
});

test('team deletion and undo restore its files while preserving unrelated teams', async () => {
  const { instance } = await initialized();
  const firstTeam = instance.getState().teams[0];
  await instance.createFile({ teamId: firstTeam.id, name: 'Two', snapshot: snapshot('Two') });
  const other = (await instance.createTeam('Other')).value.team;
  const otherFile = (await instance.createFile({ teamId: other.id, name: 'Other', snapshot: snapshot('Other') })).value.file;
  await instance.deleteTeam(firstTeam.id);
  assert.equal(instance.getState().undoDeleteAvailable, true);
  assert.equal(instance.getState().files.length, 1);
  assert.equal((await instance.undoDelete()).status, 'success');
  assert.equal(instance.getState().undoDeleteAvailable, false);
  assert.equal(instance.getState().files.length, 3); assert.equal(instance.getState().teams.length, 2);
  assert.equal(instance.getState().activeFileId, otherFile.id);
});

test('deleting the last file leaves no active file and autosave never recreates it', async () => {
  const { instance, storage } = await initialized(); await instance.deleteFile(instance.getState().activeFileId);
  const before = raw(storage);
  assert.equal(instance.getState().activeFileId, null); assert.equal(storage.values.has(LEGACY), false);
  assert.equal((await instance.saveActive(snapshot())).code, 'no-active-file');
  assert.equal(instance.getState().files.length, 0); assert.deepEqual(raw(storage), before);
  assert.equal((await instance.undoDelete()).status, 'success');
  assert.equal(instance.getState().files.length, 1);
});

test('legacy mirror seed updates only active file and retains one previous snapshot', async () => {
  const { instance, storage } = await initialized();
  const first = instance.getState().files[0];
  const other = (await instance.createFile({ teamId: first.teamId, name: 'Other', snapshot: snapshot('Other') })).value.file;
  await instance.openFile(first.id); storage.values.set(LEGACY, JSON.stringify(snapshot('Web seed')));
  const restored = library(storage); assert.equal((await restored.initialize()).status, 'success');
  const state = restored.getState();
  assert.equal(state.files.find(file => file.id === first.id).snapshot.team, 'Web seed');
  assert.equal(state.files.find(file => file.id === other.id).snapshot.team, 'Other');
  assert.equal(state.legacyRecovery.snapshot.team, 'First');
  assert.equal(state.legacyRecovery.fileId, first.id);
});

for (const [label, container, legacy] of [
  ['corrupt container', '{', JSON.stringify(snapshot())],
  ['future container', JSON.stringify({ version: 2 }), JSON.stringify(snapshot())],
  ['corrupt legacy', null, '{'],
  ['future legacy', null, JSON.stringify({ ...snapshot(), v: 2 })],
  ['invalid legacy structure', null, JSON.stringify({ v: 1 })]
]) test(label + ' blocks default writes and preserves original bytes', async () => {
  const seed = { [LEGACY]: legacy }; if (container !== null) seed[KEY] = container;
  const storage = store(seed); const before = raw(storage); const instance = library(storage);
  assert.equal((await instance.initialize({ initialSnapshot: snapshot() })).status, 'error');
  assert.equal(instance.getState().storage.status, 'blocked');
  assert.equal((await instance.createTeam('New')).status, 'error');
  assert.deepEqual(raw(storage), before); assert.equal(storage.writes.length, 0);
});

test('read-only initialization and every command perform zero writes', async () => {
  const storage = store({ [LEGACY]: JSON.stringify(snapshot('Read only')) }); const instance = library(storage);
  await instance.initialize({ readOnly: true });
  const state = instance.getState(); const file = state.files[0]; const team = state.teams[0];
  const results = await Promise.all([instance.saveActive(snapshot()), instance.createTeam('New'),
    instance.createFile({ teamId: team.id, name: 'New', snapshot: snapshot() }), instance.renameTeam(team.id, 'New'),
    instance.renameFile(file.id, 'New'), instance.openFile(file.id), instance.deleteFile(file.id),
    instance.deleteTeam(team.id), instance.undoDelete(), instance.recoverSnapshot(snapshot())]);
  assert.ok(results.every(result => result.code === 'read-only'));
  assert.equal(storage.writes.length, 0); assert.deepEqual(instance.getState(), state);
});

test('states, input snapshots and result objects cannot mutate library data', async () => {
  const { instance } = await initialized(); const incoming = snapshot('Protected');
  const result = await instance.saveActive(incoming); incoming.roster[0].name = 'Input mutation';
  result.value.snapshot.roster[0].name = 'Result mutation'; result.state.files.length = 0;
  const state = instance.getState(); state.files[0].snapshot.team = 'State mutation';
  assert.equal(instance.getState().files[0].snapshot.team, 'Protected');
  assert.equal(instance.getState().files[0].snapshot.roster[0].name, fixture.roster[0].name);
});

test('MAX_SAFE_INTEGER player IDs and position/instruction keys survive save and reload', async () => {
  const special = snapshot(); const id = Number.MAX_SAFE_INTEGER;
  special.roster[0].id = id;
  for (const squad of Object.values(special.squads)) {
    squad.pos[id] = squad.pos[1]; delete squad.pos[1]; squad.pn[id] = 'Keep this'; delete squad.pn[1];
  }
  const { instance, storage } = await initialized(); await instance.saveActive(special);
  const restored = library(storage); await restored.initialize();
  const value = restored.getState().files[0].snapshot;
  assert.equal(value.roster[0].id, id); assert.equal(value.squads.basic.pn[id], 'Keep this');
  assert.deepEqual(value.squads.basic.pos[id], special.squads.basic.pos[id]);
});

test('async storage and command queue preserve order under concurrent requests', async () => {
  const storage = store({}, true); const instance = library(storage);
  const init = instance.initialize({ initialSnapshot: snapshot() });
  const one = instance.saveActive(snapshot('One')); const two = instance.saveActive(snapshot('Two'));
  const results = await Promise.all([init, one, two]); assert.ok(results.every(result => result.status === 'success'));
  await instance.ready(); assert.equal((await instance.flush()).status, 'success');
  assert.equal(instance.getState().files[0].snapshot.team, 'Two');
  assert.equal(instance.getState().files[0].revision, 2);
});

test('CAS conflict preserves external writes, in-memory document and counters', async () => {
  const { instance, storage } = await initialized(); const before = data(instance);
  storage.values.set(KEY, 'external raw'); const bytes = raw(storage); const count = storage.writes.length;
  const result = await instance.saveActive(snapshot('Lost'));
  assert.equal(result.code, 'storage-conflict'); assert.deepEqual(data(instance), before);
  assert.deepEqual(raw(storage), bytes); assert.equal(storage.writes.length, count);
});

test('quota failure rolls back a partially written container and keeps old snapshot', async () => {
  const { instance, storage } = await initialized(); const before = data(instance); const bytes = raw(storage);
  const original = storage.setItem; let failed = false;
  storage.setItem = (key, value) => {
    if (key === LEGACY && !failed) { failed = true; const error = new Error('quota'); error.name = 'QuotaExceededError'; throw error; }
    original(key, value);
  };
  assert.equal((await instance.saveActive(snapshot('Failed'))).code, 'storage-quota');
  assert.deepEqual(data(instance), before); assert.deepEqual(raw(storage), bytes);
  assert.equal(instance.getState().storage.retryable, true);
  assert.equal((await instance.saveActive(snapshot('Retry'))).status, 'success');
});

test('readback failure is detected and verified rollback restores both originals', async () => {
  const { instance, storage } = await initialized(); const before = data(instance); const bytes = raw(storage);
  const originalSet = storage.setItem; const originalGet = storage.getItem; let verify = false; let injected = false;
  storage.setItem = (key, value) => { originalSet(key, value); if (key === LEGACY && !injected) { verify = true; injected = true; } };
  storage.getItem = key => {
    if (verify && key === KEY) { verify = false; throw new Error('read unavailable'); }
    return originalGet(key);
  };
  assert.equal((await instance.saveActive(snapshot('Failed'))).code, 'storage-unavailable');
  assert.deepEqual(data(instance), before); assert.deepEqual(raw(storage), bytes);
});

test('unverifiable rollback blocks future commands without overwriting unknown data', async () => {
  const { instance, storage } = await initialized(); const before = data(instance);
  const original = storage.setItem;
  storage.setItem = (key, value) => {
    original(key, value);
    if (key === LEGACY) { storage.values.set(KEY, 'unknown concurrent raw'); throw new Error('write failed'); }
  };
  assert.equal((await instance.saveActive(snapshot('Failed'))).code, 'storage-rollback-failed');
  assert.equal(instance.getState().storage.status, 'blocked'); assert.deepEqual(data(instance), before);
  const bytes = raw(storage); assert.equal((await instance.deleteFile(instance.getState().activeFileId)).status, 'error');
  assert.deepEqual(raw(storage), bytes);
});

test('optional commitBatch writes container and mirror in one CAS transaction', async () => {
  const storage = store(); const batches = [];
  storage.commitBatch = async (values, expected) => {
    batches.push({ values: copy(values), expected: copy(expected) });
    for (const key of [KEY, LEGACY]) if (storage.getItem(key) !== expected[key]) throw Object.assign(new Error('conflict'), { code: 'storage-conflict' });
    for (const [key, value] of Object.entries(values)) if (value === null) storage.values.delete(key); else storage.values.set(key, value);
  };
  const instance = library(storage); await instance.initialize({ initialSnapshot: snapshot() });
  await instance.saveActive(snapshot('Atomic')); await instance.deleteFile(instance.getState().activeFileId);
  assert.equal(batches.length, 3); assert.equal(storage.writes.length, 0);
  assert.equal(batches[0].expected[KEY], null); assert.equal(batches[0].expected[LEGACY], null);
  assert.equal(batches[2].values[LEGACY], null); assert.equal(instance.getState().files.length, 0);
});

test('failed atomic commit preserves original bytes and does not spend capacity', async () => {
  const { instance, storage } = await initialized({ policy: { limit: 2 } });
  const before = data(instance); const bytes = raw(storage);
  storage.commitBatch = async () => { throw new Error('disk unavailable'); };
  assert.equal((await instance.createFile({ teamId: instance.getState().teams[0].id, name: 'New', snapshot: snapshot() })).status, 'error');
  assert.deepEqual(data(instance), before); assert.deepEqual(raw(storage), bytes);
});

test('opaque ID collisions reject creation and undo without replacing existing objects', async () => {
  const storage = store(); const ids = ['team-a', 'file-a', 'file-b', 'file-a'];
  const instance = library(storage, { idFactory: () => ids.length ? ids.shift() : 'file-a' });
  await instance.initialize({ initialSnapshot: snapshot() }); const first = instance.getState().files[0];
  await instance.deleteFile(first.id);
  await instance.createFile({ teamId: first.teamId, name: 'Later', snapshot: snapshot() });
  await instance.createFile({ teamId: first.teamId, name: 'Reused id', snapshot: snapshot('New occupant') });
  const before = data(instance); const bytes = raw(storage);
  assert.equal((await instance.undoDelete()).code, 'id-collision'); assert.deepEqual(data(instance), before);
  assert.deepEqual(raw(storage), bytes);
  assert.equal((await instance.createTeam('Collision')).code, 'id-collision');
});

test('invalid snapshot and missing targets preserve storage and counters', async () => {
  const { instance, storage } = await initialized(); const before = data(instance); const bytes = raw(storage);
  const results = await Promise.all([instance.saveActive({ v: 2 }), instance.saveActive({ v: 1 }),
    instance.renameFile('missing', 'Name'), instance.renameTeam('missing', 'Name'), instance.openFile('missing'),
    instance.deleteFile('missing'), instance.deleteTeam('missing'), instance.createTeam(' ')]);
  assert.ok(results.every(result => result.status === 'error')); assert.deepEqual(data(instance), before);
  assert.deepEqual(raw(storage), bytes);
});

test('returned team and file objects cannot mutate stored names or snapshots', async () => {
  const { instance } = await initialized();
  const team = (await instance.createTeam('Protected team')).value.team;
  const result = await instance.createFile({ teamId: team.id, name: 'Protected file', snapshot: snapshot('Protected snapshot') });
  team.name = 'Changed'; result.value.file.name = 'Changed'; result.value.file.snapshot.team = 'Changed';
  assert.equal(instance.getState().teams[1].name, 'Protected team');
  assert.equal(instance.getState().files[1].name, 'Protected file');
  assert.equal(instance.getState().files[1].snapshot.team, 'Protected snapshot');
});

test('a silently dropped mirror write fails verification and restores both originals', async () => {
  const { instance, storage } = await initialized(); const before = data(instance); const bytes = raw(storage);
  const original = storage.setItem; let dropped = false;
  storage.setItem = (key, value) => {
    if (key === LEGACY && !dropped) { dropped = true; return; }
    original(key, value);
  };
  assert.equal((await instance.saveActive(snapshot('Dropped'))).code, 'storage-verification');
  assert.deepEqual(data(instance), before); assert.deepEqual(raw(storage), bytes);
});

test('duplicate library IDs and orphaned files are blocked before writing', async () => {
  const { storage } = await initialized();
  for (const corrupt of [
    value => { value.teams.push(copy(value.teams[0])); },
    value => { value.files[0].teamId = 'orphan'; },
    value => { value.activeFileId = 'missing'; }
  ]) {
    const value = JSON.parse(storage.values.get(KEY)); corrupt(value);
    const badStore = store({ [KEY]: JSON.stringify(value), [LEGACY]: storage.values.get(LEGACY) });
    const before = raw(badStore); const restored = library(badStore);
    assert.equal((await restored.initialize({ initialSnapshot: snapshot() })).status, 'error');
    assert.equal(restored.getState().storage.status, 'blocked');
    assert.deepEqual(raw(badStore), before); assert.equal(badStore.writes.length, 0);
  }
});

test('failed deletion preserves file count, mirror and prior undo record', async () => {
  const { instance, storage } = await initialized();
  const first = instance.getState().files[0];
  const second = (await instance.createFile({ teamId: first.teamId, name: 'Second', snapshot: snapshot('Second') })).value.file;
  await instance.deleteFile(first.id);
  const before = data(instance); const bytes = raw(storage);
  const original = storage.removeItem; let failed = false;
  storage.removeItem = key => { if (!failed) { failed = true; throw new Error('remove failure'); } original(key); };
  assert.equal((await instance.deleteFile(second.id)).status, 'error');
  assert.deepEqual(data(instance), before); assert.deepEqual(raw(storage), bytes);
  assert.equal((await instance.undoDelete()).status, 'success');
  assert.ok(instance.getState().files.some(file => file.id === first.id));
  assert.ok(instance.getState().files.some(file => file.id === second.id));
});

test('failed file open preserves active selection and mirror', async () => {
  const { instance, storage } = await initialized(); const first = instance.getState().files[0];
  await instance.createFile({ teamId: first.teamId, name: 'Second', snapshot: snapshot('Second') });
  const before = data(instance); const bytes = raw(storage); const original = storage.setItem; let failed = false;
  storage.setItem = (key, value) => { if (key === LEGACY && !failed) { failed = true; throw new Error('write failure'); } original(key, value); };
  assert.equal((await instance.openFile(first.id)).status, 'error');
  assert.deepEqual(data(instance), before); assert.deepEqual(raw(storage), bytes);
});

test('an empty persisted library stays empty across restart despite a default snapshot', async () => {
  const { instance, storage } = await initialized();
  await instance.deleteFile(instance.getState().activeFileId);
  const restored = library(storage);
  assert.equal((await restored.initialize({ initialSnapshot: snapshot('Default') })).status, 'success');
  assert.equal(restored.getState().files.length, 0); assert.equal(restored.getState().activeFileId, null);
  assert.equal(storage.values.has(LEGACY), false);
  assert.equal((await restored.saveActive(snapshot())).code, 'no-active-file');
  assert.equal((await restored.undoDelete()).code, 'undo-unavailable');
});

test('future snapshots inside a container block writes and preserve every raw record', async () => {
  const { storage } = await initialized(); const value = JSON.parse(storage.values.get(KEY));
  value.files[0].snapshot.v = 2; storage.values.set(KEY, JSON.stringify(value));
  const bytes = raw(storage); storage.writes.length = 0; const restored = library(storage);
  assert.equal((await restored.initialize({ initialSnapshot: snapshot() })).code, 'unsupported-version');
  assert.equal(restored.getState().storage.status, 'blocked');
  assert.deepEqual(raw(storage), bytes); assert.equal(storage.writes.length, 0);
});

test('read-only initialization also preserves valid container and legacy mismatch bytes', async () => {
  const { storage } = await initialized(); storage.values.set(LEGACY, JSON.stringify(snapshot('External seed')));
  const bytes = raw(storage); storage.writes.length = 0; const restored = library(storage);
  assert.equal((await restored.initialize({ readOnly: true })).status, 'success');
  assert.equal(restored.getState().files[0].snapshot.team, 'External seed');
  assert.deepEqual(raw(storage), bytes); assert.equal(storage.writes.length, 0);
});

test('revision overflow rejects edits before writing or changing counters', async () => {
  const { storage } = await initialized(); const value = JSON.parse(storage.values.get(KEY));
  value.files[0].revision = Number.MAX_SAFE_INTEGER; storage.values.set(KEY, JSON.stringify(value));
  const restored = library(storage); await restored.initialize();
  const before = data(restored); const bytes = raw(storage);
  assert.equal((await restored.saveActive(snapshot('Overflow'))).code, 'revision-overflow');
  assert.deepEqual(data(restored), before); assert.deepEqual(raw(storage), bytes);
});

for (const [errorName, numericCode, expectedCode] of [
  ['SecurityError', 18, 'storage-unavailable'], ['QuotaExceededError', 22, 'storage-quota']
]) test(errorName + ' exposes a stable string code after a numeric DOMException', async () => {
  const { instance, storage } = await initialized(); const before = data(instance); const bytes = raw(storage);
  const original = storage.setItem; let injected = false;
  storage.setItem = (key, value) => {
    if (!injected) { injected = true; throw { name: errorName, code: numericCode }; }
    original(key, value);
  };
  const result = await instance.saveActive(snapshot('Failed'));
  assert.equal(result.code, expectedCode); assert.equal(typeof result.code, 'string');
  assert.equal(instance.getState().storage.error, expectedCode);
  assert.deepEqual(data(instance), before); assert.deepEqual(raw(storage), bytes);
});

test('numeric initialization and batch errors never escape as public codes', async () => {
  const storage = store(); const originalGet = storage.getItem;
  storage.getItem = () => { throw { code: 18, name: 'SecurityError' }; };
  const instance = library(storage);
  assert.equal((await instance.initialize({ initialSnapshot: snapshot() })).code, 'storage-unavailable');
  storage.getItem = originalGet;
  storage.commitBatch = async () => ({ status: 'error', code: 18 });
  assert.equal((await instance.recoverSnapshot(snapshot())).code, 'storage-unavailable');
  assert.equal(instance.getState().storage.status, 'blocked');
  assert.equal(storage.values.size, 0);
});

for (const [label, libraryRaw, legacyRaw] of [
  ['corrupt library', '{ original broken bytes', JSON.stringify(snapshot('Old'))],
  ['corrupt legacy', null, '{ original legacy bytes'],
  ['future library', JSON.stringify({ version: 8, teams: ['future data'], files: [1, 2] }), JSON.stringify(snapshot('Old'))]
]) test('explicit recovery preserves ' + label + ' bytes in a new valid container', async () => {
  const seed = { [LEGACY]: legacyRaw }; if (libraryRaw !== null) seed[KEY] = libraryRaw;
  const storage = store(seed); const instance = library(storage);
  await instance.initialize({ initialSnapshot: snapshot() });
  assert.equal(instance.getState().storage.status, 'blocked');
  assert.equal((await instance.saveActive(snapshot('Automatic overwrite'))).status, 'error');
  const result = await instance.recoverSnapshot(snapshot('Confirmed import'));
  assert.equal(result.status, 'success'); assert.equal(result.value.snapshot.team, 'Confirmed import');
  assert.equal(result.state.storage.status, 'saved'); assert.equal(result.state.files.length, 1);
  assert.deepEqual(JSON.parse(storage.values.get(KEY)).rawRecovery, { libraryRaw, legacyRaw });
  assert.equal(JSON.parse(storage.values.get(LEGACY)).team, 'Confirmed import');
  const restored = library(storage); assert.equal((await restored.initialize()).status, 'success');
  assert.deepEqual(restored.getState().rawRecovery, { libraryRaw, legacyRaw });
});

test('explicit recovery preserves other teams and files when legacy is corrupt', async () => {
  const { instance, storage } = await initialized();
  const first = instance.getState().files[0];
  const secondTeam = (await instance.createTeam('Other team')).value.team;
  const second = (await instance.createFile({ teamId: secondTeam.id, name: 'Other file', snapshot: snapshot('Other snapshot') })).value.file;
  const original = JSON.parse(storage.values.get(KEY)); storage.values.set(LEGACY, '{ broken legacy');
  const restored = library(storage); await restored.initialize();
  assert.equal(restored.getState().storage.status, 'blocked');
  assert.equal((await restored.recoverSnapshot(snapshot('Imported'))).status, 'success');
  const state = restored.getState();
  assert.deepEqual(state.teams, original.teams); assert.equal(state.files.length, 2);
  assert.deepEqual(state.files.find(file => file.id === first.id), original.files.find(file => file.id === first.id));
  assert.equal(state.activeFileId, second.id); assert.equal(state.files.find(file => file.id === second.id).snapshot.team, 'Imported');
  assert.equal(state.rawRecovery.libraryRaw, JSON.stringify(original));
  assert.equal(state.rawRecovery.legacyRaw, '{ broken legacy');
});

test('only explicit recovery can create an active file inside an empty library', async () => {
  const { instance, storage } = await initialized(); const first = instance.getState().files[0];
  await instance.deleteFile(first.id);
  assert.equal((await instance.saveActive(snapshot())).code, 'no-active-file');
  const result = await instance.recoverSnapshot(snapshot('Confirmed'));
  assert.equal(result.status, 'success'); assert.equal(instance.getState().files.length, 1);
  assert.equal(instance.getState().teams.length, 1); assert.equal(instance.getState().files[0].teamId, first.teamId);
  assert.equal(JSON.parse(storage.values.get(LEGACY)).team, 'Confirmed');
});

test('explicit recovery on a valid active file does not allocate another slot', async () => {
  const { instance } = await initialized({ policy: { limit: 1 } }); const before = instance.getState().files[0];
  assert.equal((await instance.recoverSnapshot(snapshot('Replacement'))).status, 'success');
  const state = instance.getState(); assert.equal(state.files.length, 1); assert.equal(state.activeFileId, before.id);
  assert.equal(state.files[0].revision, before.revision + 1); assert.equal(state.legacyRecovery.snapshot.team, 'First');
});

test('invalid recovery input cannot replace blocked original bytes', async () => {
  const storage = store({ [KEY]: '{', [LEGACY]: 'broken' }); const instance = library(storage);
  await instance.initialize({ initialSnapshot: snapshot() }); const before = instance.getState(); const bytes = raw(storage);
  assert.equal((await instance.recoverSnapshot({ v: 2 })).code, 'unsupported-version');
  assert.equal((await instance.recoverSnapshot({ v: 1 })).code, 'invalid-snapshot');
  assert.deepEqual(instance.getState(), before); assert.deepEqual(raw(storage), bytes); assert.equal(storage.writes.length, 0);
});

test('recovery read failure preserves blocked originals and exposes stable storage code', async () => {
  const storage = store({ [KEY]: '{', [LEGACY]: 'broken' }); const instance = library(storage);
  await instance.initialize({ initialSnapshot: snapshot() }); const before = data(instance); const bytes = raw(storage);
  storage.getItem = () => { throw { name: 'SecurityError', code: 18 }; };
  assert.equal((await instance.recoverSnapshot(snapshot('Imported'))).code, 'storage-unavailable');
  assert.equal(instance.getState().storage.status, 'blocked'); assert.deepEqual(data(instance), before);
  assert.deepEqual(raw(storage), bytes); assert.equal(storage.writes.length, 0);
});

test('recovery CAS rejects an external change after the captured originals without writing', async () => {
  const storage = store({ [KEY]: '{', [LEGACY]: 'broken' }); const instance = library(storage);
  await instance.initialize({ initialSnapshot: snapshot() }); const before = data(instance);
  const originalGet = storage.getItem; let changed = false;
  storage.getItem = key => {
    const value = originalGet(key);
    if (key === LEGACY && !changed) { changed = true; storage.values.set(KEY, 'external latest original'); }
    return value;
  };
  assert.equal((await instance.recoverSnapshot(snapshot('Imported'))).code, 'storage-conflict');
  assert.equal(instance.getState().storage.status, 'blocked'); assert.deepEqual(data(instance), before);
  assert.equal(storage.values.get(KEY), 'external latest original'); assert.equal(storage.values.get(LEGACY), 'broken');
  assert.equal(storage.writes.length, 0);
});

test('failed recovery rolls back exact corrupt bytes and keeps ordinary writes blocked', async () => {
  const storage = store({ [KEY]: '{ exact library', [LEGACY]: '{ exact legacy' }); const instance = library(storage);
  await instance.initialize({ initialSnapshot: snapshot() }); const before = data(instance); const bytes = raw(storage);
  const originalSet = storage.setItem; let failed = false;
  storage.setItem = (key, value) => {
    if (key === LEGACY && !failed) { failed = true; throw { name: 'QuotaExceededError', code: 22 }; }
    originalSet(key, value);
  };
  assert.equal((await instance.recoverSnapshot(snapshot('Imported'))).code, 'storage-quota');
  assert.equal(instance.getState().storage.status, 'blocked'); assert.deepEqual(data(instance), before);
  assert.deepEqual(raw(storage), bytes); assert.equal((await instance.createTeam('Automatic')).status, 'error');
  assert.equal((await instance.recoverSnapshot(snapshot('Retry confirmed'))).status, 'success');
});

test('unverifiable recovery rollback stays blocked and retains the last in-memory document', async () => {
  const { instance, storage } = await initialized(); const before = data(instance); const original = storage.setItem;
  storage.setItem = (key, value) => {
    original(key, value);
    if (key === LEGACY) { storage.values.set(KEY, 'unknown data'); throw new Error('failure'); }
  };
  assert.equal((await instance.recoverSnapshot(snapshot('Imported'))).code, 'storage-rollback-failed');
  assert.equal(instance.getState().storage.status, 'blocked'); assert.deepEqual(data(instance), before);
  assert.equal(storage.values.get(KEY), 'unknown data');
});
