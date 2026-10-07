import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';

const Storage = registerPlugin('SquadStorage');
const Documents = registerPlugin('SquadDocuments');
const Ads = registerPlugin('SquadAds');
const native = Capacitor.isNativePlatform();

function nativeError(error) {
  const allowed = new Set(['storage-conflict', 'storage-unavailable', 'storage-quota', 'storage-verification', 'invalid-input', 'file-write-failed']);
  return Object.assign(new Error('Native operation failed'), {
    code: allowed.has(error?.code) ? error.code : 'storage-unavailable',
  });
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

async function exportFile(blob, filename, mimeType, destination = 'save') {
  if (!native) return { status: 'unsupported', code: 'native-unavailable' };
  try {
    filename = String(filename).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 160) || 'squad-export';
    const data = await toBase64(blob);
    if (destination === 'share') {
      const staged = await Documents.stage({ data, filename, mimeType });
      await Share.share({ title: filename, files: [staged.uri] });
      return { status: 'success', code: null, completion: 'share-sheet-finished' };
    }
    const result = await Documents.save({ data, filename, mimeType });
    return result.status === 'cancelled'
      ? { status: 'cancelled', code: null, completion: null }
      : { status: 'success', code: null, completion: 'file-saved' };
  } catch (error) {
    if (/cancel/i.test(error?.message || '')) return { status: 'cancelled', code: null, completion: null };
    return { status: 'error', code: 'export-failed', completion: null };
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
    if (!state?.ready || state?.export?.busy || state?.busy?.mutation) return;
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
  publicShareBase: 'https://squad-maker.vercel.app/',
  async showTestAd() {
    if (!native) return { status: 'unsupported' };
    return Ads.showTestBanner();
  },
  async getAdState() {
    return native ? Ads.getState() : { status: 'unsupported' };
  },
});
