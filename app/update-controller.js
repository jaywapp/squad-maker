(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SquadUpdateController = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function createController(options = {}) {
    const platform = options.platform || {};
    const eligible = options.eligible === true && platform.native === true;
    let disposed = false;
    let generation = 0;
    let pending = null;
    let stopListener = null;
    let dismissedVersion = null;
    let state = { supported: eligible, status: eligible ? 'idle' : 'unsupported', reason: eligible ? null : 'channel-ineligible', busy: false, shouldNotify: false };
    const clone = value => JSON.parse(JSON.stringify(value));

    function publish(value) {
      if (disposed) return clone(state);
      const source = value && typeof value === 'object' ? value : {};
      const next = { supported: eligible && source.supported !== false,
        status: typeof source.status === 'string' ? source.status.slice(0, 64) : 'unavailable',
        reason: typeof source.reason === 'string' ? source.reason.slice(0, 80) : null,
        shouldNotify: source.shouldNotify === true, busy: Boolean(pending) };
      for (const key of ['availableVersionCode', 'bytesDownloaded', 'totalBytes']) {
        if (Number.isSafeInteger(source[key]) && source[key] >= 0) next[key] = source[key];
      }
      if (next.availableVersionCode === dismissedVersion) next.shouldNotify = false;
      state = next;
      try { options.onState?.(clone(state)); } catch {}
      return clone(state);
    }

    function operation(task) {
      if (disposed) return Promise.resolve({ supported: false, status: 'disposed', reason: 'disposed' });
      if (!eligible) {
        try { options.onInfo?.({ reason: 'channel-ineligible' }); } catch {}
        return Promise.resolve(clone(state));
      }
      if (pending) return pending;
      const epoch = ++generation;
      const current = () => !disposed && epoch === generation;
      const active = Promise.resolve().then(async () => {
        if (!current()) return clone(state);
        try { return await task(current); }
        catch { return current() ? publish({ supported: true, status: 'failed', reason: 'update-unavailable' }) : clone(state); }
      }).finally(() => {
        if (pending === active) {
          pending = null;
          if (!disposed) publish(state);
        }
      });
      pending = active;
      publish(state);
      return pending;
    }

    const check = ({ manual = false } = {}) => operation(async current => {
      if (manual) dismissedVersion = null;
      const result = await platform.checkForUpdate({ manual: manual === true });
      return current() ? publish(result) : clone(state);
    });

    const start = () => operation(async current => {
      const latest = await platform.getUpdateState();
      if (!current()) return clone(state);
      if (latest?.supported === false || latest?.status !== 'available') return publish(latest);
      const result = await platform.startFlexibleUpdate();
      return current() ? publish(result) : clone(state);
    });

    function dismiss() {
      if (disposed || !eligible) return Promise.resolve(clone(state));
      // Cancellation invalidates any earlier operation before native completion can run.
      ++generation;
      dismissedVersion = state.availableVersionCode ?? null;
      publish({ ...state, shouldNotify: false });
      const epoch = generation;
      return Promise.resolve().then(() => platform.dismissUpdate()).then(result =>
        !disposed && generation === epoch ? publish({ ...result, shouldNotify: false }) : clone(state)
      ).catch(() => clone(state));
    }

    const complete = () => operation(async current => {
      let locked = false;
      try {
        const latest = await platform.getUpdateState();
        if (!current()) return clone(state);
        if (latest?.supported === false || latest?.status !== 'downloaded') return publish(latest);
        if (typeof options.prepareRestart !== 'function') return publish({ supported: true, status: 'blocked', reason: 'save-barrier-unavailable' });
        locked = true;
        const prepared = await options.prepareRestart();
        if (!current()) return clone(state);
        if (!prepared?.ok || typeof prepared.receipt !== 'string' || !prepared.receipt) return publish({ supported: true, status: 'blocked', reason: prepared?.reason || 'save-unverified' });
        const gate = await platform.beginUpdateCompletion();
        if (!current()) return clone(state);
        const challenge = gate?.challenge;
        if (typeof challenge !== 'string' || !challenge) return publish({ supported: true, status: 'blocked', reason: 'completion-gate-unavailable' });
        const rechecked = await platform.getUpdateState();
        if (!current()) return clone(state);
        if (rechecked?.supported === false || rechecked?.status !== 'downloaded') return publish(rechecked);
        if (latest.availableVersionCode !== rechecked.availableVersionCode) return publish({ supported: true, status: 'blocked', reason: 'update-version-changed' });
        if (typeof platform.getStorageReceipt === 'function') {
          const receipt = await platform.getStorageReceipt();
          if (!current()) return clone(state);
          if (typeof receipt !== 'string' || receipt !== prepared.receipt) return publish({ supported: true, status: 'blocked', reason: 'storage-changed' });
        }
        if (typeof options.validateRestart === 'function' && options.validateRestart(prepared.receipt) !== true)
          return publish({ supported: true, status: 'blocked', reason: 'save-changed' });
        const result = await platform.completeUpdate({ challenge, receipt: prepared.receipt });
        return current() ? publish(result) : clone(state);
      } finally {
        if (locked) { try { await options.releaseRestart?.(); } catch {} }
      }
    });

    if (eligible && typeof platform.onUpdateState === 'function') {
      try { stopListener = platform.onUpdateState(value => { if (!disposed) publish(value); }); } catch {}
    }
    return Object.freeze({ check, start, dismiss, complete,
      getState: () => clone(state),
      dispose() {
        if (disposed) return;
        disposed = true; ++generation; pending = null;
        try { if (typeof stopListener === 'function') stopListener(); } catch {}
      },
    });
  }
  return Object.freeze({ createController });
});
