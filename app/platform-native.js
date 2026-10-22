import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';

const Storage = registerPlugin('SquadStorage');
const Documents = registerPlugin('SquadDocuments');
const Ads = registerPlugin('SquadAds');
const Updates = registerPlugin('SquadUpdates');
const native = Capacitor.isNativePlatform();

function adState(value = {}) {
  if (!value || typeof value !== 'object') value = {};
  return Object.freeze({
    status: typeof value.status === 'string' ? value.status.slice(0, 64) : 'unavailable',
    testOnly: typeof value.testOnly === 'boolean' ? value.testOnly : null,
    adsMode: ['test', 'production'].includes(value.adsMode) ? value.adsMode : 'unavailable',
    canRequestAds: value.canRequestAds === true,
    consentStatus: ['unknown', 'not-required', 'required', 'obtained'].includes(value.consentStatus)
      ? value.consentStatus : 'unknown',
    privacyOptionsRequired: value.privacyOptionsRequired === true,
    consentFormShowing: value.consentFormShowing === true,
  });
}

function nativeError(error) {
  const allowed = new Set(['storage-conflict', 'storage-unavailable', 'storage-quota', 'storage-verification', 'invalid-input', 'file-write-failed']);
  return Object.assign(new Error('Native operation failed'), {
    code: allowed.has(error?.code) ? error.code : 'storage-unavailable',
  });
}

function updateState(value = {}) {
  const statuses = ['unsupported', 'idle', 'checking', 'not-available', 'available', 'pending',
    'downloading', 'downloaded', 'installing', 'installed', 'cancelled', 'failed', 'skipped'];
  const result = {
    supported: value?.supported === true,
    status: statuses.includes(value?.status) ? value.status : 'unsupported',
    reason: typeof value?.reason === 'string' ? value.reason.slice(0, 80) : null,
    shouldNotify: value?.shouldNotify === true,
  };
  for (const key of ['availableVersionCode', 'bytesDownloaded', 'totalBytes']) {
    if (Number.isSafeInteger(value?.[key]) && value[key] >= 0) result[key] = value[key];
  }
  return Object.freeze(result);
}

async function updateCall(method, options) {
  if (!native) return updateState();
  try { return updateState(await Updates[method](options)); }
  catch { return updateState({ supported: true, status: 'failed', reason: 'update-unavailable' }); }
}

const storage = {
  async getItem(key) {
    try { return (await Storage.read({ key })).value ?? null; }
    catch (error) { throw nativeError(error); }
  },
  async setItem(key, value) {
    try { await Storage.commit({ values: { [key]: value }, expected: {} }); }
    catch (error) { throw nativeError(error); }
  },
  async removeItem(key) {
    try { await Storage.commit({ values: { [key]: null }, expected: {} }); }
    catch (error) { throw nativeError(error); }
  },
  async commitBatch(values, expected) {
    try { await Storage.commit({ values, expected }); }
    catch (error) { throw nativeError(error); }
  },
};

async function toBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const chunks = [];
  for (let offset = 0; offset < bytes.length; offset += 32768) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 32768)));
  }
  return btoa(chunks.join(''));
}

let fileShares = 0;

async function cancelExportAd() {
  if (!native) return { status: 'unsupported' };
  try { return await Ads.cancelExportInterstitial(); }
  catch { return { status: 'failed', reason: 'ad-unavailable', testOnly: null }; }
}

async function exportFile(blob, filename, mimeType, destination = 'save') {
  if (!native) return { status: 'unsupported', code: 'native-unavailable' };
  const sharing = destination === 'share';
  if (sharing) {
    fileShares += 1;
    void cancelExportAd();
  }
  try {
    filename = String(filename).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 160) || 'squad-export';
    const data = await toBase64(blob);
    if (destination === 'share') {
      const staged = await Documents.stage({ data, filename, mimeType });
      await Share.share({ title: filename, files: [staged.uri] });
      return { status: 'success', code: null, completion: 'share-sheet-finished' };
    }
    const result = await Documents.save({ data, filename, mimeType });
    if (result?.status === 'cancelled') return { status: 'cancelled', code: null, completion: null };
    if (result?.status !== 'success') return { status: 'error', code: 'export-failed', completion: null };
    return { status: 'success', code: null, completion: 'file-saved',
      adReceipt: typeof result.adReceipt === 'string' && result.adReceipt.length > 0
        && result.adReceipt.length <= 128 ? result.adReceipt : null };
  } catch (error) {
    if (/cancel/i.test(error?.message || '')) return { status: 'cancelled', code: null, completion: null };
    return { status: 'error', code: 'export-failed', completion: null };
  } finally {
    if (sharing) fileShares -= 1;
  }
}

if (native) {
  let exiting = false;
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive && exiting) { exiting = false; document.documentElement.inert = false; }
    if (!isActive) window.SquadMakerContract?.run('retry-save');
  });
  App.addListener('backButton', async () => {
    if (exiting) return;
    const dialogCancel = document.querySelector('.dlg [data-r="0"]');
    if (dialogCancel) { dialogCancel.click(); return; }
    const handled = window.SquadUi?.closeTopLayer?.();
    if (handled) return;
    const knownModals = [
      ['#shareModal', 'closeShare'], ['#playerViewModal', 'closePlayerView'],
      ['#helpModal', 'closeHelp'], ['#feedbackModal', 'closeFeedback'],
    ];
    for (const [selector, close] of knownModals) {
      const element = document.querySelector(selector);
      if (element && element.getClientRects().length && typeof window[close] === 'function') {
        window[close](); return;
      }
    }
    const state = window.SquadMakerContract?.getState();
    if (!state?.ready || state?.export?.busy || state?.busy?.mutation || state?.busy?.updateRestart) return;
    if (state?.view?.readOnly) { App.exitApp(); return; }
    exiting = true;
    document.documentElement.inert = true;
    try {
      const result = await window.SquadMakerContract?.run('retry-save');
      const latest = window.SquadMakerContract?.getState();
      const saved = result?.status === 'success' && latest?.revision === latest?.savedRevision;
      const empty = result?.code === 'no-active-file' && latest?.localLibrary?.fileId === null;
      if ((saved || empty) && !latest?.export?.busy && !latest?.busy?.mutation) {
        await App.exitApp();
        return;
      }
    } catch {}
    exiting = false;
    document.documentElement.inert = false;
  });
}

