(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SquadFeedbackClient = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PUBLIC_ENDPOINT = 'https://squad-maker.vercel.app/api/feedback';
  const messages = {
    'feedback-network': '제보 서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요. 입력 내용은 유지됩니다.',
    'feedback-timeout': '제보 서버의 응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요. 입력 내용은 유지됩니다.',
    'feedback-not-found': '제보 서버가 아직 연결되지 않았습니다. 입력 내용은 유지됩니다.',
    'feedback-invalid-response': '제보 서버의 응답을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요. 입력 내용은 유지됩니다.',
    'feedback-unavailable': '제보 창구를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요. 입력 내용은 유지됩니다.',
    'feedback-rejected': '제보를 보내지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요. 입력 내용은 유지됩니다.',
  };

  function fault(code, message) {
    return Object.assign(new Error(message || messages[code]), { code });
  }

  function createClient(options = {}) {
    const native = options.native === true;
    const endpoint = native ? PUBLIC_ENDPOINT : '/api/feedback';
    const platform = native ? 'android' : 'web';
    const fetchRequest = options.fetchImpl || globalThis.fetch;
    const timeoutMs = options.timeoutMs ?? 10000;
    if (typeof fetchRequest !== 'function' || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new Error('Invalid feedback client options');
    }

    async function request(method, payload) {
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      let timer;
      const timeout = new Promise((resolve, reject) => {
        timer = setTimeout(() => {
          reject(fault('feedback-timeout', method === 'POST'
            ? '응답이 늦어 제보 접수 여부를 확인하지 못했습니다. 입력 내용은 유지됩니다.' : undefined));
          controller?.abort();
        }, timeoutMs);
      });
      const operation = (async () => {
        const response = await fetchRequest(endpoint, {
          method,
          headers: method === 'POST'
            ? { 'Content-Type': 'application/json', Accept: 'application/json' }
            : { Accept: 'application/json' },
          ...(method === 'POST' ? { body: JSON.stringify({ ...payload, platform }) } : {}),
          ...(controller ? { signal: controller.signal } : {}),
          cache: 'no-store',
        });
        if (response.status === 404) throw fault('feedback-not-found');
        let result;
        try { result = await response.json(); }
        catch { throw fault('feedback-invalid-response'); }
        if (!response.ok) {
          const code = response.status >= 500 ? 'feedback-unavailable' : 'feedback-rejected';
          const message = typeof result?.error === 'string' && result.error.length <= 250 ? result.error : null;
          throw fault(code, message);
        }
        if (!result || (method === 'GET'
          ? typeof result.turnstileSiteKey !== 'string' || !result.turnstileSiteKey.trim()
          : response.status !== 201 || !Number.isInteger(result.issueNumber) || result.issueNumber < 1)) {
          throw fault('feedback-invalid-response');
        }
        return result;
      })();
      try { return await Promise.race([operation, timeout]); }
      catch (error) {
        if (Object.prototype.hasOwnProperty.call(messages, error?.code)) throw error;
        throw fault('feedback-network');
      } finally { clearTimeout(timer); }
    }

    return Object.freeze({
      endpoint,
      platform,
      getConfig: () => request('GET'),
      submit: payload => request('POST', payload),
    });
  }

  return Object.freeze({ createClient });
});
