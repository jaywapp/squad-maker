'use strict';

const REPOSITORY = 'jaywapp/squad-maker';
const LABEL = '제보';
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 3;
const attempts = globalThis.__squadMakerFeedbackAttempts || new Map();
globalThis.__squadMakerFeedbackAttempts = attempts;

function send(response, status, payload, origin) {
  if (origin) response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Vary', 'Origin');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  return response.status(status).json(payload);
}

function requestOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return '';
  const forwardedProto = String(request.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const forwardedHost = String(request.headers['x-forwarded-host'] || request.headers.host || '').split(',')[0].trim();
  const sameOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : '';
  const configured = String(process.env.FEEDBACK_ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  return origin === sameOrigin || configured.includes(origin) ? origin : '';
}

function cleanText(value, maxLength, multiline = false) {
  if (typeof value !== 'string') return '';
  const withoutControls = value.replace(multiline
    ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
    : /[\u0000-\u001f\u007f]/g, '');
  return withoutControls.trim().slice(0, maxLength);
}

function clientIp(request) {
  return String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
    .slice(0, 80);
}

function withinRateLimit(ip, now = Date.now()) {
  const recent = (attempts.get(ip) || []).filter(timestamp => now - timestamp < RATE_WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length <= RATE_LIMIT;
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;
  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true;
}

function issueBody(payload) {
  const sections = [
    payload.description,
    '',
    '---',
    `앱 버전: ${payload.appVersion}`,
    `플랫폼: ${payload.platform}`,
  ];
  if (payload.contact) sections.push(`연락처(사용자 제공): ${payload.contact}`);
  if (payload.diagnostics) sections.push('', '진단 정보(사용자 동의):', '```text', payload.diagnostics, '```');
  return sections.join('\n');
}

async function createIssue(payload) {
  const token = process.env.GITHUB_ISSUES_TOKEN;
  if (!token) return { ok: false, configurationError: true };
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/issues`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'squad-maker-feedback-relay',
    },
    body: JSON.stringify({
      title: `[제보] ${payload.title}`,
      body: issueBody(payload),
      labels: [LABEL],
    }),
  });
  if (!response.ok) return { ok: false };
  const issue = await response.json();
  return { ok: true, number: issue.number };
}

module.exports = async function handler(request, response) {
  const origin = requestOrigin(request);
  const hasOrigin = Boolean(request.headers.origin);
  if (hasOrigin && !origin) return send(response, 403, { error: '허용되지 않은 요청입니다.' });

  if (request.method === 'OPTIONS') {
    if (!origin) return send(response, 403, { error: '허용되지 않은 요청입니다.' });
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return send(response, 204, {}, origin);
  }

  if (request.method === 'GET') {
    const siteKey = process.env.TURNSTILE_SITE_KEY;
    if (!siteKey) return send(response, 503, { error: '제보 창구 설정이 완료되지 않았습니다.' }, origin);
    return send(response, 200, { turnstileSiteKey: siteKey }, origin);
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST, OPTIONS');
    return send(response, 405, { error: '지원하지 않는 요청 방식입니다.' }, origin);
  }
  if (!origin) return send(response, 403, { error: '허용되지 않은 요청입니다.' });

  const contentType = String(request.headers['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) {
    return send(response, 415, { error: 'JSON 요청만 허용됩니다.' }, origin);
  }

  const raw = request.body && typeof request.body === 'object' ? request.body : {};
  if (raw.repository !== REPOSITORY) {
    return send(response, 400, { error: '잘못된 저장소입니다.' }, origin);
  }
  if (cleanText(raw.website, 200)) return send(response, 400, { error: '제보를 처리하지 못했습니다.' }, origin);

  const startedAt = Number(raw.startedAt);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1500 || Date.now() - startedAt > 60 * 60 * 1000) {
    return send(response, 400, { error: '제보 화면을 다시 열고 작성해 주세요.' }, origin);
  }

  const payload = {
    title: cleanText(raw.title, 100),
    description: cleanText(raw.description, 4000, true),
    contact: cleanText(raw.contact, 200),
    appVersion: cleanText(raw.appVersion, 80),
    platform: raw.platform === 'web' ? 'web' : '',
    diagnostics: cleanText(raw.diagnostics?.summary, 1500, true),
  };
  if (!payload.title || !payload.description || !payload.appVersion || !payload.platform) {
    return send(response, 400, { error: '필수 입력을 확인해 주세요.' }, origin);
  }

  const ip = clientIp(request);
  if (!withinRateLimit(ip)) {
    return send(response, 429, { error: '제보 요청이 너무 많습니다. 10분 뒤 다시 시도해 주세요.' }, origin);
  }

  let captchaValid = false;
  try {
    captchaValid = await verifyTurnstile(cleanText(raw.turnstileToken, 2048), ip);
  } catch {}
  if (!captchaValid) {
    return send(response, 400, { error: '스팸 방지 확인에 실패했습니다. 다시 확인해 주세요.' }, origin);
  }

  let result;
  try {
    result = await createIssue(payload);
  } catch {
    return send(response, 502, { error: 'GitHub에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, origin);
  }
  if (result.configurationError) {
    return send(response, 503, { error: '제보 창구 설정이 완료되지 않았습니다.' }, origin);
  }
  if (!result.ok || !Number.isInteger(result.number)) {
    return send(response, 502, { error: '제보를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, origin);
  }
  return send(response, 201, { issueNumber: result.number }, origin);
};

module.exports._test = {
  REPOSITORY,
  LABEL,
  cleanText,
  issueBody,
  requestOrigin,
  withinRateLimit,
};