window.SquadPlatform = Object.freeze({
  native,
  storage: native ? storage : null,
  exportFile,
  cancelExportAd,
  publicShareBase: 'https://jaywapp.github.io/squad-maker/',
  async getAppInfo() {
    if (!native) return null;
    try {
      const info = await App.getInfo();
      const result = {};
      for (const key of ['name', 'id', 'version', 'build']) {
        if (typeof info?.[key] !== 'string' || !info[key].trim()) throw new Error('Invalid app metadata');
        result[key] = info[key].trim();
      }
      return Object.freeze(result);
    } catch {
      throw Object.assign(new Error('App metadata unavailable'), { code: 'app-info-unavailable' });
    }
  },
  getUpdateState: () => updateCall('getState'),
  checkForUpdate: ({ manual = false } = {}) => updateCall('check', { manual: manual === true }),
  startFlexibleUpdate: () => updateCall('startFlexible'),
  dismissUpdate: () => updateCall('dismiss'),
  async getStorageReceipt() {
    if (!native) return null;
    try {
      const value = await Storage.getReceipt();
      return value?.verified === true && Number.isSafeInteger(value.generation) && value.generation > 0 &&
        typeof value.receipt === 'string' && value.receipt.length > 0 ? value.receipt : null;
    } catch { return null; }
  },
  async beginUpdateCompletion() {
    if (!native) return { ...updateState(), challenge: null };
    try {
      const value = await Updates.beginCompletion();
      return { ...updateState(value), challenge: typeof value?.challenge === 'string' ? value.challenge : null };
    } catch { return { ...updateState({ status: 'failed' }), challenge: null }; }
  },
  completeUpdate: ({ challenge, receipt } = {}) => {
    if (typeof challenge !== 'string' || !challenge || typeof receipt !== 'string' || !receipt)
      return Promise.resolve(updateState({ supported: native, status: 'skipped', reason: 'storage-unverified' }));
    if (window.SquadMakerContract?.validateUpdateRestart?.(receipt) !== true)
      return Promise.resolve(updateState({ supported: native, status: 'skipped', reason: 'save-unverified' }));
    return updateCall('complete', { challenge, receipt });
  },
  onUpdateState(listener) {
    if (!native || typeof listener !== 'function') return () => {};
    let stopped = false;
    let handle;
    const publish = value => { if (!stopped) listener(updateState(value)); };
    const remove = subscription => {
      try { Promise.resolve(subscription?.remove()).catch(() => {}); } catch {}
    };
    Promise.resolve(Updates.addListener('state', publish)).then(subscription => {
      if (stopped) remove(subscription); else handle = subscription;
    }).catch(() => {});
    Updates.getState().then(publish).catch(() => {});
    return () => { stopped = true; remove(handle); };
  },
  async showTestAd() {
    if (!native) return { status: 'unsupported' };
    return Ads.showTestBanner();
  },
  async showBannerAd() {
    if (!native) return { status: 'unsupported' };
    try { return await Ads.showBanner(); }
    catch { return { status: 'failed', reason: 'ad-unavailable', testOnly: null }; }
  },
  async prepareExportAd() {
    if (!native) return { status: 'unsupported' };
    try { return await Ads.prepareExportInterstitial(); }
    catch { return { status: 'failed', reason: 'ad-unavailable', testOnly: null }; }
  },
  async showExportAd(placement, receipt) {
    if (!native) return { status: 'unsupported' };
    if (!['save-png', 'save-gif', 'save-sq'].includes(placement))
      return { status: 'skipped', reason: 'invalid-placement', testOnly: null };
    if (fileShares > 0) return { status: 'skipped', reason: 'sharing', testOnly: null };
    if (typeof receipt !== 'string' || !receipt || receipt.length > 128)
      return { status: 'skipped', reason: 'missing-save-receipt', testOnly: null };
    try { return await Ads.showExportInterstitial({ placement, receipt }); }
    catch { return { status: 'failed', reason: 'ad-unavailable', testOnly: null }; }
  },
  async getAdState() {
    if (!native) return adState({ status: 'unsupported' });
    try { return adState(await Ads.getState()); }
    catch { return adState(); }
  },
  onAdState(listener) {
    if (!native || typeof listener !== 'function') return () => {};
    let stopped = false;
    let handle;
    const publish = value => { if (!stopped) listener(adState(value)); };
    const remove = subscription => {
      try { Promise.resolve(subscription?.remove()).catch(() => {}); } catch {}
    };
    try {
      Promise.resolve(Ads.addListener('state', publish)).then(subscription => {
        if (stopped) remove(subscription); else handle = subscription;
      }).catch(() => {});
      Ads.getState().then(publish).catch(() => publish({}));
    } catch { publish({}); }
    return () => { stopped = true; remove(handle); };
  },
  async showAdPrivacyOptions() {
    if (!native) return { status: 'unsupported' };
    try { return await Ads.showPrivacyOptions(); }
    catch { return { status: 'failed', reason: 'privacy-unavailable' }; }
  },
});
