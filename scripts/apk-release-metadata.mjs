import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const APPLICATION_ID = 'com.jaywapp.squadmaker.preview';
export const CERTIFICATE_SHA256 = 'd5f7ede86e1020419ccb6a7a97fa3b8072ee6522ac878787641f19d5c33771b6';
export const APK_NAME = 'squad-maker-latest.apk';
const SHA = /^[a-f0-9]{40}$/;
const VERSION = /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/;

export function createPlan({ gradleSource, sourceSha, commitCount, repository }) {
  if (!SHA.test(sourceSha || '') || repository !== 'jaywapp/squad-maker') throw new Error('Invalid build source context');
  if (!Number.isSafeInteger(commitCount) || commitCount < 1) throw new Error('Invalid commit count');
  const codes = [...gradleSource.matchAll(/^\s*versionCode\s+(\d+)\s*$/gm)];
  const names = [...gradleSource.matchAll(/^\s*versionName\s+"([^"]+)"\s*$/gm)];
  if (codes.length !== 1 || names.length !== 1) throw new Error('Expected one literal Gradle base version');
  const baseVersionCode = Number(codes[0][1]);
  const baseVersionName = names[0][1];
  const versionCode = Math.max(baseVersionCode, 1002) + commitCount;
  if (!Number.isSafeInteger(baseVersionCode) || baseVersionCode < 1 || !Number.isSafeInteger(versionCode) || versionCode > 2100000000) throw new Error('Version code exceeds Android bounds');
  if (!VERSION.test(baseVersionName)) throw new Error('Unsupported base version name');
  return { schemaVersion: 1, repository, sourceSha, commitCount, baseVersionCode, baseVersionName,
    versionCode, versionName: `${baseVersionName}.main.${commitCount}.${sourceSha.slice(0, 8)}`,
    applicationId: APPLICATION_ID, minSdk: 24, targetSdk: 36 };
}

export function validatePlan(plan) {
  const expected = createPlan({ gradleSource: `versionCode ${plan.baseVersionCode}\nversionName "${plan.baseVersionName}"`, ...plan });
  for (const key of Object.keys(expected)) if (plan[key] !== expected[key]) throw new Error(`Invalid release plan: ${key}`);
  return plan;
}

export function parseBadging(text) {
  const pkg = text.match(/^package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'/m);
  const min = text.match(/^(?:sdkVersion|minSdkVersion):'(\d+)'/im);
  const target = text.match(/^targetSdkVersion:'(\d+)'/im);
  if (!pkg || !min || !target) throw new Error('Incomplete APK identity');
  return { applicationId: pkg[1], versionCode: Number(pkg[2]), versionName: pkg[3], minSdk: Number(min[1]), targetSdk: Number(target[1]) };
}

export function checkIdentity(identity, plan) {
  validatePlan(plan);
  for (const key of ['applicationId', 'versionCode', 'versionName', 'minSdk', 'targetSdk']) {
    if (identity[key] !== plan[key]) throw new Error(`APK identity mismatch: ${key}`);
  }
  return identity;
}

export function parseSignature(text) {
  const certs = [...text.matchAll(/^Signer #\d+ certificate SHA-256 digest: ([a-f\d]{64})\s*$/gim)];
  if (certs.length !== 1 || certs[0][1].toLowerCase() !== CERTIFICATE_SHA256) throw new Error('APK signing certificate mismatch');
  for (const version of [2, 3]) {
    if (!new RegExp(`^Verified using v${version} scheme[^\\r\\n]*: true\\s*$`, 'm').test(text)) throw new Error(`APK signature v${version} is not verified`);
  }
  return { certificateSha256: CERTIFICATE_SHA256, signatureSchemes: ['v2', 'v3'] };
}

export function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

function inspect(apk, sdk) {
  const tool = join(sdk, 'build-tools', '36.0.0', process.platform === 'win32' ? 'aapt2.exe' : 'aapt2');
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('SQUAD_PREVIEW_')));
  try { return parseBadging(execFileSync(tool, ['dump', 'badging', apk], { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] })); }
  catch { throw new Error('APK identity inspection failed'); }
}

export function collectSigned({ plan, identity, signatureText, apkBytes, unsignedBytes, generatedAt = new Date().toISOString() }) {
  checkIdentity(identity, plan);
  const signature = parseSignature(signatureText);
  if (!apkBytes.length || !unsignedBytes.length) throw new Error('Empty APK');
  return { ...plan, ...signature, apk: { fileName: APK_NAME, sha256: sha256(apkBytes), size: apkBytes.length },
    unsignedApkSha256: sha256(unsignedBytes), generatedAt };
}

function options(args) {
  const values = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!/^--[a-z-]+$/.test(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Invalid command arguments');
    values[args[i].slice(2)] = args[i + 1];
  }
  return values;
}

export function main(args) {
  const command = args[0];
  const opts = options(args.slice(1));
  if (command === 'plan') {
    const plan = createPlan({ gradleSource: readFileSync(opts.gradle, 'utf8'), sourceSha: opts.sha,
      commitCount: Number(opts.count), repository: opts.repository });
    mkdirSync(resolve(opts.out, '..'), { recursive: true });
    writeFileSync(opts.out, `${JSON.stringify(plan, null, 2)}\n`);
    process.stdout.write(`Version ${plan.versionName} (${plan.versionCode})\n`);
    return;
  }
  const plan = validatePlan(JSON.parse(readFileSync(opts.plan, 'utf8')));
  const identity = checkIdentity(inspect(opts.apk, opts.sdk), plan);
  if (command === 'inspect-unsigned') { process.stdout.write(`APK identity verified: ${identity.versionCode}\n`); return; }
  if (command !== 'collect-signed') throw new Error('Unknown metadata command');
  const dir = resolve(opts.out);
  if (resolve(opts.apk) !== join(dir, APK_NAME) || statSync(opts.apk).size === 0) throw new Error('Unexpected release APK location');
  const info = collectSigned({ plan, identity, signatureText: readFileSync(opts.signature, 'utf8'),
    apkBytes: readFileSync(opts.apk), unsignedBytes: readFileSync(opts.unsigned) });
  writeFileSync(join(dir, 'build-info.json'), `${JSON.stringify(info, null, 2)}\n`);
  writeFileSync(join(dir, 'SHA256SUMS.txt'), `${info.apk.sha256}  ${APK_NAME}\n`);
  writeFileSync(join(dir, 'release-notes.md'), `Preview APK — main ${info.sourceSha}\n\n` +
    `- Version: ${info.versionName} (${info.versionCode})\n- Package: ${info.applicationId}\n` +
    `- Android: 7.0+ (API ${info.minSdk}), target API ${info.targetSdk}\n- APK SHA-256: ${info.apk.sha256}\n` +
    `- Certificate SHA-256: ${info.certificateSha256}\n\n` +
    `기존 Preview와 동일한 패키지·서명입니다. 설치 전에 앱에서 .sq 파일을 내보내 별도로 백업하세요. 앱을 삭제하거나 데이터를 초기화하지 마세요.\n\n` +
    `실기기/T7은 미검증입니다. 홈 아이콘, 첫 실행 스플래시·인트로, 인트로 탭, 재진입, 기존 저장 데이터 유지를 직접 확인하세요.\n`);
  process.stdout.write(`Signed APK metadata verified: ${info.apk.sha256}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(process.argv.slice(2)); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
