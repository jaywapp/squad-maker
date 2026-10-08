(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SquadLibrary = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const clone = value => JSON.parse(JSON.stringify(value));
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  function fault(code) { const error = new Error(code); error.code = code; return error; }
  function errorCode(error, fallback) {
    if (error && error.name === 'QuotaExceededError') return 'storage-quota';
    if (error && error.name === 'SecurityError') return 'storage-unavailable';
    return error && typeof error.code === 'string' && error.code ? error.code : fallback;
  }

  function createLibrary(options) {
    options = options || {};
    const storage = options.storage;
    const key = options.key || 'squad-maker-library-v1';
    const legacyKey = options.legacyKey || 'squad-maker-v1';
    const normalize = options.validateSnapshot;
    const now = options.now || Date.now;
    const idFactory = options.idFactory || (kind => kind + '-' + (
      typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() :
        Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)
    ));
    const limit = options.policy && options.policy.limit != null ? options.policy.limit : null;
    if (limit !== null && (!Number.isSafeInteger(limit) || limit < 0)) throw fault('invalid-policy');
    if (key === legacyKey || !storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function' ||
      typeof storage.removeItem !== 'function' || typeof normalize !== 'function') throw fault('invalid-options');
    let document = { version: 1, revision: 0, teams: [], files: [], activeFileId: null };
    let storageState = { status: 'idle', error: null, retryable: false };
    let lastRaw = { [key]: null, [legacyKey]: null };
    let initialized = false;
    let readOnly = false;
    let deletion = null;
    let queue = Promise.resolve();

    function snapshot(value) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw fault('invalid-snapshot');
      if (value.v !== 1) throw fault('unsupported-version');
      let normalized;
      try { normalized = normalize(clone(value)); } catch (error) { throw fault('invalid-snapshot'); }
      if (!normalized || normalized.v !== 1 || Array.isArray(normalized)) throw fault('invalid-snapshot');
      return clone(normalized);
    }
    function name(value) {
      if (typeof value !== 'string' || !value.trim()) throw fault('invalid-name');
      return value.trim();
    }
    function timestamp() {
      const value = now();
      if (!(typeof value === 'number' && Number.isFinite(value)) &&
        !(typeof value === 'string' && value.length)) throw fault('invalid-time');
      return value;
    }
    function uniqueId(kind, target) {
      for (let attempt = 0; attempt < 64; attempt++) {
        const id = idFactory(kind);
        if (typeof id === 'string' && id.length && !target.teams.some(team => team.id === id) &&
          !target.files.some(file => file.id === id)) return id;
      }
      throw fault('id-collision');
    }
    function validateDocument(input) {
      if (!input || input.version !== 1) throw fault('unsupported-version');
      if (!Number.isSafeInteger(input.revision) || input.revision < 0 || !Array.isArray(input.teams) ||
        !Array.isArray(input.files)) throw fault('invalid-library');
      const value = clone(input);
      const ids = new Set();
      const teams = new Set();
      value.teams.forEach(team => {
        if (!team || typeof team.id !== 'string' || !team.id || ids.has(team.id) || name(team.name) !== team.name)
          throw fault('invalid-library');
        ids.add(team.id); teams.add(team.id);
      });
      value.files.forEach(file => {
        if (!file || typeof file.id !== 'string' || !file.id || ids.has(file.id) || !teams.has(file.teamId) ||
          name(file.name) !== file.name || !Number.isSafeInteger(file.revision) || file.revision < 0 ||
          !own(file, 'createdAt') || !own(file, 'updatedAt') ||
          !['string', 'number'].includes(typeof file.createdAt) || !['string', 'number'].includes(typeof file.updatedAt))
          throw fault('invalid-library');
        ids.add(file.id); file.snapshot = snapshot(file.snapshot);
      });
      if (value.activeFileId !== null && !value.files.some(file => file.id === value.activeFileId))
        throw fault('invalid-library');
      if (value.legacyRecovery) {
        if (typeof value.legacyRecovery.fileId !== 'string') throw fault('invalid-library');
        value.legacyRecovery.snapshot = snapshot(value.legacyRecovery.snapshot);
      }
      if (value.rawRecovery) {
        for (const field of ['libraryRaw', 'legacyRaw']) {
          if (value.rawRecovery[field] !== null && typeof value.rawRecovery[field] !== 'string')
            throw fault('invalid-library');
        }
      }
      return value;
    }
    function active(target) { return target.files.find(file => file.id === target.activeFileId) || null; }
    function getState() {
      return clone({ ...document, undoDeleteAvailable: Boolean(deletion), slots: { status: limit !== null && document.files.length >= limit ? 'full' : 'available',
        used: document.files.length, limit, policy: limit === null ? 'preview-unlimited' : 'test-only' }, storage: storageState });
    }
    function result(status, code, value) {
      const file = active(document);
      return { status, code, value: { snapshot: file ? clone(file.snapshot) : null,
        fileId: document.activeFileId, ...clone(value || {}) }, state: getState() };
    }
    function schedule(task) {
      const pending = queue.then(async () => {
        try { return await task(); }
        catch (error) { return result('error', errorCode(error, 'invalid-input')); }
      });
      queue = pending.then(() => undefined, () => undefined);
      return pending;
    }
    function writable() {
      if (!initialized) throw fault('not-initialized');
      if (readOnly) throw fault('read-only');
      if (storageState.status === 'blocked') throw fault(storageState.error || 'storage-blocked');
    }
    async function rawValues() {
      const values = {};
      values[key] = await storage.getItem(key);
      values[legacyKey] = await storage.getItem(legacyKey);
      for (const storageKey of [key, legacyKey]) {
        if (values[storageKey] === undefined) values[storageKey] = null;
        if (values[storageKey] !== null && typeof values[storageKey] !== 'string') throw fault('storage-read-failed');
      }
      return values;
    }
    function equalRaw(left, right) { return left[key] === right[key] && left[legacyKey] === right[legacyKey]; }
    async function writeValues(values, expected) {
      if (typeof storage.commitBatch === 'function') {
        const response = await storage.commitBatch({ ...values }, { ...expected });
        if (response === false || response && response.status === 'error') throw fault(errorCode(response, 'storage-unavailable'));
      } else {
        for (const storageKey of [key, legacyKey]) {
          if (values[storageKey] === expected[storageKey]) continue;
          const current = await storage.getItem(storageKey);
          if ((current === undefined ? null : current) !== expected[storageKey]) throw fault('storage-conflict');
          if (values[storageKey] === null) await storage.removeItem(storageKey);
          else await storage.setItem(storageKey, values[storageKey]);
        }
      }
    }
    async function persist(candidate, expectedRaw) {
      expectedRaw = expectedRaw || lastRaw;
      const file = active(candidate);
      const values = { [key]: JSON.stringify(candidate), [legacyKey]: file ? JSON.stringify(file.snapshot) : null };
      let attempted = false;
      try {
        const before = await rawValues();
        if (!equalRaw(before, expectedRaw)) throw fault('storage-conflict');
        attempted = true;
        await writeValues(values, expectedRaw);
        if (!equalRaw(await rawValues(), values)) throw fault('storage-verification');
        document = candidate;
        lastRaw = values;
        storageState = { status: 'saved', error: null, retryable: false };
        return true;
      } catch (error) {
        let code = errorCode(error, 'storage-unavailable');
        if (attempted) {
          try {
            const observed = await rawValues();
            for (const storageKey of [key, legacyKey]) {
              if (observed[storageKey] !== expectedRaw[storageKey] && observed[storageKey] !== values[storageKey])
                throw fault('storage-rollback-failed');
            }
            if (!equalRaw(observed, expectedRaw)) await writeValues(expectedRaw, observed);
            if (!equalRaw(await rawValues(), expectedRaw)) throw fault('storage-rollback-failed');
          } catch (rollbackError) {
            code = 'storage-rollback-failed';
            storageState = { status: 'blocked', error: code, retryable: false };
            throw fault(code);
          }
        }
        storageState = { status: 'error', error: code, retryable: code !== 'storage-conflict' };
        throw fault(code);
      }
    }
    function bump(target) {
      if (target.revision >= Number.MAX_SAFE_INTEGER) throw fault('revision-overflow');
      target.revision++;
    }
    function bumpFile(file) {
      if (file.revision >= Number.MAX_SAFE_INTEGER) throw fault('revision-overflow');
      file.revision++; file.updatedAt = timestamp();
    }
    function capacity(count) { if (limit !== null && document.files.length + count > limit) throw fault('slots-full'); }
    function command(change) {
      return schedule(async () => {
        writable();
        const candidate = clone(document);
        const outcome = change(candidate) || {};
        bump(candidate);
        await persist(candidate);
        if (own(outcome, 'deletion')) deletion = outcome.deletion;
        return result('success', null, outcome.value);
      });
    }
    function parse(raw) {
      try { return JSON.parse(raw); } catch (error) { throw fault('invalid-json'); }
    }
    function initialize(settings) {
      settings = settings || {};
      return schedule(async () => {
        readOnly = settings.readOnly === true;
        initialized = false; deletion = null;
        let candidate;
        try {
          lastRaw = await rawValues();
          const legacy = lastRaw[legacyKey] === null ? null : snapshot(parse(lastRaw[legacyKey]));
          if (lastRaw[key] !== null) {
            candidate = validateDocument(parse(lastRaw[key]));
            const file = active(candidate);
            if (legacy && !file) throw fault('storage-conflict');
            if (legacy && JSON.stringify(legacy) !== JSON.stringify(file.snapshot)) {
              candidate.legacyRecovery = { fileId: file.id, snapshot: clone(file.snapshot) };
              file.snapshot = legacy; bumpFile(file); bump(candidate);
            }
          } else {
            const initial = legacy || snapshot(settings.initialSnapshot);
            candidate = { version: 1, revision: 0, teams: [], files: [], activeFileId: null };
            const team = { id: uniqueId('team', candidate), name: initial.team && String(initial.team).trim() || '내 팀' };
            candidate.teams.push(team);
            const time = timestamp();
            const file = { id: uniqueId('file', candidate), teamId: team.id, name: '전술 1', revision: 0,
              createdAt: time, updatedAt: time, snapshot: initial };
            candidate.files.push(file); candidate.activeFileId = file.id;
          }
        } catch (error) {
          storageState = { status: 'blocked', error: errorCode(error, 'storage-read-failed'), retryable: false };
          initialized = true;
          return result('error', storageState.error);
        }
        initialized = true;
        if (readOnly) {
          document = candidate;
          storageState = { status: 'idle', error: null, retryable: false };
        } else await persist(candidate);
        return result('success', null);
      });
    }
    return {
      initialize, getState,
      recoverSnapshot: value => schedule(async () => {
        if (!initialized) throw fault('not-initialized');
        if (readOnly) throw fault('read-only');
        const normalized = snapshot(value);
        const wasBlocked = storageState.status === 'blocked';
        try {
          const observed = await rawValues();
          let candidate;
          let corrupt = false;
          let legacy = null;
          if (observed[key] !== null) {
            try { candidate = validateDocument(parse(observed[key])); }
            catch (error) { corrupt = true; }
          }
          if (observed[legacyKey] !== null) {
            try { legacy = snapshot(parse(observed[legacyKey])); }
            catch (error) { corrupt = true; }
          }
          if (!candidate) candidate = { version: 1, revision: 0, teams: [], files: [], activeFileId: null };
          let file = active(candidate);
          if (file) {
            candidate.legacyRecovery = { fileId: file.id, snapshot: clone(file.snapshot) };
            file.snapshot = normalized; bumpFile(file);
          } else {
            if (limit !== null && candidate.files.length >= limit) throw fault('slots-full');
            let team = candidate.teams[0];
            if (!team) {
              team = { id: uniqueId('team', candidate), name: normalized.team && String(normalized.team).trim() || '내 팀' };
              candidate.teams.push(team);
            }
            const time = timestamp();
            file = { id: uniqueId('file', candidate), teamId: team.id, name: '전술 1', revision: 0,
              createdAt: time, updatedAt: time, snapshot: normalized };
            candidate.files.push(file); candidate.activeFileId = file.id;
            if (legacy) candidate.legacyRecovery = { fileId: file.id, snapshot: legacy };
          }
          if (corrupt) candidate.rawRecovery = { libraryRaw: observed[key], legacyRaw: observed[legacyKey] };
          bump(candidate);
          await persist(candidate, observed);
          deletion = null;
          return result('success', null, { file });
        } catch (error) {
          const code = errorCode(error, 'storage-unavailable');
          if (wasBlocked || storageState.status === 'blocked')
            storageState = { status: 'blocked', error: code, retryable: false };
          else if (storageState.status !== 'error')
            storageState = { status: 'error', error: code, retryable: code !== 'storage-conflict' };
          throw fault(code);
        }
      }),
      ready: () => queue.then(() => getState()),
      flush: () => schedule(async () => result(storageState.status === 'blocked' || storageState.status === 'error' ? 'error' : 'success', storageState.error)),
      saveActive: value => command(target => {
        const file = active(target);
        if (!file) throw fault('no-active-file');
        file.snapshot = snapshot(value); bumpFile(file);
      }),
      createTeam: value => command(target => {
        const team = { id: uniqueId('team', target), name: name(value) };
        target.teams.push(team); return { value: { team } };
      }),
      createFile: settings => command(target => {
        settings = settings || {}; capacity(1);
        if (!target.teams.some(team => team.id === settings.teamId)) throw fault('team-not-found');
        const normalized = snapshot(settings.snapshot);
        const time = timestamp();
        const file = { id: uniqueId('file', target), teamId: settings.teamId, name: name(settings.name), revision: 0,
          createdAt: time, updatedAt: time, snapshot: normalized };
        target.files.push(file); target.activeFileId = file.id;
        return { value: { file } };
      }),
      renameTeam: (id, value) => command(target => {
        const team = target.teams.find(item => item.id === id);
        if (!team) throw fault('team-not-found');
        team.name = name(value); return { value: { team } };
      }),
      renameFile: (id, value) => command(target => {
        const file = target.files.find(item => item.id === id);
        if (!file) throw fault('file-not-found');
        file.name = name(value); bumpFile(file); return { value: { file } };
      }),
      openFile: id => command(target => {
        const file = target.files.find(item => item.id === id);
        if (!file) throw fault('file-not-found');
        target.activeFileId = id; return { value: { file } };
      }),
      deleteFile: id => command(target => {
        const file = target.files.find(item => item.id === id);
        if (!file) throw fault('file-not-found');
        target.files = target.files.filter(item => item.id !== id);
        if (target.activeFileId === id) target.activeFileId = target.files.length ? target.files[0].id : null;
        return { deletion: { teams: [], files: [clone(file)], activeFileId: document.activeFileId } };
      }),
      deleteTeam: id => command(target => {
        const team = target.teams.find(item => item.id === id);
        if (!team) throw fault('team-not-found');
        const files = target.files.filter(item => item.teamId === id);
        target.teams = target.teams.filter(item => item.id !== id);
        target.files = target.files.filter(item => item.teamId !== id);
        if (!active(target)) target.activeFileId = target.files.length ? target.files[0].id : null;
        return { deletion: { teams: [clone(team)], files: clone(files), activeFileId: document.activeFileId } };
      }),
      undoDelete: () => command(target => {
        if (!deletion) throw fault('undo-unavailable');
        capacity(deletion.files.length);
        const ids = new Set(target.teams.concat(target.files).map(item => item.id));
        if (deletion.teams.concat(deletion.files).some(item => ids.has(item.id))) throw fault('id-collision');
        const teamIds = new Set(target.teams.concat(deletion.teams).map(team => team.id));
        if (deletion.files.some(file => !teamIds.has(file.teamId))) throw fault('team-not-found');
        target.teams.push(...clone(deletion.teams)); target.files.push(...clone(deletion.files));
        if (!target.activeFileId && target.files.some(file => file.id === deletion.activeFileId))
          target.activeFileId = deletion.activeFileId;
        return { deletion: null };
      })
    };
  }
  return { createLibrary };
});
